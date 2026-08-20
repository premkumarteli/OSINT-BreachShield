package com.osint.breachshield.gateway.sms

import android.Manifest
import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log
import androidx.core.content.ContextCompat
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SmsManagerWrapper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private fun getActiveSmsManager(): SmsManager {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                context.getSystemService(SmsManager::class.java) ?: @Suppress("DEPRECATION") SmsManager.getDefault()
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get system SmsManager, fallback to default", e)
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }
    }

    var onStatusChanged: ((requestId: String, status: String) -> Unit)? = null

    fun sendSms(requestId: String, phoneNumber: String, message: String) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "FAILED: SEND_SMS permission is not granted")
            onStatusChanged?.invoke(requestId, "FAILED")
            return
        }

        // Clean and normalize target number (e.g. 10 digits for local Indian network or international +)
        var targetNumber = phoneNumber.trim().replace(" ", "").replace("-", "")
        if (targetNumber.startsWith("+91") && targetNumber.length == 13) {
            // For standard Indian domestic SMS, test 10-digit number format or international
            targetNumber = targetNumber.substring(3)
        }
        if (targetNumber.isBlank()) {
            Log.e(TAG, "FAILED: Phone number is empty")
            onStatusChanged?.invoke(requestId, "FAILED")
            return
        }

        Log.d(TAG, "Attempting SMS dispatch to $targetNumber via SmsManager...")

        val sentIntent = Intent(ACTION_SMS_SENT).apply {
            setPackage(context.packageName)
            putExtra(EXTRA_REQUEST_ID, requestId)
        }
        val deliveredIntent = Intent(ACTION_SMS_DELIVERED).apply {
            setPackage(context.packageName)
            putExtra(EXTRA_REQUEST_ID, requestId)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val sentPI = PendingIntent.getBroadcast(context, requestId.hashCode(), sentIntent, flags)
        val deliveredPI = PendingIntent.getBroadcast(context, (requestId + "_del").hashCode(), deliveredIntent, flags)

        try {
            val manager = getActiveSmsManager()
            val parts = manager.divideMessage(message)
            if (parts.size > 1) {
                val sentIntents = ArrayList<PendingIntent>().apply { repeat(parts.size) { add(sentPI) } }
                val deliveredIntents = ArrayList<PendingIntent>().apply { repeat(parts.size) { add(deliveredPI) } }
                manager.sendMultipartTextMessage(targetNumber, null, parts, sentIntents, deliveredIntents)
            } else {
                manager.sendTextMessage(targetNumber, null, message, sentPI, deliveredPI)
            }
            Log.d(TAG, "SmsManager.sendTextMessage completed successfully for $requestId")
        } catch (e: Exception) {
            Log.e(TAG, "Exception during SmsManager dispatch: ${e.message}", e)
            onStatusChanged?.invoke(requestId, "FAILED")
        }
    }

    fun registerReceivers() {
        val sentReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val requestId = intent?.getStringExtra(EXTRA_REQUEST_ID) ?: return
                val status = when (resultCode) {
                    Activity.RESULT_OK -> "SENT"
                    SmsManager.RESULT_ERROR_GENERIC_FAILURE -> {
                        Log.e(TAG, "Carrier Error: RESULT_ERROR_GENERIC_FAILURE (Check SIM Balance / Network)")
                        "FAILED"
                    }
                    SmsManager.RESULT_ERROR_NO_SERVICE -> {
                        Log.e(TAG, "Carrier Error: RESULT_ERROR_NO_SERVICE")
                        "FAILED"
                    }
                    SmsManager.RESULT_ERROR_RADIO_OFF -> {
                        Log.e(TAG, "Carrier Error: RESULT_ERROR_RADIO_OFF (Airplane Mode)")
                        "FAILED"
                    }
                    SmsManager.RESULT_ERROR_NULL_PDU -> {
                        Log.e(TAG, "Carrier Error: RESULT_ERROR_NULL_PDU")
                        "FAILED"
                    }
                    else -> {
                        Log.e(TAG, "Unknown broadcast resultCode: $resultCode")
                        "FAILED"
                    }
                }
                Log.d(TAG, "Sent broadcast received: $requestId -> $status")
                onStatusChanged?.invoke(requestId, status)
            }
        }

        val deliveredReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val requestId = intent?.getStringExtra(EXTRA_REQUEST_ID) ?: return
                Log.d(TAG, "Delivery broadcast received: $requestId -> DELIVERED")
                onStatusChanged?.invoke(requestId, "DELIVERED")
            }
        }

        sentReceiverRef = sentReceiver
        deliveredReceiverRef = deliveredReceiver

        ContextCompat.registerReceiver(
            context,
            sentReceiver,
            IntentFilter(ACTION_SMS_SENT),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )

        ContextCompat.registerReceiver(
            context,
            deliveredReceiver,
            IntentFilter(ACTION_SMS_DELIVERED),
            ContextCompat.RECEIVER_NOT_EXPORTED
        )
    }

    fun unregisterReceivers() {
        try {
            sentReceiverRef?.let { context.unregisterReceiver(it) }
            sentReceiverRef = null
        } catch (_: Exception) {}
        try {
            deliveredReceiverRef?.let { context.unregisterReceiver(it) }
            deliveredReceiverRef = null
        } catch (_: Exception) {}
    }

    private var sentReceiverRef: BroadcastReceiver? = null
    private var deliveredReceiverRef: BroadcastReceiver? = null

    companion object {
        private const val TAG = "SmsManagerWrapper"
        private const val ACTION_SMS_SENT = "com.osint.breachshield.SMS_SENT"
        private const val ACTION_SMS_DELIVERED = "com.osint.breachshield.SMS_DELIVERED"
        private const val EXTRA_REQUEST_ID = "request_id"
    }
}

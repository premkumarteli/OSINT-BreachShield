package com.osint.breachshield.gateway.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.osint.breachshield.gateway.R
import com.osint.breachshield.gateway.data.db.ConnectionLog
import com.osint.breachshield.gateway.data.db.GatewayDao
import com.osint.breachshield.gateway.data.db.SmsLog
import com.osint.breachshield.gateway.data.ws.ConnectionStatus
import com.osint.breachshield.gateway.data.ws.WebSocketManager
import com.osint.breachshield.gateway.sms.SmsManagerWrapper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class GatewayForegroundService : Service() {

    @Inject lateinit var webSocketManager: WebSocketManager
    @Inject lateinit var smsManagerWrapper: SmsManagerWrapper
    @Inject lateinit var gatewayDao: GatewayDao

    private val scope = CoroutineScope(Dispatchers.IO + Job())

    override fun onCreate() {
        android.util.Log.d("GatewayService", "Service onCreate starting...")
        super.onCreate()
        try {
            createNotificationChannel()
            
            val notification = createNotification("Connecting...")
            android.util.Log.d("GatewayService", "Starting foreground with type dataSync...")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }

            smsManagerWrapper.registerReceivers()
            setupListeners()
            
            android.util.Log.d("GatewayService", "Connecting WebSocket...")
            webSocketManager.connect()
        } catch (e: Exception) {
            android.util.Log.e("GatewayService", "CRASH in onCreate", e)
            throw e
        }
    }

    private fun setupListeners() {
        webSocketManager.onSmsCommandReceived = { command ->
            val requestId = command.requestId
            val message = command.message
            if (requestId != null && message != null) {
                android.util.Log.d("GatewayService", "Received SMS Command: $command")
                scope.launch {
                    gatewayDao.insertSmsLog(
                        SmsLog(
                            requestId = requestId,
                            phoneNumber = command.getTargetPhone(),
                            message = message,
                            status = "PENDING"
                        )
                    )
                    smsManagerWrapper.sendSms(requestId, command.getTargetPhone(), message)
                }
            } else {
                android.util.Log.e("GatewayService", "Invalid SMS Command: $command")
            }
        }

        smsManagerWrapper.onStatusChanged = { requestId, status ->
            android.util.Log.d("GatewayService", "SMS Status Changed: requestId=$requestId, status=$status")
            scope.launch {
                gatewayDao.updateSmsStatus(requestId, status)
                webSocketManager.sendSmsStatus(requestId, status)
            }
        }

        scope.launch {
            webSocketManager.connectionStatus.collectLatest { status ->
                val statusText = when (status) {
                    ConnectionStatus.CONNECTED -> "Connected"
                    ConnectionStatus.CONNECTING -> "Connecting..."
                    ConnectionStatus.DISCONNECTED -> "Disconnected"
                }
                updateNotification(statusText)
                
                gatewayDao.insertConnectionLog(
                    ConnectionLog(
                        status = status.name,
                        message = if (status == ConnectionStatus.CONNECTED) "Gateway Online" else "Gateway Offline"
                    )
                )
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "BreachShield SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(status: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("BreachShield SMS Gateway")
            .setContentText("Status: $status")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(status: String) {
        val notification = createNotification(status)
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        smsManagerWrapper.unregisterReceivers()
        webSocketManager.disconnect()
    }

    companion object {
        private const val CHANNEL_ID = "gateway_service_channel"
        private const val NOTIFICATION_ID = 1
    }
}

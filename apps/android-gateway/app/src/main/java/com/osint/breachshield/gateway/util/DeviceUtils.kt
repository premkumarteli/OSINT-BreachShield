package com.osint.breachshield.gateway.util

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.provider.Settings
import android.telephony.TelephonyManager

object DeviceUtils {

    fun getManufacturer(): String = Build.MANUFACTURER
    fun getModel(): String = Build.MODEL
    fun getAndroidVersion(): String = Build.VERSION.RELEASE
    fun getAppVersion(): String = "1.0.0"

    @SuppressLint("HardwareIds")
    fun getAndroidId(context: Context): String {
        return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
    }

    fun isSimReady(context: Context): Boolean {
        return try {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            tm?.simState == TelephonyManager.SIM_STATE_READY
        } catch (e: Exception) {
            false
        }
    }
}

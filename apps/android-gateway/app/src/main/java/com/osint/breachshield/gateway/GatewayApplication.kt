package com.osint.breachshield.gateway

import android.app.Application
import android.util.Log
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class GatewayApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e("CRITICAL_CRASH", "Uncaught exception in thread ${thread.name}", throwable)
            // You might want to restart the app or just let it die, 
            // but logging is key here.
        }
    }
}

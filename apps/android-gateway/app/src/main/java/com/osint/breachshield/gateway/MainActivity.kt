package com.osint.breachshield.gateway

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.service.GatewayForegroundService
import com.osint.breachshield.gateway.ui.dashboard.DashboardScreen
import com.osint.breachshield.gateway.ui.registration.RegistrationScreen
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

// High-contrast Cyberpunk Dark Color Scheme
private val DarkColors = darkColorScheme(
    primary = Color(0xFF00F3FF),
    onPrimary = Color(0xFF000000),
    secondary = Color(0xFF00FF66),
    onSecondary = Color(0xFF000000),
    background = Color(0xFF0B0F19),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF151C2C),
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    error = Color(0xFFFF3366),
    onError = Color(0xFFFFFFFF)
)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var preferenceManager: PreferenceManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestPermissions()

        val isAlreadyRegistered = preferenceManager.isRegistered()
        if (isAlreadyRegistered) {
            startGatewayService()
        }

        setContent {
            MaterialTheme(colorScheme = DarkColors) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val startDest = remember { if (isAlreadyRegistered) "dashboard" else "registration" }

                    NavHost(
                        navController = navController,
                        startDestination = startDest
                    ) {
                        composable("registration") {
                            RegistrationScreen(
                                onRegistrationSuccess = {
                                    startGatewayService()
                                    navController.navigate("dashboard") {
                                        popUpTo("registration") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(
                                onLogout = {
                                    stopGatewayService()
                                    navController.navigate("registration") {
                                        popUpTo(0) { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.RECEIVE_SMS
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val toRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (toRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, toRequest.toTypedArray(), 101)
        }
    }

    private fun startGatewayService() {
        try {
            val intent = Intent(this, GatewayForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to start service", e)
        }
    }

    private fun stopGatewayService() {
        try {
            val intent = Intent(this, GatewayForegroundService::class.java)
            stopService(intent)
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to stop service", e)
        }
    }
}

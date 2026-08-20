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

// OSINT BreachShield Cyberpunk Dark Color Scheme (Matches Web Dashboard)
val CyberDarkColors = darkColorScheme(
    primary = Color(0xFF00F3FF),         // Cyber Neon Cyan
    onPrimary = Color(0xFF070A13),       // Deep Obsidian Text
    primaryContainer = Color(0xFF0B2538),
    onPrimaryContainer = Color(0xFF00F3FF),
    secondary = Color(0xFF00FF66),       // Terminal Matrix Green
    onSecondary = Color(0xFF070A13),
    secondaryContainer = Color(0xFF0A2E1C),
    onSecondaryContainer = Color(0xFF00FF66),
    tertiary = Color(0xFFA855F7),        // Cyber Purple
    background = Color(0xFF070A13),      // Deep Obsidian Background
    onBackground = Color(0xFFE2E8F0),    // Slate-200 Text
    surface = Color(0xFF0F172A),         // Slate-900 Card Surface
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF1E293B),  // Slate-800 Card Variant & Borders
    onSurfaceVariant = Color(0xFF94A3B8),// Slate-400 Muted Text
    error = Color(0xFFFF003C),           // Critical Neon Red
    onError = Color(0xFFFFFFFF),
    outline = Color(0xFF00F3FF).copy(alpha = 0.3f),
    outlineVariant = Color(0xFF1E293B)
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
            MaterialTheme(colorScheme = CyberDarkColors) {
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

        val neededPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (neededPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, neededPermissions.toTypedArray(), 1001)
        }
    }

    private fun startGatewayService() {
        val intent = Intent(this, GatewayForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopGatewayService() {
        val intent = Intent(this, GatewayForegroundService::class.java)
        stopService(intent)
    }
}

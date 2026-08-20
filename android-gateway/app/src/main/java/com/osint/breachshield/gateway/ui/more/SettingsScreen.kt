package com.osint.breachshield.gateway.ui.more

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: MoreViewModel = hiltViewModel()
) {
    val settings by viewModel.settings.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", color = SlateTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace) },
                navigationIcon = { TextButton(onClick = onBack) { Text("← Back", color = AccentCyan) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBg)
            )
        },
        containerColor = ObsidianBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Server Section
            item {
                Text("SERVER CONFIGURATION", color = SlateTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                Spacer(modifier = Modifier.height(6.dp))
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    SettingItem("Backend URL", settings?.serverUrl ?: "http://127.0.0.1:5000")
                    SettingItem("Environment", settings?.environment?.uppercase() ?: "DEVELOPMENT")
                    SettingItem("API Status", "Connected (REST + WebSocket)")
                }
            }

            // Gateway & SMS Settings
            item {
                Text("GATEWAY & HEARTBEAT", color = SlateTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                Spacer(modifier = Modifier.height(6.dp))
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    SettingItem("Heartbeat Interval", "${settings?.heartbeatIntervalSec ?: 30} seconds")
                    SettingItem("Session Timeout", "${settings?.sessionTimeoutMin ?: 15} minutes")
                    SettingItem("Service State", "Foreground Persistent")
                }
            }

            // Application Information
            item {
                Text("APPLICATION", color = SlateTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                Spacer(modifier = Modifier.height(6.dp))
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    SettingItem("App Version", settings?.appVersion ?: "2.1.0-ADMIN-CONTROL")
                    SettingItem("Platform", "BreachShield Android Control Plane")
                }
            }
        }
    }
}

@Composable
private fun SettingItem(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = SlateTextSecondary, fontSize = 13.sp)
        Text(value, color = SlateTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
    }
}

package com.osint.breachshield.gateway.ui.gateways

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GatewayDetailScreen(
    deviceId: String,
    onBack: () -> Unit,
    viewModel: GatewayViewModel = hiltViewModel()
) {
    val gateways by viewModel.gateways.collectAsState()
    val actionMessage by viewModel.actionMessage.collectAsState()
    val gateway = gateways.find { it.deviceId == deviceId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = gateway?.gatewayId ?: "Gateway Diagnostics",
                        color = SlateTextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("← Back", color = AccentCyan)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ObsidianBg
                )
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
            // Main Status Header Card
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = gateway?.deviceName ?: "Hardware Node",
                                color = SlateTextPrimary,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Device ID: $deviceId",
                                color = SlateTextMuted,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                        StatusBadge(status = gateway?.status ?: "ONLINE")
                    }
                }
            }

            // Hardware Telemetry Card
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "HARDWARE & OS DIAGNOSTICS",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    DetailRow("Manufacturer", gateway?.manufacturer ?: "Google")
                    DetailRow("Device Model", gateway?.model ?: "Pixel 7")
                    DetailRow("Android Version", "Android ${gateway?.androidVersion ?: "14"}")
                    DetailRow("App Version", "BreachShield Gateway ${gateway?.appVersion ?: "2.1"}")
                    DetailRow("Battery Level", "${gateway?.battery ?: 88}%")
                    DetailRow("Network / Signal", gateway?.signal ?: "Wi-Fi (Active)")
                    DetailRow("SIM Card Status", gateway?.simState ?: "READY")
                }
            }

            // Connection & Activity Card
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "CONNECTION & THROUGHPUT",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    DetailRow("Server Link", "ws://127.0.0.1:5000/ws/gateway")
                    DetailRow("Last Heartbeat", "${gateway?.lastSeenSecondsAgo ?: 12} seconds ago")
                    DetailRow("SMS Relayed Today", "${gateway?.smsSentCount ?: 0}")
                }
            }

            // Administrative Actions
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { viewModel.sendAction(deviceId, "PING") },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentCyan, contentColor = ObsidianBg),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Send Ping Test Command", fontWeight = FontWeight.Bold)
                    }

                    if (actionMessage != null) {
                        Text(
                            text = actionMessage ?: "",
                            color = MatrixGreen,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, color = SlateTextSecondary, fontSize = 12.sp)
        Text(text = value, color = SlateTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
    }
}

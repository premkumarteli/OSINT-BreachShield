package com.osint.breachshield.gateway.ui.gateways

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.data.api.GatewayItem
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun GatewaysScreen(
    onSelectGateway: (String) -> Unit,
    viewModel: GatewayViewModel = hiltViewModel()
) {
    val gateways by viewModel.gateways.collectAsState()
    val smsMetrics by viewModel.smsMetrics.collectAsState()
    val recentSmsLogs by viewModel.recentSmsLogs.collectAsState()

    val onlineCount = gateways.count { it.status == "ONLINE" }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 28.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Gateways Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Gateways",
                    color = SlateTextPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "$onlineCount Online / ${gateways.size} Total",
                    color = if (onlineCount > 0) MatrixGreen else CriticalRed,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Gateways List
        if (gateways.isEmpty()) {
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text("No SMS gateway hardware devices registered.", color = SlateTextSecondary, fontSize = 13.sp)
                }
            }
        } else {
            items(gateways) { gw ->
                val isOnline = gw.status == "ONLINE"
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = { onSelectGateway(gw.deviceId) }
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(if (isOnline) MatrixGreen else CriticalRed)
                                )
                                Text(
                                    text = gw.gatewayId,
                                    color = SlateTextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Text(
                                text = "${gw.deviceName} (${gw.model})",
                                color = SlateTextSecondary,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                        StatusBadge(status = gw.status)
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = GlassBorderColor)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("SMS Service", color = SlateTextMuted, fontSize = 10.sp)
                            Text(if (isOnline) "RUNNING" else "STOPPED", color = if (isOnline) MatrixGreen else CriticalRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Column {
                            Text("Heartbeat", color = SlateTextMuted, fontSize = 10.sp)
                            Text("${gw.lastSeenSecondsAgo}s ago", color = SlateTextPrimary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                        Column {
                            Text("SMS Sent", color = SlateTextMuted, fontSize = 10.sp)
                            Text("${gw.smsSentCount}", color = AccentCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }
        }

        // SMS Telemetry KPI Section
        item {
            Text(
                text = "SMS Telemetry",
                color = SlateTextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${smsMetrics?.totalSent ?: 0}", color = SlateTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("Sent Today", color = SlateTextSecondary, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${smsMetrics?.delivered ?: 0}", color = MatrixGreen, fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("Delivered", color = SlateTextSecondary, fontSize = 11.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${smsMetrics?.failed ?: 0}", color = CriticalRed, fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        Text("Failed", color = SlateTextSecondary, fontSize = 11.sp)
                    }
                }
            }
        }

        // Recent Masked SMS Events
        item {
            Text(
                text = "Recent Message Events",
                color = SlateTextSecondary,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }

        if (recentSmsLogs.isEmpty()) {
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text("No SMS messages dispatched today.", color = SlateTextSecondary, fontSize = 12.sp)
                }
            }
        } else {
            items(recentSmsLogs) { log ->
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("OTP → ${log.phone}", color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
                            Text(log.gatewayId, color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                        StatusBadge(status = log.status)
                    }
                }
            }
        }
    }
}

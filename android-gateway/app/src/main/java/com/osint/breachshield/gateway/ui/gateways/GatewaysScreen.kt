package com.osint.breachshield.gateway.ui.gateways

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.data.api.GatewayItem
import com.osint.breachshield.gateway.ui.components.AmbientCyberCanvas
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GatewaysScreen(
    onSelectGateway: (String) -> Unit,
    onNavigateToConsole: () -> Unit = {},
    viewModel: GatewayViewModel = hiltViewModel()
) {
    val gateways by viewModel.gateways.collectAsState()
    val smsMetrics by viewModel.smsMetrics.collectAsState()
    val recentSmsLogs by viewModel.recentSmsLogs.collectAsState()
    val isRegistered by viewModel.isThisDeviceRegistered.collectAsState()
    val isRegistering by viewModel.isRegisteringDevice.collectAsState()
    val isSendingTestSms by viewModel.isSendingTestSms.collectAsState()
    val actionMessage by viewModel.actionMessage.collectAsState()

    var showTestSmsDialog by remember { mutableStateOf(false) }
    var testPhoneInput by remember { mutableStateOf("+918722611983") }
    var testMessageInput by remember { mutableStateOf("BreachShield Test SMS verification via physical SIM.") }

    val localOnline = if (isRegistered) 1 else 0
    val totalOnline = gateways.count { it.status == "ONLINE" } + localOnline
    val totalGateways = (gateways.size + localOnline).coerceAtLeast(1)

    // Test SMS Modal Dialog
    if (showTestSmsDialog) {
        AlertDialog(
            onDismissRequest = { showTestSmsDialog = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AppIcon(
                        icon = AppIconType.SimCard,
                        modifier = Modifier.size(20.dp),
                        tint = AccentCyan
                    )
                    Text(
                        "DISPATCH TEST SMS",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentCyan
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Target Phone Number", color = SlateTextSecondary, fontSize = 12.sp)
                    OutlinedTextField(
                        value = testPhoneInput,
                        onValueChange = { testPhoneInput = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentCyan,
                            unfocusedBorderColor = GlassBorderColor,
                            focusedTextColor = SlateTextPrimary,
                            unfocusedTextColor = SlateTextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Text("SMS Body Content", color = SlateTextSecondary, fontSize = 12.sp)
                    OutlinedTextField(
                        value = testMessageInput,
                        onValueChange = { testMessageInput = it },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentCyan,
                            unfocusedBorderColor = GlassBorderColor,
                            focusedTextColor = SlateTextPrimary,
                            unfocusedTextColor = SlateTextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(AccentCyan)
                        .tactilePress {
                            viewModel.sendTestSms(testPhoneInput, testMessageInput)
                            showTestSmsDialog = false
                        }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Dispatch SMS", color = ObsidianBg, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showTestSmsDialog = false }) {
                    Text("Cancel", color = SlateTextSecondary)
                }
            },
            containerColor = Color(0xFF0A1324),
            shape = RoundedCornerShape(24.dp)
        )
    }

    AmbientCyberCanvas {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
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
                    Column {
                        Text(
                            text = "HARDWARE RELAYS",
                            color = SlateTextMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.2.sp
                        )
                        Text(
                            text = "GSM Gateways",
                            color = SlateTextPrimary,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    // Online Badge Pill
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background((if (totalOnline > 0) MatrixGreen else CriticalRed).copy(alpha = 0.14f))
                            .border(1.dp, (if (totalOnline > 0) MatrixGreen else CriticalRed).copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                            .padding(horizontal = 10.dp, vertical = 5.dp)
                    ) {
                        Text(
                            text = "$totalOnline Online / $totalGateways Total",
                            color = if (totalOnline > 0) MatrixGreen else CriticalRed,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // Local Device SMS Service Activation Card
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(MatrixGreen.copy(alpha = 0.15f))
                                    .border(1.dp, MatrixGreen.copy(alpha = 0.35f), RoundedCornerShape(10.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                AppIcon(
                                    icon = AppIconType.SimCard,
                                    modifier = Modifier.size(18.dp),
                                    tint = MatrixGreen
                                )
                            }
                            Column {
                                Text(
                                    text = "This Device (Local SIM Relay)",
                                    color = SlateTextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = if (isRegistered) "Active GSM Relay Service" else "Tap to link physical SIM to backend",
                                    color = SlateTextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                        StatusBadge(status = if (isRegistered) "ONLINE" else "STANDBY")
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (!isRegistered) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(AccentCyan)
                                    .tactilePress(enabled = !isRegistering) { viewModel.registerThisDeviceAsGateway() }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Activate Device", color = ObsidianBg, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFF1E293B))
                                .border(1.dp, MatrixGreen.copy(alpha = 0.4f), RoundedCornerShape(12.dp))
                                .tactilePress { showTestSmsDialog = true }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.SimCard,
                                    modifier = Modifier.size(14.dp),
                                    tint = MatrixGreen
                                )
                                Text("Dispatch Test SMS", color = MatrixGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(AccentCyan.copy(alpha = 0.10f))
                            .border(1.dp, AccentCyan.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                            .tactilePress { onNavigateToConsole() }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            AppIcon(
                                icon = AppIconType.Console,
                                modifier = Modifier.size(14.dp),
                                tint = AccentCyan
                            )
                            Text(
                                "Inspect Hardware Relay Console",
                                color = AccentCyan,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            AppIcon(
                                icon = AppIconType.ChevronRight,
                                modifier = Modifier.size(12.dp),
                                tint = AccentCyan
                            )
                        }
                    }

                    if (actionMessage != null) {
                        Text(
                            text = actionMessage ?: "",
                            color = MatrixGreen,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }

            // Gateways List
            if (gateways.isEmpty()) {
                item {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Text("No remote SMS gateway hardware devices registered.", color = SlateTextSecondary, fontSize = 13.sp)
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
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
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
                        HorizontalDivider(color = GlassBorderColor.copy(alpha = 0.08f))
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Service Status", color = SlateTextMuted, fontSize = 10.sp)
                                Text(if (isOnline) "ONLINE" else "STOPPED", color = if (isOnline) MatrixGreen else CriticalRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
                            Text("${smsMetrics?.totalSent ?: 0}", color = SlateTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("Sent Today", color = SlateTextSecondary, fontSize = 11.sp)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${smsMetrics?.delivered ?: 0}", color = MatrixGreen, fontSize = 22.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("Delivered", color = SlateTextSecondary, fontSize = 11.sp)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${smsMetrics?.failed ?: 0}", color = CriticalRed, fontSize = 22.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.SimCard,
                                    modifier = Modifier.size(16.dp),
                                    tint = AccentCyan
                                )
                                Column {
                                    Text("OTP → ${log.phone}", color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace)
                                    Text(log.gatewayId, color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                }
                            }
                            StatusBadge(status = log.status)
                        }
                    }
                }
            }
        }
    }
}

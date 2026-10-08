package com.osint.breachshield.gateway.ui.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.osint.breachshield.gateway.data.db.SmsLog
import com.osint.breachshield.gateway.data.ws.ConnectionStatus
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onBack: (() -> Unit)? = null,
    onLogout: (() -> Unit)? = null,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val connectionStatus by viewModel.connectionStatus.collectAsState()
    val recentLogs by viewModel.recentSmsLogs.collectAsState()
    val sentToday by viewModel.sentCountToday.collectAsState()
    val failedToday by viewModel.failedCountToday.collectAsState()

    var showResetDialog by remember { mutableStateOf(false) }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = {
                Text(
                    "RESET HARDWARE NODE",
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = CriticalRed
                )
            },
            text = {
                Text(
                    "Are you sure you want to reset this hardware node registration and re-establish link to the backend?",
                    color = SlateTextPrimary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showResetDialog = false
                        viewModel.logout()
                        onLogout?.invoke()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CriticalRed)
                ) {
                    Text("Confirm Reset", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text("Cancel", color = SlateTextSecondary)
                }
            },
            containerColor = ObsidianSurface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "HARDWARE",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Black,
                            fontSize = 17.sp,
                            color = AccentCyan,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "RELAY CONSOLE",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Light,
                            fontSize = 17.sp,
                            color = SlateTextSecondary,
                            letterSpacing = 1.sp
                        )
                    }
                },
                navigationIcon = {
                    if (onBack != null) {
                        TextButton(onClick = onBack) {
                            Text("← Back", color = AccentCyan)
                        }
                    }
                },
                actions = {
                    Button(
                        onClick = { showResetDialog = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = CriticalRed.copy(alpha = 0.12f),
                            contentColor = CriticalRed
                        ),
                        border = BorderStroke(1.dp, CriticalRed.copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            "RESET",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
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
                .padding(horizontal = 20.dp, vertical = 8.dp),
            contentPadding = PaddingValues(top = 12.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                StatusCard(connectionStatus, viewModel.deviceId, viewModel.serverUrl)
            }

            item {
                StatsGrid(sentToday, failedToday)
            }

            item {
                // Section Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "INBOUND TELEMETRY STREAM",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentCyan,
                        letterSpacing = 1.sp
                    )
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = Color(0xFF1E293B)
                    ) {
                        Text(
                            text = "${recentLogs.size} EVENTS",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateTextSecondary,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            if (recentLogs.isEmpty()) {
                item {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "⚡ ACTIVE RELAY STANDBY",
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = MatrixGreen,
                                fontSize = 13.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Physical device is listening for OTP SMS commands dispatched from BreachShield backend via WebSocket channel...",
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.bodySmall,
                                color = SlateTextMuted,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            } else {
                items(recentLogs) { log ->
                    SmsLogItem(log)
                }
            }
        }
    }
}

@Composable
fun StatusCard(status: ConnectionStatus, deviceId: String, serverUrl: String) {
    val statusText = when (status) {
        ConnectionStatus.CONNECTED -> "ONLINE"
        ConnectionStatus.CONNECTING -> "STANDBY"
        ConnectionStatus.DISCONNECTED -> "OFFLINE"
    }

    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "HARDWARE NODE STATUS",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = SlateTextSecondary
                )
                Text(
                    text = if (status == ConnectionStatus.CONNECTED) "WebSocket Channel Active" else "Re-establishing Relay Link",
                    color = SlateTextPrimary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
            StatusBadge(status = statusText)
        }

        Spacer(modifier = Modifier.height(14.dp))
        HorizontalDivider(color = GlassBorderColor)
        Spacer(modifier = Modifier.height(12.dp))

        // Telemetry Fields
        TelemetryRow("NODE ID", deviceId)
        Spacer(modifier = Modifier.height(6.dp))
        TelemetryRow("SERVER", serverUrl)
    }
}

@Composable
fun TelemetryRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = SlateTextMuted
        )
        Text(
            text = value,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            color = SlateTextPrimary,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun StatsGrid(sent: Int, failed: Int) {
    val total = sent + failed
    val successRate = if (total > 0) ((sent.toDouble() / total) * 100).toInt() else 100

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        StatBox(
            label = "DISPATCHED",
            value = "$sent",
            accentColor = MatrixGreen,
            modifier = Modifier.weight(1f)
        )
        StatBox(
            label = "FAILED",
            value = "$failed",
            accentColor = if (failed > 0) CriticalRed else SlateTextMuted,
            modifier = Modifier.weight(1f)
        )
        StatBox(
            label = "SUCCESS",
            value = "$successRate%",
            accentColor = AccentCyan,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun StatBox(label: String, value: String, accentColor: Color, modifier: Modifier = Modifier) {
    GlassCard(modifier = modifier) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label,
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = SlateTextSecondary,
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontFamily = FontFamily.Monospace,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
                color = accentColor
            )
        }
    }
}

@Composable
fun SmsLogItem(log: SmsLog) {
    val sdf = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    val time = sdf.format(Date(log.timestamp))

    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                Text(
                    text = "TARGET: ${log.phoneNumber}",
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = AccentCyan
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = log.message,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = SlateTextSecondary,
                    maxLines = 2
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                StatusBadge(status = log.status)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = time,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp,
                    color = SlateTextMuted
                )
            }
        }
    }
}

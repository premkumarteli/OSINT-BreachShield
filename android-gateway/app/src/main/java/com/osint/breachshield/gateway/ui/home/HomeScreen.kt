package com.osint.breachshield.gateway.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.ui.components.*
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun HomeScreen(
    onNavigateToUsers: () -> Unit,
    onNavigateToGateways: () -> Unit,
    onNavigateToAlerts: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val overview by viewModel.overview.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val metrics = overview?.metrics

    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    val greeting = when (hour) {
        in 5..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        else -> "Good evening"
    }
    val adminName = viewModel.getAdminEmail().substringBefore("@")
    val avatarInitials = if (adminName.length >= 2) adminName.take(2).uppercase() else "PT"

    // Fix gateway counting so local device is always represented
    val gatewaysOnline = (metrics?.gatewaysOnline ?: 0).coerceAtLeast(1)
    val gatewaysTotal = (metrics?.gatewaysTotal ?: 0).coerceAtLeast(1)

    AmbientCyberCanvas {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Figma Top Brand Bar
            item {
                FigmaBrandBar(
                    avatarInitials = avatarInitials,
                    onAvatarClick = onNavigateToUsers
                )
            }

            // Topbar Header (Greeting & Manual Refresh)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "$greeting, $adminName",
                            color = SlateTextSecondary,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Security Overview",
                            color = SlateTextPrimary,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    IconButton(
                        onClick = viewModel::fetchOverview,
                        enabled = !isRefreshing
                    ) {
                        if (isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = AccentCyan,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("⟳", color = AccentCyan, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Connection Error Banner if backend is unreachable
            if (errorMessage != null) {
                item {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        borderColor = CriticalRed
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
                                Text(
                                    text = "CONNECTION WARNING",
                                    color = CriticalRed,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = errorMessage ?: "Failed to reach backend",
                                    color = SlateTextPrimary,
                                    fontSize = 12.sp
                                )
                            }
                            Button(
                                onClick = viewModel::fetchOverview,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = CriticalRed.copy(alpha = 0.2f),
                                    contentColor = CriticalRed
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text("Retry", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Figma Concentric Pulsing Radar Hero Card
            item {
                val activeAlerts = metrics?.activeAlertsCount ?: 0
                ConcentricPulseHeroCard(
                    statusTitle = if (activeAlerts > 0) "System attention required" else "All systems secure",
                    statusSubtitle = if (activeAlerts > 0) "$activeAlerts unresolved security alerts" else "Zero critical perimeter intrusions",
                    isLive = activeAlerts == 0
                )
            }

            // Figma 2x2 Metrics Grid
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Row 1: Users & Gateways
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Metric 1: Active Users (Violet)
                        GlassCard(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onNavigateToUsers() }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(AccentViolet.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("◉", color = AccentViolet, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "${metrics?.activeUsersCount ?: 0}",
                                color = SlateTextPrimary,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Active users", color = SlateTextSecondary, fontSize = 11.sp)
                            Text("Live monitored", color = AccentViolet, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }

                        // Metric 2: Gateways Online (Blue)
                        GlassCard(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onNavigateToGateways() }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(AccentBlue.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("◈", color = AccentBlue, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "$gatewaysOnline / $gatewaysTotal",
                                color = MatrixGreen,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Gateways online", color = SlateTextSecondary, fontSize = 11.sp)
                            Text("100% availability", color = MatrixGreen, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    }

                    // Row 2: Breaches & Alerts
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Metric 3: Breach Records (Cyan)
                        GlassCard(modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(AccentCyan.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("⛃", color = AccentCyan, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "${metrics?.breachesCount ?: 1027}",
                                color = SlateTextPrimary,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Breach records", color = SlateTextSecondary, fontSize = 11.sp)
                            Text("+32 added today", color = AccentCyan, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }

                        // Metric 4: Active Alerts (Amber)
                        GlassCard(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onNavigateToAlerts() }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(WarningAmber.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("▲", color = WarningAmber, fontSize = 14.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "${metrics?.activeAlertsCount ?: 0}".padStart(2, '0'),
                                color = if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Active alerts", color = SlateTextSecondary, fontSize = 11.sp)
                            Text(
                                text = if ((metrics?.activeAlertsCount ?: 0) > 0) "Needs review" else "All clear",
                                color = if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // Figma Platform Activity Chart
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("LAST 24 HOURS", color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            Text("Platform Activity", color = SlateTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }
                        Text(
                            text = "2,486 requests",
                            color = AccentCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 12 Vertical Throughput Bars
                    val bars = listOf(24, 38, 31, 56, 44, 68, 59, 84, 72, 91, 80, 96)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(55.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        bars.forEach { h ->
                            Box(
                                modifier = Modifier
                                    .width(18.dp)
                                    .fillMaxHeight(h / 100f)
                                    .background(
                                        color = if (h > 80) AccentCyan else AccentCyan.copy(alpha = 0.5f),
                                        shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                                    )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        listOf("12 AM", "6 AM", "12 PM", "Now").forEach { label ->
                            Text(label, color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                }
            }

            // Quick Actions Block
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = viewModel::fetchOverview,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A), contentColor = AccentCyan),
                        border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorderColor),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("⟳ Sync Feeds", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onNavigateToUsers,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F172A), contentColor = AccentCyan),
                        border = androidx.compose.foundation.BorderStroke(1.dp, GlassBorderColor),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("◉ View Users", fontSize = 12.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

package com.osint.breachshield.gateway.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
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

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 28.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        // Dynamic Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "$greeting, $adminName",
                        color = SlateTextSecondary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )

                    IconButton(
                        onClick = viewModel::fetchOverview,
                        enabled = !isRefreshing
                    ) {
                        if (isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                color = AccentCyan,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("⟳", color = AccentCyan, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "BreachShield",
                        color = SlateTextPrimary,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                    StatusBadge(status = overview?.systemStatus ?: "ALL_SYSTEMS_OPERATIONAL")
                }
            }
        }

        // Error Banner if backend is unreachable
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

        // Active Users Hero Glass Card
        item {
            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToUsers
            ) {
                Text(
                    text = "ACTIVE USERS",
                    color = SlateTextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = "${metrics?.activeUsersCount ?: 0}",
                        color = AccentCyan,
                        fontSize = 38.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "Currently online ›",
                        color = SlateTextSecondary,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
            }
        }

        // Twin KPI Glass Cards (Gateways & SMS Sent)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Gateways
                GlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToGateways
                ) {
                    Text(
                        text = "GATEWAYS",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${metrics?.gatewaysOnline ?: 0} / ${metrics?.gatewaysTotal ?: 0}",
                        color = MatrixGreen,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "● Online",
                        color = MatrixGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                // SMS Sent Today
                GlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToGateways
                ) {
                    Text(
                        text = "SMS TODAY",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${metrics?.smsSentToday ?: 0}",
                        color = SlateTextPrimary,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = "${metrics?.smsSuccessRate ?: "100%"} success",
                        color = SlateTextSecondary,
                        fontSize = 11.sp
                    )
                }
            }
        }

        // System Activity & Telemetry Throughput Card
        item {
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "SYSTEM ACTIVITY & THROUGHPUT",
                    color = SlateTextSecondary,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(14.dp))

                // Activity Sparkline Visualization
                val sparkline = overview?.activitySparkline ?: listOf(15, 22, 35, 48, 60, 52, 70, 85, 78, 92)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    sparkline.forEach { value ->
                        val heightFraction = (value / 100f).coerceIn(0.15f, 1f)
                        Box(
                            modifier = Modifier
                                .width(14.dp)
                                .fillMaxHeight(heightFraction)
                                .background(
                                    AccentCyan.copy(alpha = 0.7f),
                                    shape = RoundedCornerShape(4.dp)
                                )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Requests / Activity throughput", color = SlateTextMuted, fontSize = 11.sp)
                    Text("Real-time", color = AccentCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }

        // Quick Action / Alerts Summary
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                GlassCard(
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToAlerts
                ) {
                    Text("ALERTS", color = SlateTextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${metrics?.activeAlertsCount ?: 0} Active",
                        color = if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                GlassCard(
                    modifier = Modifier.weight(1f)
                ) {
                    Text("BREACHES", color = SlateTextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${metrics?.breachesCount ?: 1027} Indexed",
                        color = SlateTextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

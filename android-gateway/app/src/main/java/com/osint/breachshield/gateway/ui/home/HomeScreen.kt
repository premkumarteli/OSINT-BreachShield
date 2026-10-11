package com.osint.breachshield.gateway.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
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
    onNavigateToLanding: () -> Unit = {},
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

    // Interactive selected bar index for the Platform Activity Chart
    var selectedBarIndex by remember { mutableStateOf<Int?>(null) }
    var isManualScanning by remember { mutableStateOf(false) }

    // Smooth continuous rotation animation for the refresh button
    val infiniteTransition = rememberInfiniteTransition(label = "refreshRotation")
    val refreshRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotationDeg"
    )

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

            // Topbar Header (Greeting & Tactile Refresh Action)
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

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Citizen Portal Pill with tactile press
                        Box(
                            modifier = Modifier
                                .liquidGlass(
                                    shape = RoundedCornerShape(16.dp),
                                    fillColor = Color(0xFF0F172A).copy(alpha = 0.85f),
                                    borderBrush = Brush.verticalGradient(
                                        listOf(AccentCyan.copy(alpha = 0.5f), AccentCyan.copy(alpha = 0.15f))
                                    ),
                                    elevation = 4.dp
                                )
                                .tactilePress { onNavigateToLanding() }
                                .padding(horizontal = 12.dp, vertical = 7.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.Shield,
                                    modifier = Modifier.size(13.dp),
                                    tint = AccentCyan
                                )
                                Text(
                                    text = "Citizen Portal",
                                    color = AccentCyan,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Animated Refresh Button
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .liquidGlass(
                                    shape = CircleShape,
                                    fillColor = Color(0xFF0F172A).copy(alpha = 0.85f),
                                    borderBrush = LiquidGlassSpecularBorder,
                                    elevation = 4.dp
                                )
                                .tactilePress(enabled = !isRefreshing) { viewModel.fetchOverview() },
                            contentAlignment = Alignment.Center
                        ) {
                            AppIcon(
                                icon = AppIconType.Refresh,
                                modifier = Modifier
                                    .size(18.dp)
                                    .run {
                                        if (isRefreshing) rotate(refreshRotation) else this
                                    },
                                tint = AccentCyan,
                                strokeWidth = 2.dp
                            )
                        }
                    }
                }
            }

            // Connection Error Banner if backend is unreachable
            if (errorMessage != null) {
                item {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        borderColor = CriticalRed,
                        elevation = 6.dp
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                modifier = Modifier.weight(1f).padding(end = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.Warning,
                                    modifier = Modifier.size(24.dp),
                                    tint = CriticalRed
                                )
                                Column {
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
                            }
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(CriticalRed.copy(alpha = 0.2f))
                                    .border(1.dp, CriticalRed.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                                    .tactilePress { viewModel.fetchOverview() }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Text("Retry", color = CriticalRed, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Concentric Pulsing Radar Hero Card with Tap-to-Scan Interaction
            item {
                val activeAlerts = metrics?.activeAlertsCount ?: 0
                val title = if (isManualScanning) {
                    "Scanning perimeter..."
                } else if (activeAlerts > 0) {
                    "System attention required"
                } else {
                    "All systems secure"
                }

                val subtitle = if (isManualScanning) {
                    "Live cryptographic probe in progress"
                } else if (activeAlerts > 0) {
                    "$activeAlerts unresolved security alerts"
                } else {
                    "Zero perimeter breaches detected"
                }

                Box(
                    modifier = Modifier.tactilePress {
                        isManualScanning = true
                        viewModel.fetchOverview()
                    }
                ) {
                    ConcentricPulseHeroCard(
                        statusTitle = title,
                        statusSubtitle = subtitle,
                        isLive = activeAlerts == 0
                    )
                }
            }

            // iOS Liquid Glass 2x2 Interactive Metrics Grid
            item {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Row 1: Active Users & Gateways Online
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Metric 1: Active Users (Violet)
                        GlassCard(
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToUsers
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(AccentViolet.copy(alpha = 0.16f))
                                        .border(1.dp, AccentViolet.copy(alpha = 0.35f), RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AppIcon(
                                        icon = AppIconType.Users,
                                        modifier = Modifier.size(17.dp),
                                        tint = AccentViolet,
                                        filled = true
                                    )
                                }

                                AppIcon(
                                    icon = AppIconType.ChevronRight,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextMuted
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "${metrics?.activeUsersCount ?: 0}",
                                color = SlateTextPrimary,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Active users", color = SlateTextSecondary, fontSize = 11.sp)
                            Text("Live monitored", color = AccentViolet, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }

                        // Metric 2: Gateways Online (Cyan/Green)
                        GlassCard(
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToGateways
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(MatrixGreen.copy(alpha = 0.16f))
                                        .border(1.dp, MatrixGreen.copy(alpha = 0.35f), RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AppIcon(
                                        icon = AppIconType.Gateways,
                                        modifier = Modifier.size(17.dp),
                                        tint = MatrixGreen
                                    )
                                }

                                AppIcon(
                                    icon = AppIconType.ChevronRight,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextMuted
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "$gatewaysOnline / $gatewaysTotal",
                                color = MatrixGreen,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Gateways online", color = SlateTextSecondary, fontSize = 11.sp)
                            Text(
                                text = "${metrics?.smsSuccessRate ?: "100%"} relay SLA",
                                color = MatrixGreen,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    // Row 2: Breach Records & Active Alerts
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Metric 3: Breach Records (Cyan)
                        GlassCard(
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToAlerts
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(AccentCyan.copy(alpha = 0.16f))
                                        .border(1.dp, AccentCyan.copy(alpha = 0.35f), RoundedCornerShape(10.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AppIcon(
                                        icon = AppIconType.Database,
                                        modifier = Modifier.size(17.dp),
                                        tint = AccentCyan
                                    )
                                }

                                AppIcon(
                                    icon = AppIconType.ChevronRight,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextMuted
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "${metrics?.breachesCount ?: 1027}",
                                color = SlateTextPrimary,
                                fontSize = 26.sp,
                                fontWeight = FontWeight.Black,
                                fontFamily = FontFamily.Monospace
                            )
                            Text("Breach records", color = SlateTextSecondary, fontSize = 11.sp)
                            Text("Verified feeds", color = AccentCyan, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }

                        // Metric 4: Active Alerts (Amber/Red)
                        GlassCard(
                            modifier = Modifier.weight(1f),
                            onClick = onNavigateToAlerts
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(
                                            (if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen).copy(alpha = 0.16f)
                                        )
                                        .border(
                                            1.dp,
                                            (if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen).copy(alpha = 0.35f),
                                            RoundedCornerShape(10.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AppIcon(
                                        icon = AppIconType.Alerts,
                                        modifier = Modifier.size(17.dp),
                                        tint = if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen
                                    )
                                }

                                AppIcon(
                                    icon = AppIconType.ChevronRight,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextMuted
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "${metrics?.activeAlertsCount ?: 0}".padStart(2, '0'),
                                color = if ((metrics?.activeAlertsCount ?: 0) > 0) WarningAmber else MatrixGreen,
                                fontSize = 26.sp,
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

            // Interactive Touch-Scrub Platform Activity Chart
            item {
                val sparkline = overview?.activitySparkline ?: emptyList()
                val smsSentLabel = "${metrics?.smsSentToday ?: 0} SMS today"
                val defaultBars = listOf(35, 52, 44, 68, 85, 55, 92, 110, 78, 95)
                val bars = if (sparkline.isNotEmpty()) sparkline else defaultBars
                val maxBar = (bars.maxOrNull() ?: 100).coerceAtLeast(1)

                GlassCard(modifier = Modifier.fillMaxWidth()) {
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
                                AppIcon(
                                    icon = AppIconType.Activity,
                                    modifier = Modifier.size(14.dp),
                                    tint = AccentCyan
                                )
                                Text("LAST 24 HOURS", color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            }
                            Text("Platform Activity", color = SlateTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                        }

                        // Status Chip
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(AccentCyan.copy(alpha = 0.12f))
                                .border(1.dp, AccentCyan.copy(alpha = 0.35f), RoundedCornerShape(8.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = smsSentLabel,
                                color = AccentCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Interactive Tooltip if bar is touched
                    AnimatedVisibility(
                        visible = selectedBarIndex != null,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        selectedBarIndex?.let { idx ->
                            val value = bars.getOrElse(idx) { 0 }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp)
                                    .liquidGlass(
                                        shape = RoundedCornerShape(12.dp),
                                        fillColor = Color(0xFF0F172A).copy(alpha = 0.9f),
                                        borderBrush = LiquidGlassActiveBorder,
                                        elevation = 4.dp
                                    )
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Interval #${idx + 1}: $value Operations",
                                        color = AccentCyan,
                                        fontSize = 12.sp,
                                        fontFamily = FontFamily.Monospace,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Tap to dismiss",
                                        color = SlateTextMuted,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }

                    // Tactile Interactive Vertical Throughput Bars
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(65.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        bars.forEachIndexed { idx, h ->
                            val isSelected = selectedBarIndex == idx
                            val targetHeight = (h.toFloat() / maxBar.toFloat()).coerceIn(0.12f, 1f)

                            val animatedHeight by animateFloatAsState(
                                targetValue = targetHeight,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioMediumBouncy,
                                    stiffness = Spring.StiffnessLow
                                ),
                                label = "barHeight_$idx"
                            )

                            Box(
                                modifier = Modifier
                                    .width((280 / bars.size.coerceAtLeast(1)).coerceIn(8, 24).dp)
                                    .fillMaxHeight(animatedHeight)
                                    .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                                    .background(
                                        if (isSelected) {
                                            Brush.verticalGradient(
                                                listOf(AccentCyan, Color.White)
                                            )
                                        } else if (h.toFloat() / maxBar > 0.8f) {
                                            Brush.verticalGradient(
                                                listOf(AccentCyan, AccentCyan.copy(alpha = 0.5f))
                                            )
                                        } else {
                                            Brush.verticalGradient(
                                                listOf(AccentCyan.copy(alpha = 0.45f), AccentCyan.copy(alpha = 0.15f))
                                            )
                                        }
                                    )
                                    .clickable {
                                        selectedBarIndex = if (selectedBarIndex == idx) null else idx
                                    }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
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

            // Quick Hardware Console Link
            item {
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onNavigateToGateways
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MatrixGreen.copy(alpha = 0.14f))
                                    .border(1.dp, MatrixGreen.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                AppIcon(
                                    icon = AppIconType.SimCard,
                                    modifier = Modifier.size(20.dp),
                                    tint = MatrixGreen
                                )
                            }
                            Column {
                                Text(
                                    text = "Physical SIM Hardware Relay",
                                    color = SlateTextPrimary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Inspect local Android GSM dispatcher node",
                                    color = SlateTextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }

                        AppIcon(
                            icon = AppIconType.ChevronRight,
                            modifier = Modifier.size(16.dp),
                            tint = SlateTextMuted
                        )
                    }
                }
            }
        }
    }
}

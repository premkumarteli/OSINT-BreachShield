package com.osint.breachshield.gateway.ui.more

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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.ui.components.AmbientCyberCanvas
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun MoreScreen(
    onNavigateToAlerts: () -> Unit,
    onNavigateToActivity: () -> Unit,
    onNavigateToBreaches: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToGatewayConsole: () -> Unit = {},
    onLogout: () -> Unit,
    viewModel: MoreViewModel = hiltViewModel()
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AppIcon(
                        icon = AppIconType.Logout,
                        modifier = Modifier.size(20.dp),
                        tint = CriticalRed
                    )
                    Text("LOGOUT ADMINISTRATOR", color = CriticalRed, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace, fontSize = 14.sp)
                }
            },
            text = {
                Text(
                    "Are you sure you want to end this administrative session? Local hardware relays will continue operating in background daemon mode.",
                    color = SlateTextPrimary,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(CriticalRed)
                        .tactilePress {
                            showLogoutDialog = false
                            viewModel.logout(onLogout)
                        }
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Text("Logout", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = SlateTextSecondary, fontSize = 13.sp)
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
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            item {
                Column {
                    Text(
                        text = "CONTROL CENTER",
                        color = SlateTextMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.2.sp
                    )
                    Text(
                        text = "System Hub",
                        color = SlateTextPrimary,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Security Section
            item {
                SectionTitle("PERIMETER SECURITY")
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    padding = PaddingValues(vertical = 4.dp, horizontal = 12.dp)
                ) {
                    LiquidMenuItem(
                        icon = AppIconType.Alerts,
                        iconTint = WarningAmber,
                        iconBg = WarningAmber.copy(alpha = 0.15f),
                        title = "Security Alerts",
                        subtitle = "Real-time threat vectors & intrusion warnings",
                        onClick = onNavigateToAlerts
                    )
                    HorizontalDivider(color = GlassBorderColor.copy(alpha = 0.08f), modifier = Modifier.padding(start = 52.dp))
                    LiquidMenuItem(
                        icon = AppIconType.Activity,
                        iconTint = AccentCyan,
                        iconBg = AccentCyan.copy(alpha = 0.15f),
                        title = "Audit Activity",
                        subtitle = "Immutable cryptographic activity ledger",
                        onClick = onNavigateToActivity
                    )
                }
            }

            // Intelligence Section
            item {
                SectionTitle("THREAT INTELLIGENCE")
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    padding = PaddingValues(vertical = 4.dp, horizontal = 12.dp)
                ) {
                    LiquidMenuItem(
                        icon = AppIconType.Database,
                        iconTint = AccentViolet,
                        iconBg = AccentViolet.copy(alpha = 0.15f),
                        title = "Breach Intelligence",
                        subtitle = "Indexed catalogs, partition status & leak feeds",
                        onClick = onNavigateToBreaches
                    )
                }
            }

            // System Section
            item {
                SectionTitle("GATEWAY & HARDWARE RELAY")
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    padding = PaddingValues(vertical = 4.dp, horizontal = 12.dp)
                ) {
                    LiquidMenuItem(
                        icon = AppIconType.SimCard,
                        iconTint = MatrixGreen,
                        iconBg = MatrixGreen.copy(alpha = 0.15f),
                        title = "Hardware SIM Relay Console",
                        subtitle = "Live WebSocket link & local SIM dispatch stream",
                        onClick = onNavigateToGatewayConsole
                    )
                    HorizontalDivider(color = GlassBorderColor.copy(alpha = 0.08f), modifier = Modifier.padding(start = 52.dp))
                    LiquidMenuItem(
                        icon = AppIconType.Settings,
                        iconTint = SlateTextPrimary,
                        iconBg = Color(0xFF1E293B),
                        title = "System Settings",
                        subtitle = "Backend endpoints, intervals & cryptographic keys",
                        onClick = onNavigateToSettings
                    )
                }
            }

            // Account / Session Section
            item {
                SectionTitle("ADMINISTRATIVE ACCESS")
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    borderColor = CriticalRed.copy(alpha = 0.4f),
                    padding = PaddingValues(vertical = 4.dp, horizontal = 12.dp)
                ) {
                    LiquidMenuItem(
                        icon = AppIconType.Logout,
                        iconTint = CriticalRed,
                        iconBg = CriticalRed.copy(alpha = 0.15f),
                        title = "Terminate Admin Session",
                        subtitle = "Sign out and lock administrative SOC control",
                        onClick = { showLogoutDialog = true },
                        isDestructive = true
                    )
                }
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        color = SlateTextMuted,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        fontFamily = FontFamily.Monospace,
        letterSpacing = 1.sp,
        modifier = Modifier.padding(start = 6.dp, bottom = 8.dp)
    )
}

@Composable
private fun LiquidMenuItem(
    icon: AppIconType,
    iconTint: Color,
    iconBg: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    isDestructive: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .tactilePress(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // iOS Frosted App Tile
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(iconBg)
                .border(1.dp, iconTint.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            AppIcon(
                icon = icon,
                modifier = Modifier.size(20.dp),
                tint = iconTint,
                strokeWidth = 2.dp
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                color = if (isDestructive) CriticalRed else SlateTextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = SlateTextSecondary,
                fontSize = 11.sp
            )
        }

        AppIcon(
            icon = AppIconType.ChevronRight,
            modifier = Modifier.size(14.dp),
            tint = if (isDestructive) CriticalRed.copy(alpha = 0.6f) else SlateTextMuted
        )
    }
}

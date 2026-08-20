package com.osint.breachshield.gateway.ui.more

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun MoreScreen(
    onNavigateToAlerts: () -> Unit,
    onNavigateToActivity: () -> Unit,
    onNavigateToBreaches: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onLogout: () -> Unit,
    viewModel: MoreViewModel = hiltViewModel()
) {
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("LOGOUT ADMIN", color = CriticalRed, fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to end this administrative session?", color = SlateTextPrimary) },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        viewModel.logout(onLogout)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CriticalRed)
                ) {
                    Text("Logout", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel", color = SlateTextSecondary)
                }
            },
            containerColor = ObsidianSurface
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 28.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Text(
                text = "More",
                color = SlateTextPrimary,
                fontSize = 24.sp,
                fontWeight = FontWeight.Black,
                fontFamily = FontFamily.Monospace
            )
        }

        // Security Section
        item {
            SectionTitle("SECURITY")
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                MenuItem("Alerts", "System warnings & incidents", onNavigateToAlerts)
                Divider(color = GlassBorderColor, modifier = Modifier.padding(vertical = 8.dp))
                MenuItem("Activity", "Administrative & system audit trail", onNavigateToActivity)
            }
        }

        // Intelligence Section
        item {
            SectionTitle("INTELLIGENCE")
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                MenuItem("Breach Intelligence", "Catalog & partition dataset status", onNavigateToBreaches)
            }
        }

        // System Section
        item {
            SectionTitle("SYSTEM")
            GlassCard(modifier = Modifier.fillMaxWidth()) {
                MenuItem("Settings", "Backend connection & intervals", onNavigateToSettings)
            }
        }

        // Account Section
        item {
            SectionTitle("ACCOUNT")
            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                onClick = { showLogoutDialog = true }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Logout Administrator", color = CriticalRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text("⎋", color = CriticalRed, fontSize = 18.sp)
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
        modifier = Modifier.padding(bottom = 6.dp)
    )
}

@Composable
private fun MenuItem(title: String, subtitle: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(title, color = SlateTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
            Text(subtitle, color = SlateTextSecondary, fontSize = 11.sp)
        }
        Text("›", color = SlateTextMuted, fontSize = 18.sp)
    }
}

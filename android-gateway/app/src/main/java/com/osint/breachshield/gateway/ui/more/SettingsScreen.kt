package com.osint.breachshield.gateway.ui.more

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: MoreViewModel = hiltViewModel()
) {
    val settings by viewModel.settings.collectAsState()
    val pingResult by viewModel.pingResult.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()

    var serverUrlInput by remember(settings?.serverUrl) { mutableStateOf(settings?.serverUrl ?: "http://10.18.86.96:5000") }
    var smsTemplateInput by remember(settings?.smsOtpTemplate) { mutableStateOf(settings?.smsOtpTemplate ?: "Your BreachShield OTP is {OTP}. Valid for 5 minutes.") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings & Control", color = SlateTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace) },
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
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            // Status Feedback Banner
            if (statusMessage != null) {
                item {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        borderColor = AccentCyan
                    ) {
                        Text(
                            text = statusMessage ?: "",
                            color = AccentCyan,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // 1. Live System Toggles
            item {
                SectionHeader("LIVE SYSTEM TOGGLES")
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    // Telegram Threat Scraper Toggle
                    ToggleRow(
                        title = "Telegram Threat Scraper",
                        subtitle = "Enable live Telegram OSINT scraper feeds",
                        checked = settings?.enableTelegramScraper ?: true,
                        onCheckedChange = { checked ->
                            viewModel.updateSetting(enableTelegramScraper = checked)
                        }
                    )

                    HorizontalDivider(color = GlassBorderColor, modifier = Modifier.padding(vertical = 10.dp))

                    // Email Fallback Toggle
                    ToggleRow(
                        title = "SMS Email Fallback",
                        subtitle = "Fallback to Gmail SMTP if SIM gateway is offline",
                        checked = settings?.fallbackToEmail ?: true,
                        onCheckedChange = { checked ->
                            viewModel.updateSetting(fallbackToEmail = checked)
                        }
                    )

                    HorizontalDivider(color = GlassBorderColor, modifier = Modifier.padding(vertical = 10.dp))

                    // Maintenance Mode Toggle
                    ToggleRow(
                        title = "Platform Maintenance Mode",
                        subtitle = "Temporarily block public breach lookups",
                        checked = settings?.maintenanceMode ?: false,
                        onCheckedChange = { checked ->
                            viewModel.updateSetting(maintenanceMode = checked)
                        }
                    )
                }
            }

            // 2. Security Parameters
            item {
                SectionHeader("SECURITY PARAMETERS")
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    // OTP Expiry
                    Text("OTP Expiry Duration", color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Time before an authentication OTP expires", color = SlateTextSecondary, fontSize = 11.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    val currentExpiry = settings?.otpExpiryMinutes ?: 5
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(2, 5, 10, 15).forEach { minutes ->
                            val isSelected = currentExpiry == minutes
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) AccentCyan.copy(alpha = 0.2f) else Color(0xFF1E293B))
                                    .clickable { viewModel.updateSetting(otpExpiryMinutes = minutes) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${minutes}m",
                                    color = if (isSelected) AccentCyan else SlateTextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = GlassBorderColor)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Session Inactivity Timeout
                    Text("Session Timeout Threshold", color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Inactivity period before website sessions expire", color = SlateTextSecondary, fontSize = 11.sp)
                    Spacer(modifier = Modifier.height(8.dp))

                    val currentTimeout = settings?.sessionTimeoutMin ?: 15
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf(5, 15, 30, 60).forEach { minutes ->
                            val isSelected = currentTimeout == minutes
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) AccentCyan.copy(alpha = 0.2f) else Color(0xFF1E293B))
                                    .clickable { viewModel.updateSetting(sessionTimeoutMin = minutes) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${minutes}m",
                                    color = if (isSelected) AccentCyan else SlateTextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }

            // 3. SMS Message Template Customization
            item {
                SectionHeader("SMS OTP TEMPLATE")
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Text("Custom Message Format", color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("Use {OTP} placeholder where the 6-digit code will appear", color = SlateTextSecondary, fontSize = 11.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = smsTemplateInput,
                        onValueChange = { smsTemplateInput = it },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentCyan,
                            unfocusedBorderColor = GlassBorderColor,
                            focusedTextColor = SlateTextPrimary,
                            unfocusedTextColor = SlateTextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { viewModel.updateSetting(smsOtpTemplate = smsTemplateInput) },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentCyan, contentColor = ObsidianBg),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Save Template", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            // 4. Server Address & Diagnostics
            item {
                SectionHeader("BACKEND CONNECTION & DIAGNOSTICS")
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = serverUrlInput,
                        onValueChange = {
                            serverUrlInput = it
                            viewModel.saveServerUrl(it)
                        },
                        label = { Text("Backend Server URL") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentCyan,
                            unfocusedBorderColor = GlassBorderColor,
                            focusedTextColor = AccentCyan,
                            unfocusedTextColor = SlateTextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = viewModel::testConnection,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B), contentColor = AccentCyan),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Test Backend Connection (Ping)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    if (pingResult != null) {
                        Text(
                            text = pingResult ?: "",
                            color = if (pingResult?.startsWith("●") == true) MatrixGreen else CriticalRed,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
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
private fun ToggleRow(
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(title, color = SlateTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = SlateTextSecondary, fontSize = 11.sp)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = ObsidianBg,
                checkedTrackColor = MatrixGreen,
                uncheckedThumbColor = SlateTextSecondary,
                uncheckedTrackColor = Color(0xFF1E293B)
            )
        )
    }
}

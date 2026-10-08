package com.osint.breachshield.gateway.ui.landing

import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.R
import com.osint.breachshield.gateway.ui.components.AmbientCyberCanvas
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun LandingScreen(
    onNavigateToAdminAuth: () -> Unit,
    viewModel: LandingViewModel = hiltViewModel()
) {
    val identifierType by viewModel.identifierType.collectAsState()
    val targetInput by viewModel.targetInput.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val pingLatency by viewModel.pingLatency.collectAsState()

    val focusManager = LocalFocusManager.current

    AmbientCyberCanvas {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(top = 24.dp, bottom = 48.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Top Navigation & Admin Access Gateway
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Logo + Title
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(AccentCyan.copy(alpha = 0.08f))
                                .border(1.dp, AccentCyan.copy(alpha = 0.35f), RoundedCornerShape(10.dp))
                                .padding(5.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.ic_breachshield_logo),
                                contentDescription = "Logo",
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Column {
                            Text(
                                text = "BREACHSHIELD",
                                color = SlateTextPrimary,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = "KNOW. STAY AHEAD.",
                                color = AccentCyan,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 7.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.5.sp
                            )
                        }
                    }

                    // Admin SOC Portal Launcher Button
                    Button(
                        onClick = onNavigateToAdminAuth,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF0F172A),
                            contentColor = AccentCyan
                        ),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AccentCyan.copy(alpha = 0.45f)),
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text("🔒", fontSize = 12.sp)
                            Text(
                                text = "Admin SOC",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // System Status Beacon
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    StatusBadge(status = if (pingLatency != null) "ONLINE" else "STANDBY")
                    if (pingLatency != null) {
                        Text(
                            text = "Backend Latency: ${pingLatency}ms",
                            color = SlateTextMuted,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // Hero Headline
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "OSINT BREACH INTELLIGENCE",
                        color = AccentCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 2.sp
                    )
                    Text(
                        text = "Detect, Verify & Mitigate Breaches",
                        color = SlateTextPrimary,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        lineHeight = 30.sp
                    )
                    Text(
                        text = "Query your personal email or phone number across 1,027+ dark web archives and live Telegram OSINT scrapers with zero-knowledge cryptography.",
                        color = SlateTextSecondary,
                        fontSize = 13.sp,
                        lineHeight = 19.sp
                    )
                }
            }

            // Interactive Citizen Search Glass Card
            item {
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    // Type Switcher Pills (Email vs Phone)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF070B14))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        listOf("EMAIL" to "Email Address", "PHONE" to "Phone Number").forEach { (type, label) ->
                            val isSelected = identifierType == type
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) AccentCyan.copy(alpha = 0.15f) else Color.Transparent)
                                    .border(
                                        width = if (isSelected) 1.dp else 0.dp,
                                        color = if (isSelected) AccentCyan.copy(alpha = 0.4f) else Color.Transparent,
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                    .clickable { viewModel.setIdentifierType(type) }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    color = if (isSelected) AccentCyan else SlateTextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Input Field
                    OutlinedTextField(
                        value = targetInput,
                        onValueChange = viewModel::setTargetInput,
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = {
                            Text(
                                text = if (identifierType == "EMAIL") "e.g. user@company.com" else "e.g. +91 98722 61198",
                                color = SlateTextMuted,
                                fontSize = 13.sp
                            )
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentCyan,
                            unfocusedBorderColor = GlassBorderColor,
                            focusedTextColor = SlateTextPrimary,
                            unfocusedTextColor = SlateTextPrimary,
                            cursorColor = AccentCyan
                        ),
                        shape = RoundedCornerShape(14.dp),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = if (identifierType == "EMAIL") KeyboardType.Email else KeyboardType.Phone,
                            imeAction = ImeAction.Search
                        ),
                        keyboardActions = KeyboardActions(onSearch = {
                            focusManager.clearFocus()
                            viewModel.checkCompromiseStatus()
                        })
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Primary Action Button
                    Button(
                        onClick = {
                            focusManager.clearFocus()
                            viewModel.checkCompromiseStatus()
                        },
                        enabled = !isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AccentCyan,
                            contentColor = ObsidianBg
                        ),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = ObsidianBg,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "CHECK COMPROMISE STATUS",
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace,
                                letterSpacing = 1.sp
                            )
                        }
                    }

                    // Status / Result Feedback Banner
                    AnimatedVisibility(visible = statusMessage != null) {
                        Column {
                            Spacer(modifier = Modifier.height(14.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MatrixGreen.copy(alpha = 0.12f))
                                    .border(1.dp, MatrixGreen.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("✓", color = MatrixGreen, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = statusMessage ?: "",
                                        color = MatrixGreen,
                                        fontSize = 12.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                            }
                        }
                    }

                    // Error Feedback Banner
                    AnimatedVisibility(visible = errorMessage != null) {
                        Column {
                            Spacer(modifier = Modifier.height(14.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(CriticalRed.copy(alpha = 0.12f))
                                    .border(1.dp, CriticalRed.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("⚠", color = CriticalRed, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = errorMessage ?: "",
                                        color = CriticalRed,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Live Platform Capability Highlights
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "PLATFORM METRICS & ASSURANCE",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Card 1: Breaches
                        GlassCard(modifier = Modifier.weight(1f)) {
                            Text("1,027+", color = AccentCyan, fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                            Text("Breaches Indexed", color = SlateTextMuted, fontSize = 11.sp)
                        }

                        // Card 2: Partitions
                        GlassCard(modifier = Modifier.weight(1f)) {
                            Text("18,500", color = MatrixGreen, fontSize = 18.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                            Text("Partition Records", color = SlateTextMuted, fontSize = 11.sp)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Card 3: GSM SMS Relay
                        GlassCard(modifier = Modifier.weight(1f)) {
                            Text("GSM Edge", color = WarningAmber, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("SIM Hardware Relay", color = SlateTextMuted, fontSize = 11.sp)
                        }

                        // Card 4: SHA-256 Hashing
                        GlassCard(modifier = Modifier.weight(1f)) {
                            Text("SHA-256", color = AccentViolet, fontSize = 16.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("Zero-Knowledge Hash", color = SlateTextMuted, fontSize = 11.sp)
                        }
                    }
                }
            }

            // Compliance Footnote
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "BreachShield v2.1 • Zero-Retention Cryptographic Security",
                        color = SlateTextMuted,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

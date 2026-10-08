package com.osint.breachshield.gateway.ui.auth

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.R
import com.osint.breachshield.gateway.ui.components.AmbientCyberCanvas
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun AdminLoginScreen(
    onAuthSuccess: () -> Unit,
    onBackToLanding: (() -> Unit)? = null,
    viewModel: AdminAuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val email by viewModel.email.collectAsState()
    val serverUrl by viewModel.serverUrl.collectAsState()
    val otp by viewModel.otp.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val cooldownSeconds by viewModel.cooldownSeconds.collectAsState()
    val pingStatus by viewModel.pingStatus.collectAsState()
    var showServerConfig by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onAuthSuccess()
        }
    }

    // Breathing glow animation for logo
    val infiniteTransition = rememberInfiniteTransition(label = "logoGlow")
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logoScale"
    )

    AmbientCyberCanvas {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            contentPadding = PaddingValues(top = 28.dp, bottom = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Optional Top Back Navigation
            if (onBackToLanding != null) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        TextButton(
                            onClick = onBackToLanding,
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(
                                text = "← Citizen Portal",
                                color = AccentCyan,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // App Branding Header with Glowing Cyber Shield Emblem
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .scale(logoScale)
                            .clip(RoundedCornerShape(22.dp))
                            .background(AccentCyan.copy(alpha = 0.10f))
                            .border(1.5.dp, AccentCyan.copy(alpha = 0.50f), RoundedCornerShape(22.dp))
                            .padding(14.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.ic_breachshield_logo),
                            contentDescription = "BreachShield Shield",
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    Text(
                        text = "BREACHSHIELD",
                        color = AccentCyan,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 2.sp
                    )
                    Text(
                        text = "ADMIN SOC CONTROL CENTER",
                        color = SlateTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        fontFamily = FontFamily.Monospace,
                        letterSpacing = 1.2.sp
                    )
                }
            }

            // Main Authentication Glass Container Card
            item {
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    if (uiState is AuthUiState.EmailEntry) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Administrator Access",
                                color = SlateTextPrimary,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                            IconButton(onClick = { showServerConfig = !showServerConfig }) {
                                Text(
                                    text = if (showServerConfig) "▲" else "⚙",
                                    color = AccentCyan,
                                    fontSize = 15.sp
                                )
                            }
                        }

                        // Server Configuration Accordion Drawer
                        if (showServerConfig) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 14.dp)
                            ) {
                                OutlinedTextField(
                                    value = serverUrl,
                                    onValueChange = viewModel::onServerUrlChange,
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

                                Spacer(modifier = Modifier.height(8.dp))

                                Button(
                                    onClick = viewModel::testServerConnection,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFF1E293B),
                                        contentColor = AccentCyan
                                    ),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "Ping Server Latency",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }

                                if (pingStatus != null) {
                                    Text(
                                        text = pingStatus ?: "",
                                        color = if (pingStatus?.startsWith("●") == true) MatrixGreen else CriticalRed,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(top = 4.dp)
                                    )
                                }
                            }
                        }

                        Text(
                            text = "Enter your configured administrator email to receive a 6-digit authentication token.",
                            color = SlateTextSecondary,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                        )

                        // Quick Demo Email Chips
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            listOf("admin@breachshield.io", "premkumarteli@gmail.com").forEach { preset ->
                                val isSelected = email == preset
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = if (isSelected) AccentCyan.copy(alpha = 0.2f) else Color(0xFF1E293B),
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        if (isSelected) AccentCyan else GlassBorderColor
                                    ),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    TextButton(
                                        onClick = { viewModel.setPresetEmail(preset) },
                                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = preset.substringBefore("@"),
                                            color = if (isSelected) AccentCyan else SlateTextSecondary,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }
                        }

                        OutlinedTextField(
                            value = email,
                            onValueChange = viewModel::onEmailChange,
                            label = { Text("Admin Email") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentCyan,
                                unfocusedBorderColor = GlassBorderColor,
                                focusedTextColor = SlateTextPrimary,
                                unfocusedTextColor = SlateTextPrimary
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (errorMessage != null) {
                            Text(
                                text = errorMessage ?: "",
                                color = CriticalRed,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = viewModel::sendOtp,
                            enabled = !isLoading && email.isNotBlank(),
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
                                CircularProgressIndicator(color = ObsidianBg, modifier = Modifier.size(20.dp))
                            } else {
                                Text(
                                    text = "Continue",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    } else {
                        // OTP Verification Step
                        Text(
                            text = "Verify Code",
                            color = SlateTextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                        Text(
                            text = "Enter the 6-digit code dispatched to\n$email",
                            color = SlateTextSecondary,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
                        )

                        OutlinedTextField(
                            value = otp,
                            onValueChange = viewModel::onOtpChange,
                            label = { Text("6-Digit Code") },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            textStyle = LocalTextStyle.current.copy(
                                textAlign = TextAlign.Center,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 20.sp,
                                letterSpacing = 4.sp
                            ),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentCyan,
                                unfocusedBorderColor = GlassBorderColor,
                                focusedTextColor = AccentCyan,
                                unfocusedTextColor = SlateTextPrimary
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (errorMessage != null) {
                            Text(
                                text = errorMessage ?: "",
                                color = CriticalRed,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = viewModel::verifyOtp,
                            enabled = !isLoading && otp.length == 6,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MatrixGreen,
                                contentColor = ObsidianBg
                            ),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = ObsidianBg, modifier = Modifier.size(20.dp))
                            } else {
                                Text(
                                    text = "Verify & Access SOC",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = viewModel::backToEmail) {
                                Text("Change Email", color = SlateTextSecondary, fontSize = 12.sp)
                            }

                            TextButton(
                                onClick = viewModel::resendOtp,
                                enabled = cooldownSeconds == 0
                            ) {
                                Text(
                                    text = if (cooldownSeconds > 0) "Resend in ${cooldownSeconds}s" else "Resend Code",
                                    color = if (cooldownSeconds > 0) SlateTextMuted else AccentCyan,
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

package com.osint.breachshield.gateway.ui.registration

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun RegistrationScreen(
    onRegistrationSuccess: () -> Unit,
    viewModel: RegistrationViewModel = hiltViewModel()
) {
    var serverUrl by remember { mutableStateOf("http://10.25.185.96:5000") }
    var deviceName by remember { mutableStateOf("BreachShield Node 01") }

    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is RegistrationUiState.Success) {
            onRegistrationSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF070A13),
                        Color(0xFF0B1020),
                        Color(0xFF070A13)
                    )
                )
            )
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A).copy(alpha = 0.95f)),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, Color(0xFF00F3FF).copy(alpha = 0.35f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 12.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Cyber Badge Header
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF00F3FF).copy(alpha = 0.12f),
                    border = BorderStroke(1.dp, Color(0xFF00F3FF).copy(alpha = 0.4f)),
                    modifier = Modifier.padding(bottom = 12.dp)
                ) {
                    Text(
                        text = "🛡️ SECURE SIM RELAY",
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = Color(0xFF00F3FF),
                        letterSpacing = 1.sp
                    )
                }

                Text(
                    text = "OSINT BREACHSHIELD",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF00F3FF),
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = "HARDWARE GATEWAY PROTOCOL v2.0",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp,
                    color = Color(0xFF64748B),
                    modifier = Modifier.padding(top = 4.dp, bottom = 28.dp),
                    textAlign = TextAlign.Center
                )

                OutlinedTextField(
                    value = serverUrl,
                    onValueChange = { serverUrl = it },
                    label = { 
                        Text(
                            "CORE API GATEWAY URL",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        ) 
                    },
                    placeholder = { Text("http://192.168.1.100:5000", color = Color(0xFF475569)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color(0xFFF8FAFC),
                        unfocusedTextColor = Color(0xFFE2E8F0),
                        focusedBorderColor = Color(0xFF00F3FF),
                        unfocusedBorderColor = Color(0xFF1E293B),
                        focusedLabelColor = Color(0xFF00F3FF),
                        unfocusedLabelColor = Color(0xFF64748B),
                        cursorColor = Color(0xFF00F3FF)
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = deviceName,
                    onValueChange = { deviceName = it },
                    label = { 
                        Text(
                            "GATEWAY NODE IDENTIFIER",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        ) 
                    },
                    placeholder = { Text("Primary Physical SIM Gateway", color = Color(0xFF475569)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color(0xFFF8FAFC),
                        unfocusedTextColor = Color(0xFFE2E8F0),
                        focusedBorderColor = Color(0xFF00F3FF),
                        unfocusedBorderColor = Color(0xFF1E293B),
                        focusedLabelColor = Color(0xFF00F3FF),
                        unfocusedLabelColor = Color(0xFF64748B),
                        cursorColor = Color(0xFF00F3FF)
                    )
                )

                Spacer(modifier = Modifier.height(28.dp))

                if (uiState is RegistrationUiState.Loading) {
                    CircularProgressIndicator(
                        color = Color(0xFF00F3FF),
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(36.dp)
                    )
                } else {
                    Button(
                        onClick = { 
                            android.util.Log.d("RegistrationUI", "Register button clicked: $serverUrl")
                            viewModel.register(serverUrl, deviceName) 
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF00F3FF),
                            contentColor = Color(0xFF070A13)
                        ),
                        border = BorderStroke(1.dp, Color(0xFF00F3FF)),
                        enabled = serverUrl.isNotBlank() && deviceName.isNotBlank()
                    ) {
                        Text(
                            "⚡ INITIALIZE GATEWAY",
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.sp
                        )
                    }
                }

                if (uiState is RegistrationUiState.Error) {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFFFF003C).copy(alpha = 0.12f),
                        border = BorderStroke(1.dp, Color(0xFFFF003C).copy(alpha = 0.4f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 16.dp)
                    ) {
                        Text(
                            text = "❌ " + (uiState as RegistrationUiState.Error).message,
                            color = Color(0xFFFF003C),
                            fontFamily = FontFamily.Monospace,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

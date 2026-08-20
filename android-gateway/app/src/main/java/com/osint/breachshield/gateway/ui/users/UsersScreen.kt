package com.osint.breachshield.gateway.ui.users

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.osint.breachshield.gateway.data.api.ActiveUserItem
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsersScreen(
    viewModel: UsersViewModel = hiltViewModel()
) {
    val currentTab by viewModel.currentTab.collectAsState()
    val activeUsers by viewModel.activeUsers.collectAsState()
    val userHistory by viewModel.userHistory.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var selectedActiveUser by remember { mutableStateOf<ActiveUserItem?>(null) }

    // User Detail Bottom Sheet Dialog
    if (selectedActiveUser != null) {
        val user = selectedActiveUser!!
        AlertDialog(
            onDismissRequest = { selectedActiveUser = null },
            title = {
                Text(
                    "USER SESSION DETAILS",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = AccentCyan
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Target: ${user.userTarget}", color = SlateTextPrimary, fontWeight = FontWeight.Bold)
                    Text("State: ${user.state}", color = if (user.state == "ONLINE") MatrixGreen else WarningAmber)
                    Text("Client: ${user.browser} on ${user.os} (${user.device})", color = SlateTextSecondary)
                    Text("Masked IP: ${user.maskedIp}", color = SlateTextSecondary, fontFamily = FontFamily.Monospace)
                    Text("Current Page: ${user.currentPage}", color = SlateTextSecondary)
                    Text("Session ID: ${user.sessionId}", color = SlateTextMuted, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedActiveUser = null }) {
                    Text("Close", color = AccentCyan)
                }
            },
            containerColor = Color(0xFF0F172A),
            shape = RoundedCornerShape(18.dp)
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 28.dp, bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Top Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Website Users",
                    color = SlateTextPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                if (currentTab == UserTab.ACTIVE) {
                    Text(
                        text = "${activeUsers.size} Online",
                        color = MatrixGreen,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        // Segmented Control (Active vs History)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0F172A))
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (currentTab == UserTab.ACTIVE) Color(0xFF1E293B) else Color.Transparent)
                        .clickable { viewModel.selectTab(UserTab.ACTIVE) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Active (${activeUsers.size})",
                        color = if (currentTab == UserTab.ACTIVE) AccentCyan else SlateTextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (currentTab == UserTab.HISTORY) Color(0xFF1E293B) else Color.Transparent)
                        .clickable { viewModel.selectTab(UserTab.HISTORY) }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "History (${userHistory.size})",
                        color = if (currentTab == UserTab.HISTORY) AccentCyan else SlateTextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        }

        // Active Users List
        if (currentTab == UserTab.ACTIVE) {
            if (activeUsers.isEmpty()) {
                item {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "No visitors actively looking up breaches currently.",
                            color = SlateTextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                items(activeUsers) { user ->
                    val now = System.currentTimeMillis()
                    val diffSeconds = Math.max(1, (now - user.lastActivity) / 1000)
                    val timeAgoStr = if (diffSeconds < 60) "${diffSeconds}s ago" else "${diffSeconds / 60}m ago"

                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { selectedActiveUser = user }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(if (user.state == "ONLINE") MatrixGreen else WarningAmber)
                                    )
                                    Text(
                                        text = user.userTarget,
                                        color = SlateTextPrimary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${user.browser} · ${user.os} (${user.device})",
                                    color = SlateTextSecondary,
                                    fontSize = 12.sp
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "Active $timeAgoStr · IP ${user.maskedIp}",
                                    color = SlateTextMuted,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                            Text(
                                text = "›",
                                color = SlateTextMuted,
                                fontSize = 18.sp,
                                modifier = Modifier.padding(start = 8.dp)
                            )
                        }
                    }
                }
            }
        } else {
            // User History List
            if (userHistory.isEmpty()) {
                item {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = "No historical sessions recorded yet.",
                            color = SlateTextSecondary,
                            fontSize = 13.sp
                        )
                    }
                }
            } else {
                items(userHistory) { item ->
                    val df = SimpleDateFormat("dd MMM HH:mm", Locale.getDefault())
                    val dateStr = df.format(Date(item.endTime))

                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = item.userTarget,
                                    color = SlateTextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Text(
                                    text = "Last seen · $dateStr · ${item.durationSeconds / 60} min duration",
                                    color = SlateTextSecondary,
                                    fontSize = 11.sp
                                )
                                Text(
                                    text = "${item.browser} / ${item.os} · IP ${item.maskedIp}",
                                    color = SlateTextMuted,
                                    fontSize = 11.sp,
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

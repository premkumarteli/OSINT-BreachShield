package com.osint.breachshield.gateway.ui.users

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.osint.breachshield.gateway.data.api.ActiveUserItem
import com.osint.breachshield.gateway.ui.components.AmbientCyberCanvas
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
    val activeUsers by viewModel.filteredActiveUsers.collectAsState()
    val userHistory by viewModel.filteredUserHistory.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val actionFeedback by viewModel.actionFeedback.collectAsState()

    var selectedActiveUser by remember { mutableStateOf<ActiveUserItem?>(null) }

    // User Detail & Interactive Management Dialog
    if (selectedActiveUser != null) {
        val user = selectedActiveUser!!
        AlertDialog(
            onDismissRequest = { selectedActiveUser = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AppIcon(
                        icon = AppIconType.Users,
                        modifier = Modifier.size(20.dp),
                        tint = AccentCyan
                    )
                    Text(
                        "USER SESSION MANAGEMENT",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = AccentCyan
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Target: ${user.userTarget}", color = SlateTextPrimary, fontWeight = FontWeight.Bold)
                    Text("State: ${user.state}", color = if (user.state == "ONLINE") MatrixGreen else WarningAmber, fontWeight = FontWeight.SemiBold)
                    Text("Client: ${user.browser} on ${user.os} (${user.device})", color = SlateTextSecondary, fontSize = 12.sp)
                    Text("Masked IP: ${user.maskedIp}", color = SlateTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
                    Text("Current Page: ${user.currentPage}", color = SlateTextSecondary, fontSize = 12.sp)
                    Text("Session ID: ${user.sessionId}", color = SlateTextMuted, fontSize = 11.sp, fontFamily = FontFamily.Monospace)

                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = GlassBorderColor.copy(alpha = 0.1f))
                    Spacer(modifier = Modifier.height(4.dp))

                    Text("ADMINISTRATIVE ACTIONS", color = SlateTextMuted, fontSize = 10.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)

                    // Terminate Session Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(CriticalRed)
                            .tactilePress {
                                viewModel.terminateSession(user.sessionId)
                                selectedActiveUser = null
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Terminate Session Immediately", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    // Blacklist Target Button
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF1E293B))
                            .border(1.dp, WarningAmber, RoundedCornerShape(12.dp))
                            .tactilePress {
                                viewModel.blacklistTarget(user.userTarget)
                                selectedActiveUser = null
                            }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Blacklist Target Email/Phone", color = WarningAmber, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedActiveUser = null }) {
                    Text("Close", color = SlateTextSecondary)
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Top Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "CITIZEN SESSIONS",
                            color = SlateTextMuted,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            letterSpacing = 1.2.sp
                        )
                        Text(
                            text = "Website Users",
                            color = SlateTextPrimary,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Black,
                            fontFamily = FontFamily.Monospace
                        )
                    }

                    if (currentTab == UserTab.ACTIVE) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(MatrixGreen.copy(alpha = 0.14f))
                                .border(1.dp, MatrixGreen.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 10.dp, vertical = 5.dp)
                        ) {
                            Text(
                                text = "${activeUsers.size} Online",
                                color = MatrixGreen,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }

            // Action Feedback Toast Banner
            if (actionFeedback != null) {
                item {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        borderColor = AccentCyan
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(actionFeedback ?: "", color = AccentCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            IconButton(onClick = viewModel::clearFeedback) {
                                AppIcon(
                                    icon = AppIconType.Warning,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextSecondary
                                )
                            }
                        }
                    }
                }
            }

            // iOS Liquid Glass Segmented Control (Active vs History)
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .liquidGlass(
                            shape = RoundedCornerShape(20.dp),
                            fillColor = Color(0xFF091224).copy(alpha = 0.85f),
                            borderBrush = LiquidGlassSpecularBorder,
                            elevation = 4.dp
                        )
                        .padding(4.dp)
                ) {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (currentTab == UserTab.ACTIVE) AccentCyan.copy(alpha = 0.18f) else Color.Transparent)
                                .clickable { viewModel.selectTab(UserTab.ACTIVE) }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.Users,
                                    modifier = Modifier.size(15.dp),
                                    tint = if (currentTab == UserTab.ACTIVE) AccentCyan else SlateTextMuted
                                )
                                Text(
                                    text = "Active (${activeUsers.size})",
                                    color = if (currentTab == UserTab.ACTIVE) AccentCyan else SlateTextMuted,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (currentTab == UserTab.HISTORY) AccentCyan.copy(alpha = 0.18f) else Color.Transparent)
                                .clickable { viewModel.selectTab(UserTab.HISTORY) }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                AppIcon(
                                    icon = AppIconType.Activity,
                                    modifier = Modifier.size(15.dp),
                                    tint = if (currentTab == UserTab.HISTORY) AccentCyan else SlateTextMuted
                                )
                                Text(
                                    text = "History (${userHistory.size})",
                                    color = if (currentTab == UserTab.HISTORY) AccentCyan else SlateTextMuted,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }

            // Search Filter Input with iOS styling
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = viewModel::onSearchQueryChange,
                    placeholder = { Text("Filter email, phone, IP, or browser...", color = SlateTextMuted, fontSize = 12.sp) },
                    singleLine = true,
                    leadingIcon = {
                        AppIcon(
                            icon = AppIconType.Search,
                            modifier = Modifier.size(18.dp),
                            tint = SlateTextMuted
                        )
                    },
                    trailingIcon = {
                        if (searchQuery.isNotBlank()) {
                            IconButton(onClick = { viewModel.onSearchQueryChange("") }) {
                                AppIcon(
                                    icon = AppIconType.Warning,
                                    modifier = Modifier.size(14.dp),
                                    tint = SlateTextSecondary
                                )
                            }
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AccentCyan,
                        unfocusedBorderColor = GlassBorderColor,
                        focusedTextColor = SlateTextPrimary,
                        unfocusedTextColor = SlateTextPrimary,
                        focusedContainerColor = Color(0xFF0F172A).copy(alpha = 0.6f),
                        unfocusedContainerColor = Color(0xFF0F172A).copy(alpha = 0.6f)
                    ),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                )
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
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
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

                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "Manage",
                                        color = AccentCyan,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    AppIcon(
                                        icon = AppIconType.ChevronRight,
                                        modifier = Modifier.size(12.dp),
                                        tint = AccentCyan
                                    )
                                }
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
}

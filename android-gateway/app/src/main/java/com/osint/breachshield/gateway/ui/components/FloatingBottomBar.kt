package com.osint.breachshield.gateway.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.osint.breachshield.gateway.ui.navigation.NavRoutes
import com.osint.breachshield.gateway.ui.theme.*

data class BottomNavItem(
    val route: String,
    val label: String,
    val iconType: AppIconType,
    val badgeCount: Int = 0
)

val BottomNavDestinations = listOf(
    BottomNavItem(NavRoutes.HOME, "Home", AppIconType.Home),
    BottomNavItem(NavRoutes.USERS, "Sessions", AppIconType.Users),
    BottomNavItem(NavRoutes.GATEWAYS, "Relay", AppIconType.Gateways),
    BottomNavItem(NavRoutes.MORE, "Hub", AppIconType.More)
)

/**
 * iOS-styled Floating Liquid Glass Dock Navigation Bar.
 * Features specular top-rim lighting, fluid spring selection pill,
 * vector SF-symbols iconography, and active optical glow pips.
 */
@Composable
fun FloatingBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 18.dp)
            .navigationBarsPadding(),
        contentAlignment = Alignment.Center
    ) {
        // Liquid Glass Outer Capsule
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .liquidGlass(
                    shape = RoundedCornerShape(36.dp),
                    fillColor = Color(0xFF091224).copy(alpha = 0.82f),
                    borderBrush = Brush.verticalGradient(
                        listOf(
                            Color.White.copy(alpha = 0.32f), // Specular light catching top rim
                            Color.White.copy(alpha = 0.08f),
                            AccentCyan.copy(alpha = 0.16f)
                        )
                    ),
                    borderWidth = 1.dp,
                    elevation = 14.dp,
                    hasSheen = true
                )
                .padding(horizontal = 8.dp, vertical = 7.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                BottomNavDestinations.forEach { item ->
                    val isSelected = currentRoute == item.route

                    val iconScale by animateFloatAsState(
                        targetValue = if (isSelected) 1.15f else 1.0f,
                        animationSpec = spring(
                            dampingRatio = Spring.DampingRatioMediumBouncy,
                            stiffness = Spring.StiffnessMediumLow
                        ),
                        label = "tabIconScale"
                    )

                    val iconColor by animateColorAsState(
                        targetValue = if (isSelected) AccentCyan else SlateTextMuted,
                        animationSpec = spring(stiffness = Spring.StiffnessMedium),
                        label = "tabIconColor"
                    )

                    val pillBgColor by animateColorAsState(
                        targetValue = if (isSelected) AccentCyan.copy(alpha = 0.14f) else Color.Transparent,
                        animationSpec = spring(stiffness = Spring.StiffnessMedium),
                        label = "tabPillBg"
                    )

                    val pillBorderWidth by animateDpAsState(
                        targetValue = if (isSelected) 1.dp else 0.dp,
                        label = "tabBorderWidth"
                    )

                    // Interactive Tab Item with Tactile Spring Press
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(26.dp))
                            .background(pillBgColor)
                            .run {
                                if (isSelected) {
                                    this.background(
                                        Brush.verticalGradient(
                                            listOf(
                                                AccentCyan.copy(alpha = 0.18f),
                                                AccentCyan.copy(alpha = 0.06f)
                                            )
                                        )
                                    )
                                } else {
                                    this
                                }
                            }
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                if (!isSelected) onNavigate(item.route)
                            }
                            .padding(horizontal = if (isSelected) 18.dp else 14.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Box(
                                    modifier = Modifier.scale(iconScale),
                                    contentAlignment = Alignment.Center
                                ) {
                                    AppIcon(
                                        icon = item.iconType,
                                        modifier = Modifier.size(20.dp),
                                        tint = iconColor,
                                        strokeWidth = if (isSelected) 2.2.dp else 1.8.dp,
                                        filled = isSelected
                                    )

                                    // Badge dot if count > 0
                                    if (item.badgeCount > 0) {
                                        Box(
                                            modifier = Modifier
                                                .size(6.dp)
                                                .align(Alignment.TopEnd)
                                                .clip(CircleShape)
                                                .background(WarningAmber)
                                        )
                                    }
                                }

                                AnimatedVisibility(
                                    visible = isSelected,
                                    enter = fadeIn(),
                                    exit = fadeOut()
                                ) {
                                    Text(
                                        text = item.label,
                                        color = AccentCyan,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }

                            // Active Glow Optical Pip
                            Box(
                                modifier = Modifier
                                    .size(width = if (isSelected) 14.dp else 0.dp, height = 2.5.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(
                                        if (isSelected) {
                                            Brush.horizontalGradient(
                                                listOf(
                                                    Color.Transparent,
                                                    AccentCyan,
                                                    Color.Transparent
                                                )
                                            )
                                        } else {
                                            Brush.linearGradient(listOf(Color.Transparent, Color.Transparent))
                                        }
                                    )
                            )
                        }
                    }
                }
            }
        }
    }
}

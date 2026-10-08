package com.osint.breachshield.gateway.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.osint.breachshield.gateway.R
import com.osint.breachshield.gateway.ui.theme.*

/**
 * Top brand bar directly matching Figma Make prototype (brand-bar).
 */
@Composable
fun FigmaBrandBar(
    avatarInitials: String = "PT",
    onAvatarClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Glowing Cyber Shield Mark
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(AccentCyan.copy(alpha = 0.08f))
                .border(1.dp, AccentCyan.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                .padding(6.dp),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_breachshield_logo),
                contentDescription = "BreachShield Logo",
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        // Brand Typography
        Column {
            Text(
                text = "BREACHSHIELD",
                color = SlateTextPrimary,
                fontFamily = FontFamily.Monospace,
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.2.sp
            )
            Text(
                text = "KNOW. STAY AHEAD.",
                color = AccentCyan,
                fontFamily = FontFamily.Monospace,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Administrator Avatar Pill (e.g. PT for Prem Teli)
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFF0F172A))
                .border(1.dp, AccentCyan.copy(alpha = 0.35f), CircleShape)
                .clickable(enabled = onAvatarClick != null) { onAvatarClick?.invoke() },
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = avatarInitials,
                color = SlateTextPrimary,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

/**
 * Concentric animated radar pulse hero card matching Figma Make prototype.
 */
@Composable
fun ConcentricPulseHeroCard(
    statusTitle: String = "All systems secure",
    statusSubtitle: String = "Last checked just now",
    isLive: Boolean = true,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "concentricRings")

    // Outer Ring
    val ring1Scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ring1Scale"
    )
    val ring1Alpha by infiniteTransition.animateFloat(
        initialValue = 0.45f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ring1Alpha"
    )

    // Inner Ring (phase shifted)
    val ring2Scale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.6f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, delayMillis = 1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ring2Scale"
    )
    val ring2Alpha by infiniteTransition.animateFloat(
        initialValue = 0.45f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2800, delayMillis = 1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ring2Alpha"
    )

    GlassCard(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(if (isLive) MatrixGreen else WarningAmber)
                    )
                    Text(
                        text = if (isLive) "Live protection" else "Attention required",
                        color = if (isLive) MatrixGreen else WarningAmber,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "System status",
                    color = SlateTextSecondary,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = statusTitle,
                    color = SlateTextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = statusSubtitle,
                    color = SlateTextMuted,
                    fontSize = 11.sp
                )
            }

            // Concentric Animated Visual Radar
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .padding(end = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                // Expanding Ring 1
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .scale(ring1Scale)
                        .border(1.dp, AccentCyan.copy(alpha = ring1Alpha), CircleShape)
                )
                // Expanding Ring 2
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .scale(ring2Scale)
                        .border(1.dp, AccentCyan.copy(alpha = ring2Alpha), CircleShape)
                )
                // Glowing Core
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(AccentCyan.copy(alpha = 0.12f))
                        .border(1.dp, AccentCyan.copy(alpha = 0.45f), CircleShape)
                        .padding(9.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_breachshield_logo),
                        contentDescription = "Shield Core",
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }
}

/**
 * Ambient background gradient canvas giving true VisionOS depth.
 */
@Composable
fun AmbientCyberCanvas(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF020617),
                        Color(0xFF070E20),
                        Color(0xFF020617)
                    )
                )
            )
    ) {
        // Ambient Top-Left Cyan Glow Orb
        Box(
            modifier = Modifier
                .size(260.dp)
                .offset(x = (-80).dp, y = (-40).dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AmbientCyan, Color.Transparent)
                    )
                )
        )
        // Ambient Bottom-Right Cobalt Glow Orb
        Box(
            modifier = Modifier
                .size(240.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 60.dp, y = 60.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(AmbientCobalt, Color.Transparent)
                    )
                )
        )

        content()
    }
}

package com.osint.breachshield.gateway.ui.theme

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

// iOS Liquid Glass Surface Materials
val LiquidGlassFillUltraThin = Color(0xFF0F172A).copy(alpha = 0.55f)
val LiquidGlassFillRegular = Color(0xFF0A1324).copy(alpha = 0.75f)
val LiquidGlassFillThick = Color(0xFF070E1E).copy(alpha = 0.88f)

// iOS Specular Rim Light Gradients
val LiquidGlassSpecularBorder = Brush.verticalGradient(
    colors = listOf(
        Color(0xFFFFFFFF).copy(alpha = 0.28f), // Top specular reflection
        Color(0xFFFFFFFF).copy(alpha = 0.08f), // Mid soft refraction
        Color(0xFF00F0FF).copy(alpha = 0.12f)  // Bottom cyber cyan rim
    )
)

val LiquidGlassActiveBorder = Brush.verticalGradient(
    colors = listOf(
        AccentCyan.copy(alpha = 0.70f),
        Color.White.copy(alpha = 0.35f),
        AccentCyan.copy(alpha = 0.20f)
    )
)

val LiquidGlassCriticalBorder = Brush.verticalGradient(
    colors = listOf(
        CriticalRed.copy(alpha = 0.75f),
        Color.White.copy(alpha = 0.20f),
        CriticalRed.copy(alpha = 0.20f)
    )
)

/**
 * Applies iOS Liquid Glass styling with specular reflection, refraction gradient,
 * layered ambient blur, and continuous squircle corners.
 */
fun Modifier.liquidGlass(
    shape: Shape = RoundedCornerShape(24.dp),
    fillColor: Color = LiquidGlassFillRegular,
    borderBrush: Brush = LiquidGlassSpecularBorder,
    borderWidth: Dp = 1.dp,
    elevation: Dp = 8.dp,
    hasSheen: Boolean = true
): Modifier = this
    .shadow(
        elevation = elevation,
        shape = shape,
        ambientColor = Color(0xFF00F0FF).copy(alpha = 0.08f),
        spotColor = Color.Black.copy(alpha = 0.65f)
    )
    .clip(shape)
    .background(
        Brush.verticalGradient(
            colors = listOf(
                fillColor.copy(alpha = (fillColor.alpha * 1.15f).coerceAtMost(0.95f)),
                fillColor
            )
        )
    )
    .drawBehind {
        if (hasSheen) {
            // Subtle top curved specular sheen (light refracting through glass)
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.08f),
                        Color.Transparent
                    ),
                    center = Offset(size.width * 0.40f, 0f),
                    radius = size.width * 0.65f
                ),
                radius = size.width * 0.65f,
                center = Offset(size.width * 0.40f, 0f)
            )
        }
    }
    .border(
        width = borderWidth,
        brush = borderBrush,
        shape = shape
    )

/**
 * Spring-based interactive press scaling. Compresses to 0.97f on touch and
 * bounces back with smooth iOS spring physics on release.
 */
fun Modifier.tactilePress(
    enabled: Boolean = true,
    onClick: () -> Unit
): Modifier = composed {
    val scale = remember { Animatable(1f) }
    val scope = rememberCoroutineScope()

    this
        .scale(scale.value)
        .pointerInput(enabled) {
            if (!enabled) return@pointerInput
            detectTapGestures(
                onPress = {
                    scope.launch {
                        scale.animateTo(
                            targetValue = 0.965f,
                            animationSpec = spring(
                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                stiffness = Spring.StiffnessLow
                            )
                        )
                    }
                    val released = tryAwaitRelease()
                    scope.launch {
                        scale.animateTo(
                            targetValue = 1f,
                            animationSpec = spring(
                                dampingRatio = Spring.DampingRatioMediumBouncy,
                                stiffness = Spring.StiffnessMediumLow
                            )
                        )
                    }
                    if (released) {
                        onClick()
                    }
                }
            )
        }
}

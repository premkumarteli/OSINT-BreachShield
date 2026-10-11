package com.osint.breachshield.gateway.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    backgroundColor: Color = LiquidGlassFillRegular,
    borderColor: Color? = null,
    borderBrush: Brush = LiquidGlassSpecularBorder,
    borderWidth: Dp = 1.dp,
    elevation: Dp = 8.dp,
    hasSheen: Boolean = true,
    padding: PaddingValues = PaddingValues(18.dp),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val effectiveBorderBrush = if (borderColor != null) {
        Brush.verticalGradient(
            listOf(
                borderColor.copy(alpha = 0.85f),
                borderColor.copy(alpha = 0.35f)
            )
        )
    } else {
        borderBrush
    }

    val glassModifier = modifier
        .liquidGlass(
            shape = shape,
            fillColor = backgroundColor,
            borderBrush = effectiveBorderBrush,
            borderWidth = borderWidth,
            elevation = elevation,
            hasSheen = hasSheen
        )
        .run {
            if (onClick != null) {
                tactilePress(onClick = onClick)
            } else {
                this
            }
        }

    Box(modifier = glassModifier) {
        Column(
            modifier = Modifier.padding(padding),
            content = content
        )
    }
}

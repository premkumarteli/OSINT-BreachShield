package com.osint.breachshield.gateway.ui.theme

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawStyle
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class AppIconType {
    Home,
    Users,
    Gateways,
    More,
    Shield,
    Database,
    Alerts,
    Activity,
    Console,
    Settings,
    Logout,
    ChevronRight,
    Refresh,
    SimCard,
    Check,
    Warning,
    Search,
    SignalFull
}

/**
 * High-definition, resolution-independent iOS SF-Symbols style vector icon component.
 * Uses native GPU Canvas drawing with rounded caps, smooth curves, and exact line weights.
 */
@Composable
fun AppIcon(
    icon: AppIconType,
    modifier: Modifier = Modifier.size(22.dp),
    tint: Color = SlateTextPrimary,
    strokeWidth: Dp = 2.dp,
    filled: Boolean = false
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val sw = strokeWidth.toPx()
        val strokeStyle = Stroke(
            width = sw,
            cap = StrokeCap.Round,
            join = StrokeJoin.Round
        )

        when (icon) {
            AppIconType.Home -> {
                // iOS Home icon: streamlined peaked roof + rounded body + door notch
                val path = Path().apply {
                    moveTo(w * 0.14f, h * 0.44f)
                    lineTo(w * 0.50f, h * 0.14f)
                    lineTo(w * 0.86f, h * 0.44f)
                    lineTo(w * 0.86f, h * 0.84f)
                    arcTo(
                        rect = Rect(w * 0.76f, h * 0.74f, w * 0.86f, h * 0.84f),
                        startAngleDegrees = 0f,
                        sweepAngleDegrees = 90f,
                        forceMoveTo = false
                    )
                    lineTo(w * 0.60f, h * 0.84f)
                    lineTo(w * 0.60f, h * 0.56f)
                    arcTo(
                        rect = Rect(w * 0.40f, h * 0.48f, w * 0.60f, h * 0.64f),
                        startAngleDegrees = 0f,
                        sweepAngleDegrees = -180f,
                        forceMoveTo = false
                    )
                    lineTo(w * 0.40f, h * 0.84f)
                    lineTo(w * 0.24f, h * 0.84f)
                    arcTo(
                        rect = Rect(w * 0.14f, h * 0.74f, w * 0.24f, h * 0.84f),
                        startAngleDegrees = 90f,
                        sweepAngleDegrees = 90f,
                        forceMoveTo = false
                    )
                    close()
                }
                drawPath(path, color = tint, style = if (filled) Fill else strokeStyle)
            }

            AppIconType.Users -> {
                // iOS Users: primary user silhouette + secondary offset user silhouette
                // Primary head
                drawCircle(
                    color = tint,
                    radius = w * 0.15f,
                    center = Offset(w * 0.40f, h * 0.30f),
                    style = strokeStyle
                )
                // Primary shoulders
                val bodyPath = Path().apply {
                    moveTo(w * 0.15f, h * 0.82f)
                    cubicTo(w * 0.15f, h * 0.60f, w * 0.65f, h * 0.60f, w * 0.65f, h * 0.82f)
                }
                drawPath(bodyPath, color = tint, style = strokeStyle)

                // Secondary user head arc (offset to right)
                val secHead = Path().apply {
                    arcTo(
                        rect = Rect(w * 0.60f, h * 0.18f, w * 0.86f, h * 0.44f),
                        startAngleDegrees = -70f,
                        sweepAngleDegrees = 160f,
                        forceMoveTo = false
                    )
                }
                drawPath(secHead, color = tint, style = strokeStyle)

                // Secondary user shoulder arc
                val secBody = Path().apply {
                    moveTo(w * 0.68f, h * 0.60f)
                    cubicTo(w * 0.78f, h * 0.60f, w * 0.88f, h * 0.68f, w * 0.88f, h * 0.80f)
                }
                drawPath(secBody, color = tint, style = strokeStyle)
            }

            AppIconType.Gateways -> {
                // Radio tower / cellular antenna broadcasting concentric wireless radio waves
                // Center mast pole
                drawLine(
                    color = tint,
                    start = Offset(w * 0.50f, h * 0.32f),
                    end = Offset(w * 0.50f, h * 0.86f),
                    strokeWidth = sw,
                    cap = StrokeCap.Round
                )
                // Base stand
                val tripod = Path().apply {
                    moveTo(w * 0.32f, h * 0.86f)
                    lineTo(w * 0.50f, h * 0.60f)
                    lineTo(w * 0.68f, h * 0.86f)
                }
                drawPath(tripod, color = tint, style = strokeStyle)
                // Beacon emitter bulb
                drawCircle(
                    color = tint,
                    radius = w * 0.08f,
                    center = Offset(w * 0.50f, h * 0.32f),
                    style = Fill
                )
                // Inner broadcast arcs
                val innerLeft = Path().apply {
                    arcTo(Rect(w * 0.30f, h * 0.16f, w * 0.70f, h * 0.48f), 135f, 90f, false)
                }
                drawPath(innerLeft, color = tint, style = strokeStyle)
                val innerRight = Path().apply {
                    arcTo(Rect(w * 0.30f, h * 0.16f, w * 0.70f, h * 0.48f), -45f, 90f, false)
                }
                drawPath(innerRight, color = tint, style = strokeStyle)

                // Outer broadcast arcs
                val outerLeft = Path().apply {
                    arcTo(Rect(w * 0.14f, h * 0.04f, w * 0.86f, h * 0.60f), 140f, 80f, false)
                }
                drawPath(outerLeft, color = tint, style = strokeStyle)
                val outerRight = Path().apply {
                    arcTo(Rect(w * 0.14f, h * 0.04f, w * 0.86f, h * 0.60f), -40f, 80f, false)
                }
                drawPath(outerRight, color = tint, style = strokeStyle)
            }

            AppIconType.More -> {
                // iOS Control Center style 4 squircle control tiles in 2x2 grid
                val tileSize = w * 0.30f
                val radius = CornerRadius(w * 0.08f, w * 0.08f)

                // Top Left
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.14f, h * 0.14f),
                    size = Size(tileSize, tileSize),
                    cornerRadius = radius,
                    style = strokeStyle
                )
                // Top Right
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.56f, h * 0.14f),
                    size = Size(tileSize, tileSize),
                    cornerRadius = radius,
                    style = if (filled) Fill else strokeStyle
                )
                // Bottom Left
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.14f, h * 0.56f),
                    size = Size(tileSize, tileSize),
                    cornerRadius = radius,
                    style = if (filled) Fill else strokeStyle
                )
                // Bottom Right
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.56f, h * 0.56f),
                    size = Size(tileSize, tileSize),
                    cornerRadius = radius,
                    style = strokeStyle
                )
            }

            AppIconType.Shield -> {
                // Modern double-curved security shield
                val shieldPath = Path().apply {
                    moveTo(w * 0.50f, h * 0.12f)
                    cubicTo(w * 0.78f, h * 0.12f, w * 0.86f, h * 0.24f, w * 0.86f, h * 0.48f)
                    cubicTo(w * 0.86f, h * 0.74f, w * 0.64f, h * 0.88f, w * 0.50f, h * 0.92f)
                    cubicTo(w * 0.36f, h * 0.88f, w * 0.14f, h * 0.74f, w * 0.14f, h * 0.48f)
                    cubicTo(w * 0.14f, h * 0.24f, w * 0.22f, h * 0.12f, w * 0.50f, h * 0.12f)
                    close()
                }
                drawPath(shieldPath, color = tint, style = strokeStyle)
                // Shield center crest tick
                val tick = Path().apply {
                    moveTo(w * 0.36f, h * 0.48f)
                    lineTo(w * 0.46f, h * 0.58f)
                    lineTo(w * 0.66f, h * 0.38f)
                }
                drawPath(tick, color = tint, style = strokeStyle)
            }

            AppIconType.Database -> {
                // Multi-tiered cylinder stack (Breach dataset records)
                val dw = w * 0.72f
                val dh = h * 0.22f
                val dx = w * 0.14f

                // Top tier
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(dx, h * 0.14f),
                    size = Size(dw, dh),
                    cornerRadius = CornerRadius(dw / 2, dh / 2),
                    style = strokeStyle
                )

                // Middle tier arc
                val midArc = Path().apply {
                    moveTo(dx, h * 0.44f)
                    cubicTo(dx, h * 0.56f, dx + dw, h * 0.56f, dx + dw, h * 0.44f)
                }
                drawPath(midArc, color = tint, style = strokeStyle)
                drawLine(tint, Offset(dx, h * 0.25f), Offset(dx, h * 0.44f), sw, StrokeCap.Round)
                drawLine(tint, Offset(dx + dw, h * 0.25f), Offset(dx + dw, h * 0.44f), sw, StrokeCap.Round)

                // Bottom tier arc
                val botArc = Path().apply {
                    moveTo(dx, h * 0.68f)
                    cubicTo(dx, h * 0.80f, dx + dw, h * 0.80f, dx + dw, h * 0.68f)
                }
                drawPath(botArc, color = tint, style = strokeStyle)
                drawLine(tint, Offset(dx, h * 0.44f), Offset(dx, h * 0.68f), sw, StrokeCap.Round)
                drawLine(tint, Offset(dx + dw, h * 0.44f), Offset(dx + dw, h * 0.68f), sw, StrokeCap.Round)
            }

            AppIconType.Alerts -> {
                // iOS security ringer bell
                val bell = Path().apply {
                    moveTo(w * 0.50f, h * 0.14f)
                    // top hanger
                    arcTo(Rect(w * 0.44f, h * 0.08f, w * 0.56f, h * 0.20f), 0f, 360f, false)
                    moveTo(w * 0.50f, h * 0.20f)
                    cubicTo(w * 0.34f, h * 0.20f, w * 0.30f, h * 0.42f, w * 0.24f, h * 0.66f)
                    lineTo(w * 0.16f, h * 0.74f)
                    lineTo(w * 0.84f, h * 0.74f)
                    lineTo(w * 0.76f, h * 0.66f)
                    cubicTo(w * 0.70f, h * 0.42f, w * 0.66f, h * 0.20f, w * 0.50f, h * 0.20f)
                    close()
                }
                drawPath(bell, color = tint, style = strokeStyle)
                // Clapper
                val clapper = Path().apply {
                    arcTo(Rect(w * 0.42f, h * 0.74f, w * 0.58f, h * 0.88f), 0f, 180f, false)
                }
                drawPath(clapper, color = tint, style = strokeStyle)
            }

            AppIconType.Activity -> {
                // ECG / Pulse monitor sparkline
                val ecg = Path().apply {
                    moveTo(w * 0.10f, h * 0.54f)
                    lineTo(w * 0.32f, h * 0.54f)
                    lineTo(w * 0.42f, h * 0.22f)
                    lineTo(w * 0.56f, h * 0.82f)
                    lineTo(w * 0.66f, h * 0.42f)
                    lineTo(w * 0.76f, h * 0.54f)
                    lineTo(w * 0.90f, h * 0.54f)
                }
                drawPath(ecg, color = tint, style = strokeStyle)
                // Pulse dot
                drawCircle(color = tint, radius = w * 0.06f, center = Offset(w * 0.90f, h * 0.54f))
            }

            AppIconType.Console -> {
                // Cyber terminal prompt screen
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.12f, h * 0.18f),
                    size = Size(w * 0.76f, h * 0.64f),
                    cornerRadius = CornerRadius(w * 0.10f, w * 0.10f),
                    style = strokeStyle
                )
                // Prompt arrow `>`
                val prompt = Path().apply {
                    moveTo(w * 0.26f, h * 0.40f)
                    lineTo(w * 0.38f, h * 0.50f)
                    lineTo(w * 0.26f, h * 0.60f)
                }
                drawPath(prompt, color = tint, style = strokeStyle)
                // Cursor line `_`
                drawLine(
                    color = tint,
                    start = Offset(w * 0.46f, h * 0.60f),
                    end = Offset(w * 0.64f, h * 0.60f),
                    strokeWidth = sw,
                    cap = StrokeCap.Round
                )
            }

            AppIconType.Settings -> {
                // iOS high-precision mechanical gear
                val rInner = w * 0.16f
                val rOuter = w * 0.36f
                drawCircle(color = tint, radius = rInner, center = Offset(w * 0.5f, h * 0.5f), style = strokeStyle)
                drawCircle(color = tint, radius = rOuter, center = Offset(w * 0.5f, h * 0.5f), style = strokeStyle)

                // 6 Cog teeth
                for (i in 0 until 6) {
                    val angle = Math.toRadians((i * 60).toDouble())
                    val cos = Math.cos(angle).toFloat()
                    val sin = Math.sin(angle).toFloat()
                    drawLine(
                        color = tint,
                        start = Offset(w * 0.5f + cos * (rOuter - 2), h * 0.5f + sin * (rOuter - 2)),
                        end = Offset(w * 0.5f + cos * (rOuter + w * 0.08f), h * 0.5f + sin * (rOuter + w * 0.08f)),
                        strokeWidth = sw * 1.5f,
                        cap = StrokeCap.Round
                    )
                }
            }

            AppIconType.Logout -> {
                // Directional exit doorway with arrow
                val door = Path().apply {
                    moveTo(w * 0.54f, h * 0.18f)
                    lineTo(w * 0.24f, h * 0.18f)
                    arcTo(Rect(w * 0.16f, h * 0.18f, w * 0.24f, h * 0.26f), 270f, -90f, false)
                    lineTo(w * 0.16f, h * 0.74f)
                    arcTo(Rect(w * 0.16f, h * 0.74f, w * 0.24f, h * 0.82f), 180f, -90f, false)
                    lineTo(w * 0.54f, h * 0.82f)
                }
                drawPath(door, color = tint, style = strokeStyle)
                // Arrow
                drawLine(tint, Offset(w * 0.36f, h * 0.50f), Offset(w * 0.84f, h * 0.50f), sw, StrokeCap.Round)
                val arrowHead = Path().apply {
                    moveTo(w * 0.68f, h * 0.36f)
                    lineTo(w * 0.84f, h * 0.50f)
                    lineTo(w * 0.68f, h * 0.64f)
                }
                drawPath(arrowHead, color = tint, style = strokeStyle)
            }

            AppIconType.ChevronRight -> {
                // Crisp iOS navigation disclosure arrow
                val chevron = Path().apply {
                    moveTo(w * 0.36f, h * 0.24f)
                    lineTo(w * 0.62f, h * 0.50f)
                    lineTo(w * 0.36f, h * 0.76f)
                }
                drawPath(chevron, color = tint, style = strokeStyle)
            }

            AppIconType.Refresh -> {
                // 300-degree circular rotation arrow
                val arc = Path().apply {
                    arcTo(Rect(w * 0.18f, h * 0.18f, w * 0.82f, h * 0.82f), -60f, 290f, false)
                }
                drawPath(arc, color = tint, style = strokeStyle)
                // Arrow head
                val head = Path().apply {
                    moveTo(w * 0.70f, h * 0.12f)
                    lineTo(w * 0.88f, h * 0.26f)
                    lineTo(w * 0.70f, h * 0.40f)
                }
                drawPath(head, color = tint, style = strokeStyle)
            }

            AppIconType.SimCard -> {
                // Physical cellular SIM card with corner notch and contact lines
                val sim = Path().apply {
                    moveTo(w * 0.22f, h * 0.16f)
                    lineTo(w * 0.60f, h * 0.16f)
                    lineTo(w * 0.78f, h * 0.34f) // Beveled notch
                    lineTo(w * 0.78f, h * 0.84f)
                    arcTo(Rect(w * 0.70f, h * 0.76f, w * 0.78f, h * 0.84f), 0f, 90f, false)
                    lineTo(w * 0.28f, h * 0.84f)
                    arcTo(Rect(w * 0.20f, h * 0.76f, w * 0.28f, h * 0.84f), 90f, 90f, false)
                    lineTo(w * 0.20f, h * 0.22f)
                    arcTo(Rect(w * 0.20f, h * 0.16f, w * 0.28f, h * 0.22f), 180f, 90f, false)
                    close()
                }
                drawPath(sim, color = tint, style = strokeStyle)
                // Gold contact wafer
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(w * 0.34f, h * 0.42f),
                    size = Size(w * 0.32f, h * 0.30f),
                    cornerRadius = CornerRadius(w * 0.04f, w * 0.04f),
                    style = strokeStyle
                )
            }

            AppIconType.Check -> {
                val check = Path().apply {
                    moveTo(w * 0.20f, h * 0.50f)
                    lineTo(w * 0.42f, h * 0.72f)
                    lineTo(w * 0.80f, h * 0.28f)
                }
                drawPath(check, color = tint, style = strokeStyle)
            }

            AppIconType.Warning -> {
                val warn = Path().apply {
                    moveTo(w * 0.50f, h * 0.16f)
                    lineTo(w * 0.86f, h * 0.80f)
                    lineTo(w * 0.14f, h * 0.80f)
                    close()
                }
                drawPath(warn, color = tint, style = strokeStyle)
                drawLine(tint, Offset(w * 0.50f, h * 0.38f), Offset(w * 0.50f, h * 0.58f), sw, StrokeCap.Round)
                drawCircle(tint, radius = sw * 0.7f, center = Offset(w * 0.50f, h * 0.70f), style = Fill)
            }

            AppIconType.Search -> {
                val r = w * 0.24f
                val c = Offset(w * 0.42f, h * 0.42f)
                drawCircle(color = tint, radius = r, center = c, style = strokeStyle)
                drawLine(
                    color = tint,
                    start = Offset(w * 0.59f, h * 0.59f),
                    end = Offset(w * 0.82f, h * 0.82f),
                    strokeWidth = sw * 1.2f,
                    cap = StrokeCap.Round
                )
            }

            AppIconType.SignalFull -> {
                // Cellular signal bars
                val barW = w * 0.12f
                val gap = w * 0.08f
                val startX = w * 0.18f
                // Bar 1
                drawLine(tint, Offset(startX, h * 0.78f), Offset(startX, h * 0.65f), barW, StrokeCap.Round)
                // Bar 2
                drawLine(tint, Offset(startX + barW + gap, h * 0.78f), Offset(startX + barW + gap, h * 0.50f), barW, StrokeCap.Round)
                // Bar 3
                drawLine(tint, Offset(startX + (barW + gap) * 2, h * 0.78f), Offset(startX + (barW + gap) * 2, h * 0.35f), barW, StrokeCap.Round)
                // Bar 4
                drawLine(tint, Offset(startX + (barW + gap) * 3, h * 0.78f), Offset(startX + (barW + gap) * 3, h * 0.20f), barW, StrokeCap.Round)
            }
        }
    }
}

package com.osint.breachshield.gateway.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ============================================================================
// Core Palette from Figma Make Prototype (src/index.css)
// ============================================================================
val ObsidianBg = Color(0xFF020617)            // --app-shell bg #020617
val ObsidianSurface = Color(0xFF070E1E)       // surface strong container
val GlassSurfaceColor = Color(0xFF0D172B).copy(alpha = 0.72f) // VisionOS frosted glass
val GlassBorderColor = Color(0xFFFFFFFF).copy(alpha = 0.10f)  // specular 10% white line
val GlassBorderFocused = Color(0xFF00F0FF).copy(alpha = 0.45f) // glowing cyan line

// Semantic Accents
val AccentCyan = Color(0xFF00F0FF)            // --accent
val AccentBlue = Color(0xFF007BFF)            // --accent-blue
val MatrixGreen = Color(0xFF00FF66)           // Success / Live / Delivered
val WarningAmber = Color(0xFFFFB800)          // Warning / Attention required
val CriticalRed = Color(0xFFFF003C)           // Critical / Terminated
val AccentViolet = Color(0xFF8B82FF)          // Active Users accent

val SlateTextPrimary = Color(0xFFF4F7FF)      // Crisp white text
val SlateTextSecondary = Color(0xFF94A3B8)    // Subtitle slate
val SlateTextMuted = Color(0xFF64748B)        // Muted labels

// Ambient Glow Orbs
val AmbientCyan = Color(0x1F00F0FF)           // 12% alpha cyan glow
val AmbientCobalt = Color(0x1F007BFF)         // 12% alpha cobalt glow

val LiquidGlassColorScheme = darkColorScheme(
    primary = AccentCyan,
    onPrimary = ObsidianBg,
    primaryContainer = Color(0xFF08223B),
    onPrimaryContainer = AccentCyan,
    secondary = MatrixGreen,
    onSecondary = ObsidianBg,
    background = ObsidianBg,
    onBackground = SlateTextPrimary,
    surface = ObsidianSurface,
    onSurface = SlateTextPrimary,
    surfaceVariant = GlassSurfaceColor,
    onSurfaceVariant = SlateTextSecondary,
    error = CriticalRed,
    onError = Color.White,
    outline = GlassBorderColor
)

// Cyber Typography to lock out device handwriting/comic fonts
val CyberTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Black,
        fontSize = 30.sp,
        letterSpacing = 1.sp,
        color = SlateTextPrimary
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        letterSpacing = 0.5.sp,
        color = SlateTextPrimary
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        color = SlateTextPrimary
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.SemiBold,
        fontSize = 17.sp,
        color = SlateTextPrimary
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 15.sp,
        letterSpacing = 0.5.sp,
        color = SlateTextPrimary
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        color = SlateTextPrimary
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = SlateTextPrimary
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        color = SlateTextSecondary
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        letterSpacing = 1.sp,
        color = AccentCyan
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.SemiBold,
        fontSize = 10.sp,
        letterSpacing = 0.5.sp,
        color = SlateTextMuted
    )
)

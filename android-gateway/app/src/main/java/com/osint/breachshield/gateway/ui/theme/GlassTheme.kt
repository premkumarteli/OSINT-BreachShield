package com.osint.breachshield.gateway.ui.theme

import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.graphics.Color

// Core Cyber/Obsidian Palette
val ObsidianBg = Color(0xFF07080C)
val ObsidianSurface = Color(0xFF0D121F)
val GlassSurfaceColor = Color(0xFF111827).copy(alpha = 0.65f)
val GlassBorderColor = Color(0xFFFFFFFF).copy(alpha = 0.08f)
val GlassBorderFocused = Color(0xFF00F3FF).copy(alpha = 0.35f)

// Semantic Accents
val AccentCyan = Color(0xFF00F3FF)        // Active/Selected
val MatrixGreen = Color(0xFF00FF66)       // Online/Delivered/Success
val WarningAmber = Color(0xFFFFB800)      // Idle/Warning
val CriticalRed = Color(0xFFFF003C)       // Offline/Failed/Critical
val SlateTextPrimary = Color(0xFFF8FAFC)
val SlateTextSecondary = Color(0xFF94A3B8)
val SlateTextMuted = Color(0xFF64748B)

val LiquidGlassColorScheme = darkColorScheme(
    primary = AccentCyan,
    onPrimary = ObsidianBg,
    primaryContainer = Color(0xFF0B2538),
    onPrimaryContainer = AccentCyan,
    secondary = MatrixGreen,
    onSecondary = ObsidianBg,
    background = ObsidianBg,
    onBackground = SlateTextPrimary,
    surface = ObsidianSurface,
    onSurface = SlateTextPrimary,
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = SlateTextSecondary,
    error = CriticalRed,
    onError = Color.White,
    outline = GlassBorderColor
)

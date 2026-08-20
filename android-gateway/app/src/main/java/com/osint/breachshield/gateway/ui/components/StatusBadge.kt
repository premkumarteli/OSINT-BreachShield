package com.osint.breachshield.gateway.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.osint.breachshield.gateway.ui.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (dotColor, bgColor, textColor, label) = when (status.uppercase()) {
        "ALL_SYSTEMS_OPERATIONAL", "OPERATIONAL", "HEALTHY", "ONLINE", "DELIVERED", "SUCCESS" ->
            Tuple4(MatrixGreen, MatrixGreen.copy(alpha = 0.12f), MatrixGreen, if (status == "ALL_SYSTEMS_OPERATIONAL") "All systems operational" else status)

        "IDLE", "ATTENTION_REQUIRED", "WARNING", "STANDBY" ->
            Tuple4(WarningAmber, WarningAmber.copy(alpha = 0.12f), WarningAmber, status)

        "CRITICAL", "HIGH", "OFFLINE", "FAILED", "GATEWAYS_DEGRADED" ->
            Tuple4(CriticalRed, CriticalRed.copy(alpha = 0.12f), CriticalRed, status)

        else ->
            Tuple4(SlateTextSecondary, SlateTextMuted.copy(alpha = 0.15f), SlateTextSecondary, status)
    }

    Row(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(7.dp)
                .clip(CircleShape)
                .background(dotColor)
        )
        Text(
            text = label,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace
        )
    }
}

private data class Tuple4<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)

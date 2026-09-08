package app.ink.lockscreen.ui.wallpaper

import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

private val dateFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE, MMM d")

/**
 * Translucent stand-in for the system lock-screen clock, drawn over the preview so the user
 * can see which part of the wallpaper Android's large clock will cover.
 */
@Composable
fun LockScreenChrome(use24Hour: Boolean, textColor: Color) {
    val now = LocalDateTime.now()
    val hours = now.format(DateTimeFormatter.ofPattern(if (use24Hour) "HH" else "h"))
    val minutes = now.format(DateTimeFormatter.ofPattern("mm"))
    val tint = textColor.copy(alpha = 0.55f)
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val h = maxHeight
        val clockSize = (h.value * 0.16f).sp
        Column(Modifier.padding(top = h * 0.06f, start = maxWidth * 0.07f)) {
            Text(now.format(dateFormat), color = tint, fontSize = (h.value * 0.022f).sp)
        }
        Column(Modifier.padding(top = h * 0.30f, start = maxWidth * 0.18f)) {
            Text(hours, color = tint, fontSize = clockSize, fontWeight = FontWeight.Light, lineHeight = clockSize)
            Text(minutes, color = tint, fontSize = clockSize, fontWeight = FontWeight.Light, lineHeight = clockSize)
        }
    }
}

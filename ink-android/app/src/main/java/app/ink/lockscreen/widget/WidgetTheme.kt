package app.ink.lockscreen.widget

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider

/** Ink's paper-and-navy palette, shared by all widgets. */
object WidgetTheme {
    val paper = ColorProvider(Color(0xFFF7F6F2))
    val navy = ColorProvider(Color(0xFF1B2140))
    val muted = ColorProvider(Color(0xFF6B7088))
    val line = ColorProvider(Color(0xFFE6E4DD))
    val accent = ColorProvider(Color(0xFFFFC857))
    val onAccent = ColorProvider(Color(0xFF1B2140))

    val title = TextStyle(color = navy, fontSize = 16.sp, fontWeight = FontWeight.Bold)
    val body = TextStyle(color = navy, fontSize = 13.sp)
    val caption = TextStyle(color = muted, fontSize = 11.sp)
    val eyebrow = TextStyle(color = muted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
}

@Composable
fun WidgetCard(modifier: GlanceModifier = GlanceModifier, content: @Composable () -> Unit) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(WidgetTheme.paper)
            .cornerRadius(24.dp)
            .padding(14.dp),
    ) { content() }
}

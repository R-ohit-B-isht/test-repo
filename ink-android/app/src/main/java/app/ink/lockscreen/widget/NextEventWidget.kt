package app.ink.lockscreen.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Box
import androidx.glance.layout.Spacer
import androidx.glance.layout.height
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.compose.ui.graphics.Color
import app.ink.lockscreen.InkApplication
import app.ink.lockscreen.MainActivity
import app.ink.lockscreen.domain.model.Event
import java.time.Duration
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class NextEventWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = NextEventWidget()
}

/** The single next event with a relative countdown — Ink's "Next event" card. */
class NextEventWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val container = (context.applicationContext as InkApplication).container
        val snapshot = container.buildSnapshot()
        val use24h = container.settings.current().use24Hour
        provideContent { Content(snapshot.nextEvent, snapshot.now, use24h) }
    }

    @Composable
    private fun Content(event: Event?, now: LocalDateTime, use24Hour: Boolean) {
        WidgetCard(GlanceModifier.clickable(actionStartActivity<MainActivity>())) {
            Text("NEXT UP", style = WidgetTheme.eyebrow)
            Spacer(GlanceModifier.height(6.dp))
            if (event == null) {
                Text("Nothing scheduled", style = WidgetTheme.title)
                Spacer(GlanceModifier.height(4.dp))
                Text("Your day is wide open.", style = WidgetTheme.caption)
                return@WidgetCard
            }
            Box(GlanceModifier.width(28.dp).height(4.dp).background(ColorProvider(Color(event.colorArgb))).cornerRadius(2.dp)) {}
            Spacer(GlanceModifier.height(6.dp))
            Text(event.title, style = WidgetTheme.title, maxLines = 2)
            Spacer(GlanceModifier.height(4.dp))
            val fmt = DateTimeFormatter.ofPattern(if (use24Hour) "HH:mm" else "h:mm a")
            val time = if (event.allDay) "All day" else "${event.start.format(fmt)} – ${event.end.format(fmt)}"
            Text(time, style = WidgetTheme.caption)
            Spacer(GlanceModifier.height(2.dp))
            Text(countdown(event, now), style = TextStyle(color = WidgetTheme.navy, fontSize = 13.sp, fontWeight = FontWeight.Bold))
            Spacer(GlanceModifier.size(4.dp))
        }
    }

    private fun countdown(event: Event, now: LocalDateTime): String {
        if (event.start <= now) return "Happening now"
        val d = Duration.between(now, event.start)
        return when {
            d.toDays() >= 1 -> "in ${d.toDays()}d ${d.toHours() % 24}h"
            d.toHours() >= 1 -> "in ${d.toHours()}h ${d.toMinutes() % 60}m"
            else -> "in ${d.toMinutes().coerceAtLeast(1)} min"
        }
    }
}

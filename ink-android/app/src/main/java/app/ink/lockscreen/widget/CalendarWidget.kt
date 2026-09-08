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
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import app.ink.lockscreen.InkApplication
import app.ink.lockscreen.MainActivity
import app.ink.lockscreen.domain.usecase.ScheduleSnapshot
import java.time.DayOfWeek
import java.time.YearMonth
import java.time.format.TextStyle as JavaTextStyle
import java.util.Locale

class CalendarWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = CalendarWidget()
}

/** Month grid with today marked and dots for days that have events. */
class CalendarWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val container = (context.applicationContext as InkApplication).container
        val snapshot = container.buildSnapshot()
        val weekStart = container.wallpaperConfig.current().weekStart
        provideContent { Content(snapshot, weekStart) }
    }

    @Composable
    private fun Content(snapshot: ScheduleSnapshot, weekStart: DayOfWeek) {
        val month = YearMonth.from(snapshot.today)
        WidgetCard(GlanceModifier.clickable(actionStartActivity<MainActivity>())) {
            Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(month.month.getDisplayName(JavaTextStyle.FULL, Locale.getDefault()), style = WidgetTheme.title)
                Spacer(GlanceModifier.size(6.dp))
                Text(month.year.toString(), style = WidgetTheme.caption)
            }
            Spacer(GlanceModifier.height(6.dp))
            Row(GlanceModifier.fillMaxWidth()) {
                for (i in 0 until 7) {
                    val d = weekStart.plus(i.toLong())
                    Text(
                        d.getDisplayName(JavaTextStyle.SHORT, Locale.getDefault()).take(1),
                        style = WidgetTheme.eyebrow.copy(textAlign = TextAlign.Center),
                        modifier = GlanceModifier.defaultWeight(),
                    )
                }
            }
            val offset = ((month.atDay(1).dayOfWeek.value - weekStart.value) + 7) % 7
            val cells = offset + month.lengthOfMonth()
            val rows = (cells + 6) / 7
            for (r in 0 until rows) {
                Row(GlanceModifier.fillMaxWidth().padding(top = 2.dp)) {
                    for (c in 0 until 7) {
                        val day = r * 7 + c - offset + 1
                        Box(GlanceModifier.defaultWeight(), contentAlignment = Alignment.Center) {
                            if (day in 1..month.lengthOfMonth()) DayCell(snapshot, month.atDay(day))
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun DayCell(snapshot: ScheduleSnapshot, date: java.time.LocalDate) {
        val isToday = date == snapshot.today
        val hasEvents = snapshot.eventsOn(date).isNotEmpty()
        val bg = if (isToday) GlanceModifier.background(WidgetTheme.accent).cornerRadius(11.dp) else GlanceModifier
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(GlanceModifier.size(22.dp).then(bg), contentAlignment = Alignment.Center) {
                Text(
                    date.dayOfMonth.toString(),
                    style = TextStyle(
                        color = if (isToday) WidgetTheme.onAccent else WidgetTheme.navy,
                        fontSize = 11.sp,
                        fontWeight = if (isToday) androidx.glance.text.FontWeight.Bold else androidx.glance.text.FontWeight.Normal,
                    ),
                )
            }
            Box(GlanceModifier.size(4.dp).then(if (hasEvents) GlanceModifier.background(WidgetTheme.navy).cornerRadius(2.dp) else GlanceModifier)) {}
        }
    }
}

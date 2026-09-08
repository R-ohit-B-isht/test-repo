package app.ink.lockscreen.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll

/** Facade over the three Glance widgets: refresh all, or ask the launcher to pin one. */
class WidgetUpdater(private val context: Context) {

    enum class Kind(val label: String, val description: String) {
        CALENDAR("Calendar", "Month grid, today highlighted"),
        TASKS("Tasks", "Open tasks, urgent first"),
        NEXT_EVENT("Next event", "Countdown to what's next"),
    }

    suspend fun updateAll() {
        CalendarWidget().updateAll(context)
        TasksWidget().updateAll(context)
        NextEventWidget().updateAll(context)
    }

    suspend fun requestPin(kind: Kind): Boolean {
        val receiver = when (kind) {
            Kind.CALENDAR -> CalendarWidgetReceiver::class.java
            Kind.TASKS -> TasksWidgetReceiver::class.java
            Kind.NEXT_EVENT -> NextEventWidgetReceiver::class.java
        }
        return GlanceAppWidgetManager(context).requestPinGlanceAppWidget(receiver = receiver)
    }
}

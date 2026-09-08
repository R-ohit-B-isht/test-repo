package app.ink.lockscreen.reminders

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.ink.lockscreen.InkApplication
import app.ink.lockscreen.domain.model.Event
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ReminderReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val eventId = intent.getLongExtra(EXTRA_EVENT_ID, -1L)
        val title = intent.getStringExtra(EXTRA_TITLE) ?: return
        val startMillis = intent.getLongExtra(EXTRA_START, 0L)
        val allDay = intent.getBooleanExtra(EXTRA_ALL_DAY, false)
        val container = (context.applicationContext as InkApplication).container
        container.notifications.showReminder(eventId, title, startMillis, allDay)

        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                container.events.get(eventId)?.let { container.reminders.schedule(it) }
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        private const val EXTRA_EVENT_ID = "event_id"
        private const val EXTRA_TITLE = "title"
        private const val EXTRA_START = "start"
        private const val EXTRA_ALL_DAY = "all_day"

        fun intent(context: Context, occurrence: Event): Intent = Intent(context, ReminderReceiver::class.java)
            .putExtra(EXTRA_EVENT_ID, occurrence.id)
            .putExtra(EXTRA_TITLE, occurrence.title)
            .putExtra(EXTRA_START, occurrence.startEpochMillis)
            .putExtra(EXTRA_ALL_DAY, occurrence.allDay)
    }
}

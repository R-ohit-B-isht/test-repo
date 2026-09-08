package app.ink.lockscreen.reminders

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import app.ink.lockscreen.domain.RecurrenceExpander
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.ReminderLead
import app.ink.lockscreen.domain.repository.EventRepository
import java.time.LocalDateTime
import java.time.ZoneId

/**
 * Schedules one exact alarm per event with a reminder (next occurrence only; re-armed after it
 * fires or on each refresh). Falls back to inexact alarms when the user denied exact alarms.
 */
class ReminderScheduler(private val context: Context, private val events: EventRepository) {

    private val alarms: AlarmManager get() = context.getSystemService(AlarmManager::class.java)

    suspend fun rescheduleAll(now: LocalDateTime = LocalDateTime.now()) {
        events.withReminders(now.minusYears(5)).forEach { schedule(it, now) }
    }

    fun schedule(event: Event, now: LocalDateTime = LocalDateTime.now()) {
        cancel(event.id)
        if (event.reminder == ReminderLead.NONE || event.isReadOnly) return
        val next = RecurrenceExpander.expand(event, now, now.plusYears(2))
            .firstOrNull { it.start.minusMinutes(event.reminder.minutes.toLong()) > now } ?: return
        val fireAt = next.start.minusMinutes(event.reminder.minutes.toLong())
            .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val pi = pendingIntent(event.id, ReminderReceiver.intent(context, next))
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarms.canScheduleExactAlarms()) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, pi)
        } else {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, pi)
        }
    }

    fun cancel(eventId: Long) {
        alarms.cancel(pendingIntent(eventId, Intent(context, ReminderReceiver::class.java)))
    }

    private fun pendingIntent(eventId: Long, intent: Intent): PendingIntent = PendingIntent.getBroadcast(
        context, (eventId % Int.MAX_VALUE).toInt(), intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
}

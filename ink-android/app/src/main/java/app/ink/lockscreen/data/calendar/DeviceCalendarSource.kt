package app.ink.lockscreen.data.calendar

import android.Manifest
import android.content.ContentUris
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.core.content.ContextCompat
import app.ink.lockscreen.data.local.toLocalDateTime
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.ReminderLead
import app.ink.lockscreen.domain.model.RepeatRule
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZoneOffset

/**
 * Read-only adapter over the Android calendar provider. Any account synced to the device
 * (Google, Exchange, ...) shows up here, which is Ink's "Google Calendar sync" on Android.
 * Recurring events are already expanded by the provider's Instances table; each instance
 * row has its own unique _ID, which we keep as [Event.systemEventId].
 */
class DeviceCalendarSource(private val context: Context) {

    fun hasPermission(): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED

    fun instancesBetween(from: LocalDate, to: LocalDate): List<Event> {
        if (!hasPermission()) return emptyList()
        val zone = ZoneId.systemDefault()
        val fromMs = from.atStartOfDay(zone).toInstant().toEpochMilli()
        val toMs = to.atStartOfDay(zone).toInstant().toEpochMilli()
        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon().let {
            ContentUris.appendId(it, fromMs)
            ContentUris.appendId(it, toMs)
            it.build()
        }
        val cursor = context.contentResolver.query(
            uri, PROJECTION, "${CalendarContract.Instances.VISIBLE} = 1", null,
            "${CalendarContract.Instances.BEGIN} ASC",
        ) ?: return emptyList()
        val out = ArrayList<Event>()
        cursor.use { c ->
            while (c.moveToNext()) {
                val allDay = c.getInt(4) == 1
                var begin = c.getLong(2)
                var end = c.getLong(3)
                if (allDay) {
                    // All-day instances are reported in UTC midnight; re-anchor them to local midnight.
                    begin = begin.utcMidnightToLocal()
                    end = end.utcMidnightToLocal()
                }
                out += Event(
                    title = c.getString(1)?.takeIf { it.isNotBlank() } ?: "(No title)",
                    start = begin.toLocalDateTime(),
                    end = end.toLocalDateTime(),
                    allDay = allDay,
                    colorArgb = if (c.isNull(5)) Event.DEFAULT_COLOR else c.getInt(5),
                    repeat = RepeatRule.NONE,
                    reminder = ReminderLead.NONE,
                    notes = c.getString(6) ?: "",
                    systemEventId = c.getLong(0),
                    calendarName = c.getString(7),
                )
            }
        }
        return out
    }

    private fun Long.utcMidnightToLocal(): Long {
        val date = java.time.Instant.ofEpochMilli(this).atOffset(ZoneOffset.UTC).toLocalDate()
        return date.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
    }

    private companion object {
        val PROJECTION = arrayOf(
            CalendarContract.Instances._ID,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.DISPLAY_COLOR,
            CalendarContract.Instances.DESCRIPTION,
            CalendarContract.Instances.CALENDAR_DISPLAY_NAME,
        )
    }
}

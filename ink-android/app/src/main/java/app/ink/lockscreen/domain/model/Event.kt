package app.ink.lockscreen.domain.model

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId

enum class RepeatRule { NONE, DAILY, WEEKLY, MONTHLY, YEARLY }

/** Minutes before [Event.start] to fire a reminder notification. */
enum class ReminderLead(val minutes: Int) {
    NONE(-1), AT_TIME(0), FIVE_MIN(5), FIFTEEN_MIN(15), THIRTY_MIN(30), ONE_HOUR(60), ONE_DAY(24 * 60);

    companion object {
        fun fromMinutes(minutes: Int): ReminderLead = entries.firstOrNull { it.minutes == minutes } ?: NONE
    }
}

/**
 * A calendar event. Either owned by Ink (stored in Room) or mirrored read-only from the
 * device calendar provider ([systemEventId] != null).
 */
data class Event(
    val id: Long = 0,
    val title: String,
    val start: LocalDateTime,
    val end: LocalDateTime,
    val allDay: Boolean = false,
    val colorArgb: Int = DEFAULT_COLOR,
    val repeat: RepeatRule = RepeatRule.NONE,
    val reminder: ReminderLead = ReminderLead.NONE,
    val notes: String = "",
    val systemEventId: Long? = null,
    val calendarName: String? = null,
) {
    val isReadOnly: Boolean get() = systemEventId != null
    val date: LocalDate get() = start.toLocalDate()
    val startEpochMillis: Long get() = start.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

    companion object {
        const val DEFAULT_COLOR = 0xFF4C6FFF.toInt()
    }
}

package app.ink.lockscreen.domain.usecase

import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.repository.EventRepository
import app.ink.lockscreen.domain.repository.TaskRepository
import java.time.LocalDate
import java.time.LocalDateTime

/** Everything a glanceable surface (wallpaper, widget, live card) needs, resolved once. */
data class ScheduleSnapshot(
    val now: LocalDateTime,
    val events: List<Event>,
    val openTasks: List<Task>,
) {
    val today: LocalDate get() = now.toLocalDate()
    fun eventsOn(date: LocalDate): List<Event> = events.filter { it.date == date || (it.start.toLocalDate() < date && it.end.toLocalDate() >= date) }
    val todayEvents: List<Event> get() = eventsOn(today)
    val nextEvent: Event? get() = events.firstOrNull { it.end > now && !it.allDay } ?: events.firstOrNull { it.end > now }
}

class BuildScheduleSnapshot(
    private val events: EventRepository,
    private val tasks: TaskRepository,
) {
    suspend operator fun invoke(now: LocalDateTime = LocalDateTime.now()): ScheduleSnapshot {
        val monthStart = now.toLocalDate().withDayOfMonth(1).minusDays(7).atStartOfDay()
        val windowEnd = now.toLocalDate().plusMonths(1).plusDays(7).atStartOfDay()
        return ScheduleSnapshot(
            now = now,
            events = events.between(monthStart, windowEnd),
            openTasks = tasks.open(),
        )
    }
}

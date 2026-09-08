package app.ink.lockscreen.dev

import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.BuildConfig
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.model.NoteColor
import app.ink.lockscreen.domain.model.ReminderLead
import app.ink.lockscreen.domain.model.RepeatRule
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.model.TaskQuadrant
import java.time.LocalDate
import java.time.LocalDateTime

/**
 * Developer mode (debug builds only, `BuildConfig.DEV_MODE`, overridable with the
 * `INK_DEV_MODE` env var at build time). Loads a realistic week so every surface —
 * calendar, matrix, notes board, wallpaper, widgets — can be exercised in one tap.
 * Never compiled into release behaviour: [isEnabled] is a constant `false` there.
 */
object DevTools {

    val isEnabled: Boolean get() = BuildConfig.DEV_MODE

    suspend fun loadSampleWeek(container: AppContainer, today: LocalDate = LocalDate.now()) {
        if (!isEnabled) return
        val now = LocalDateTime.now()
        val at = { day: Int, h: Int, m: Int -> today.plusDays(day.toLong()).atTime(h, m) }
        listOf(
            Event(title = "Design review", start = at(0, 10, 0), end = at(0, 11, 0), colorArgb = 0xFF4C6FFF.toInt(), reminder = ReminderLead.FIFTEEN_MIN, notes = "Bring the lock-screen mockups."),
            Event(title = "Lunch with Maya", start = at(0, 12, 30), end = at(0, 13, 30), colorArgb = 0xFFFF7A59.toInt()),
            Event(title = "Gym", start = at(0, 18, 0), end = at(0, 19, 0), colorArgb = 0xFF2BB673.toInt(), repeat = RepeatRule.WEEKLY),
            Event(title = "Sprint planning", start = at(1, 9, 30), end = at(1, 10, 30), colorArgb = 0xFF4C6FFF.toInt(), reminder = ReminderLead.FIVE_MIN),
            Event(title = "Dentist", start = at(2, 15, 0), end = at(2, 15, 45), colorArgb = 0xFFB56576.toInt(), reminder = ReminderLead.ONE_HOUR),
            Event(title = "Team offsite", start = at(4, 0, 0), end = at(5, 0, 0), allDay = true, colorArgb = 0xFFFFC857.toInt()),
            Event(title = "Standup", start = at(-7, 9, 0), end = at(-7, 9, 15), colorArgb = 0xFF6B7088.toInt(), repeat = RepeatRule.DAILY),
            Event(title = "Rent due", start = today.withDayOfMonth(1).atTime(9, 0), end = today.withDayOfMonth(1).atTime(9, 30), repeat = RepeatRule.MONTHLY, colorArgb = 0xFF1B2140.toInt()),
        ).forEach { container.events.save(it) }

        listOf(
            Task(title = "Send invoice to Studio North", quadrant = TaskQuadrant.DO_NOW, dueAt = at(0, 17, 0), createdAt = now),
            Task(title = "Fix widget refresh bug", quadrant = TaskQuadrant.DO_NOW, createdAt = now),
            Task(title = "Draft Q4 roadmap", quadrant = TaskQuadrant.PLAN, dueAt = at(3, 12, 0), createdAt = now),
            Task(title = "Read 'Make Time'", quadrant = TaskQuadrant.PLAN, createdAt = now),
            Task(title = "Book flights for offsite", quadrant = TaskQuadrant.DELEGATE, createdAt = now),
            Task(title = "Reorganize Drive folders", quadrant = TaskQuadrant.DROP, createdAt = now),
            Task(title = "Renew passport", quadrant = TaskQuadrant.PLAN, completedAt = now.minusDays(1), createdAt = now.minusDays(3)),
        ).forEach { container.tasks.save(it) }

        listOf(
            Note(title = "Wallpaper ideas", body = "Try the Timetable layout with the Dusk preset. Dim ~30%.", color = NoteColor.BUTTER, pinned = true, createdAt = now, updatedAt = now),
            Note(title = "Groceries", body = "Oat milk, lemons, basil, sourdough, eggs", color = NoteColor.MINT, createdAt = now.minusHours(5), updatedAt = now.minusHours(5)),
            Note(title = "Quote", body = "\"Plans are worthless, but planning is everything.\"", color = NoteColor.SKY, createdAt = now.minusDays(1), updatedAt = now.minusDays(1)),
            Note(title = "Gift for Dad", body = "Fountain pen — the navy one from the shop on 5th.", color = NoteColor.BLUSH, createdAt = now.minusDays(2), updatedAt = now.minusDays(2)),
        ).forEach { container.notes.save(it) }
    }
}

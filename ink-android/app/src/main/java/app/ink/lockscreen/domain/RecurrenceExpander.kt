package app.ink.lockscreen.domain

import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.RepeatRule
import java.time.Duration
import java.time.LocalDateTime

/** Expands repeating events into concrete occurrences inside a window. */
object RecurrenceExpander {

    private const val MAX_OCCURRENCES = 1_000

    fun expand(base: Event, from: LocalDateTime, to: LocalDateTime): List<Event> {
        if (base.repeat == RepeatRule.NONE) return listOf(base).filter { it.overlaps(from, to) }
        val duration = Duration.between(base.start, base.end)
        val out = ArrayList<Event>()
        var start = base.start
        var guard = 0
        while (start < to && guard++ < MAX_OCCURRENCES) {
            val end = start.plus(duration)
            if (end >= from) out += base.copy(start = start, end = end)
            start = step(start, base.repeat)
        }
        return out
    }

    /** Merges plain and repeating events for a window, sorted by start. */
    fun occurrences(plain: List<Event>, repeating: List<Event>, from: LocalDateTime, to: LocalDateTime): List<Event> {
        val expanded = repeating.flatMap { expand(it, from, to) }
        return (plain.filter { it.repeat == RepeatRule.NONE } + expanded).sortedBy { it.start }
    }

    private fun step(t: LocalDateTime, rule: RepeatRule): LocalDateTime = when (rule) {
        RepeatRule.DAILY -> t.plusDays(1)
        RepeatRule.WEEKLY -> t.plusWeeks(1)
        RepeatRule.MONTHLY -> t.plusMonths(1)
        RepeatRule.YEARLY -> t.plusYears(1)
        RepeatRule.NONE -> t
    }

    private fun Event.overlaps(from: LocalDateTime, to: LocalDateTime) = start < to && end >= from
}

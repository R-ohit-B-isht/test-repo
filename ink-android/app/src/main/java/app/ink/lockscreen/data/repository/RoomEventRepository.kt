package app.ink.lockscreen.data.repository

import app.ink.lockscreen.data.local.EventDao
import app.ink.lockscreen.data.local.toDomain
import app.ink.lockscreen.data.local.toEntity
import app.ink.lockscreen.data.local.toEpochMillis
import app.ink.lockscreen.domain.RecurrenceExpander
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.repository.EventRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import java.time.LocalDateTime

class RoomEventRepository(private val dao: EventDao) : EventRepository {

    override fun observeBetween(from: LocalDateTime, to: LocalDateTime): Flow<List<Event>> {
        val fromMs = from.toEpochMillis()
        val toMs = to.toEpochMillis()
        return combine(dao.observeBetween(fromMs, toMs), dao.observeRepeatingBefore(toMs)) { plain, repeating ->
            RecurrenceExpander.occurrences(plain.map { it.toDomain() }, repeating.map { it.toDomain() }, from, to)
        }
    }

    override suspend fun between(from: LocalDateTime, to: LocalDateTime): List<Event> {
        val fromMs = from.toEpochMillis()
        val toMs = to.toEpochMillis()
        return RecurrenceExpander.occurrences(
            dao.between(fromMs, toMs).map { it.toDomain() },
            dao.repeatingBefore(toMs).map { it.toDomain() },
            from,
            to,
        )
    }

    override suspend fun get(id: Long): Event? = dao.byId(id)?.toDomain()

    override suspend fun save(event: Event): Long = dao.upsert(event.toEntity())

    override suspend fun delete(event: Event) = dao.delete(event.toEntity())

    override suspend fun withReminders(now: LocalDateTime): List<Event> =
        dao.upcomingWithReminders(now.toEpochMillis()).map { it.toDomain() }

    override suspend fun replaceSystemMirror(events: List<Event>) {
        dao.clearSystemMirror()
        if (events.isNotEmpty()) dao.upsertAll(events.map { it.toEntity() })
    }
}

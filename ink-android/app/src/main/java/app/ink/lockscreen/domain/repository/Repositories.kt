package app.ink.lockscreen.domain.repository

import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.model.Task
import kotlinx.coroutines.flow.Flow
import java.time.LocalDateTime

interface EventRepository {
    fun observeBetween(from: LocalDateTime, to: LocalDateTime): Flow<List<Event>>
    suspend fun between(from: LocalDateTime, to: LocalDateTime): List<Event>
    suspend fun get(id: Long): Event?
    suspend fun save(event: Event): Long
    suspend fun delete(event: Event)
    suspend fun withReminders(now: LocalDateTime): List<Event>
    /** Replaces the mirrored device-calendar events with [events] (empty list clears the mirror). */
    suspend fun replaceSystemMirror(events: List<Event>)
}

interface TaskRepository {
    fun observeActive(): Flow<List<Task>>
    suspend fun open(): List<Task>
    suspend fun get(id: Long): Task?
    suspend fun save(task: Task): Long
    suspend fun setCompleted(id: Long, completed: Boolean)
    /** Soft delete only — the row stays in the database. */
    suspend fun delete(id: Long)
}

interface NoteRepository {
    fun observeAll(): Flow<List<Note>>
    suspend fun get(id: Long): Note?
    suspend fun save(note: Note): Long
    suspend fun delete(note: Note)
}

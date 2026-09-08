package app.ink.lockscreen.data.local

import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.model.NoteColor
import app.ink.lockscreen.domain.model.ReminderLead
import app.ink.lockscreen.domain.model.RepeatRule
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.model.TaskQuadrant
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId

private val zone: ZoneId get() = ZoneId.systemDefault()

fun Long.toLocalDateTime(): LocalDateTime = Instant.ofEpochMilli(this).atZone(zone).toLocalDateTime()
fun LocalDateTime.toEpochMillis(): Long = atZone(zone).toInstant().toEpochMilli()

private inline fun <reified E : Enum<E>> String.toEnumOr(default: E): E =
    enumValues<E>().firstOrNull { it.name == this } ?: default

fun EventEntity.toDomain() = Event(
    id = id,
    title = title,
    start = startMillis.toLocalDateTime(),
    end = endMillis.toLocalDateTime(),
    allDay = allDay,
    colorArgb = colorArgb,
    repeat = repeat.toEnumOr(RepeatRule.NONE),
    reminder = ReminderLead.fromMinutes(reminderMinutes),
    notes = notes,
    systemEventId = systemEventId,
    calendarName = calendarName,
)

fun Event.toEntity() = EventEntity(
    id = id,
    title = title,
    startMillis = start.toEpochMillis(),
    endMillis = end.toEpochMillis(),
    allDay = allDay,
    colorArgb = colorArgb,
    repeat = repeat.name,
    reminderMinutes = reminder.minutes,
    notes = notes,
    systemEventId = systemEventId,
    calendarName = calendarName,
)

fun TaskEntity.toDomain() = Task(
    id = id,
    title = title,
    quadrant = quadrant.toEnumOr(TaskQuadrant.PLAN),
    dueAt = dueMillis?.toLocalDateTime(),
    completedAt = completedAt?.toLocalDateTime(),
    notes = notes,
    createdAt = createdAt.toLocalDateTime(),
    deletedAt = deletedAt?.toLocalDateTime(),
)

fun Task.toEntity() = TaskEntity(
    id = id,
    title = title,
    quadrant = quadrant.name,
    dueMillis = dueAt?.toEpochMillis(),
    completedAt = completedAt?.toEpochMillis(),
    notes = notes,
    createdAt = createdAt.toEpochMillis(),
    deletedAt = deletedAt?.toEpochMillis(),
)

fun NoteEntity.toDomain() = Note(
    id = id,
    title = title,
    body = body,
    color = color.toEnumOr(NoteColor.BUTTER),
    pinned = pinned,
    createdAt = createdAt.toLocalDateTime(),
    updatedAt = updatedAt.toLocalDateTime(),
)

fun Note.toEntity() = NoteEntity(
    id = id,
    title = title,
    body = body,
    color = color.name,
    pinned = pinned,
    createdAt = createdAt.toEpochMillis(),
    updatedAt = updatedAt.toEpochMillis(),
)

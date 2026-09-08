package app.ink.lockscreen.data.local

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "events", indices = [Index("startMillis"), Index("systemEventId", unique = true)])
data class EventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val startMillis: Long,
    val endMillis: Long,
    val allDay: Boolean,
    val colorArgb: Int,
    val repeat: String,
    val reminderMinutes: Int,
    val notes: String,
    val systemEventId: Long?,
    val calendarName: String?,
)

@Entity(tableName = "tasks", indices = [Index("deletedAt"), Index("completedAt")])
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val quadrant: String,
    val dueMillis: Long?,
    val completedAt: Long?,
    val notes: String,
    val createdAt: Long,
    @ColumnInfo(defaultValue = "NULL") val deletedAt: Long?,
)

@Entity(tableName = "notes", indices = [Index("updatedAt")])
data class NoteEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val body: String,
    val color: String,
    val pinned: Boolean,
    val createdAt: Long,
    val updatedAt: Long,
)

package app.ink.lockscreen.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {
    @Query("SELECT * FROM events WHERE startMillis < :toMillis AND endMillis >= :fromMillis ORDER BY startMillis")
    fun observeBetween(fromMillis: Long, toMillis: Long): Flow<List<EventEntity>>

    @Query("SELECT * FROM events WHERE startMillis < :toMillis AND endMillis >= :fromMillis ORDER BY startMillis")
    suspend fun between(fromMillis: Long, toMillis: Long): List<EventEntity>

    @Query("SELECT * FROM events WHERE repeat != 'NONE' AND startMillis < :toMillis")
    fun observeRepeatingBefore(toMillis: Long): Flow<List<EventEntity>>

    @Query("SELECT * FROM events WHERE repeat != 'NONE' AND startMillis < :toMillis")
    suspend fun repeatingBefore(toMillis: Long): List<EventEntity>

    @Query("SELECT * FROM events WHERE id = :id")
    suspend fun byId(id: Long): EventEntity?

    @Query("SELECT * FROM events WHERE reminderMinutes >= 0 AND systemEventId IS NULL AND startMillis > :nowMillis")
    suspend fun upcomingWithReminders(nowMillis: Long): List<EventEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(event: EventEntity): Long

    @Update
    suspend fun update(event: EventEntity)

    @Delete
    suspend fun delete(event: EventEntity)

    @Query("DELETE FROM events WHERE systemEventId IS NOT NULL")
    suspend fun clearSystemMirror()

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(events: List<EventEntity>)
}

@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE deletedAt IS NULL ORDER BY completedAt IS NOT NULL, dueMillis IS NULL, dueMillis, createdAt DESC")
    fun observeActive(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE deletedAt IS NULL AND completedAt IS NULL ORDER BY dueMillis IS NULL, dueMillis, createdAt DESC")
    suspend fun open(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE id = :id")
    suspend fun byId(id: Long): TaskEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(task: TaskEntity): Long

    @Query("UPDATE tasks SET completedAt = :completedAt WHERE id = :id")
    suspend fun setCompleted(id: Long, completedAt: Long?)

    /** Soft delete — rows are retained and filtered out by every read query. */
    @Query("UPDATE tasks SET deletedAt = :deletedAt WHERE id = :id")
    suspend fun softDelete(id: Long, deletedAt: Long)
}

@Dao
interface NoteDao {
    @Query("SELECT * FROM notes ORDER BY pinned DESC, updatedAt DESC")
    fun observeAll(): Flow<List<NoteEntity>>

    @Query("SELECT * FROM notes WHERE id = :id")
    suspend fun byId(id: Long): NoteEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(note: NoteEntity): Long

    @Delete
    suspend fun delete(note: NoteEntity)
}

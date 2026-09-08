package app.ink.lockscreen.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [EventEntity::class, TaskEntity::class, NoteEntity::class],
    version = 1,
    exportSchema = true,
)
abstract class InkDatabase : RoomDatabase() {
    abstract fun eventDao(): EventDao
    abstract fun taskDao(): TaskDao
    abstract fun noteDao(): NoteDao

    companion object {
        fun build(context: Context): InkDatabase =
            Room.databaseBuilder(context, InkDatabase::class.java, "ink.db").build()
    }
}

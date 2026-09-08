package app.ink.lockscreen.data.repository

import app.ink.lockscreen.data.local.NoteDao
import app.ink.lockscreen.data.local.toDomain
import app.ink.lockscreen.data.local.toEntity
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.repository.NoteRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class RoomNoteRepository(private val dao: NoteDao) : NoteRepository {

    override fun observeAll(): Flow<List<Note>> = dao.observeAll().map { rows -> rows.map { it.toDomain() } }

    override suspend fun get(id: Long): Note? = dao.byId(id)?.toDomain()

    override suspend fun save(note: Note): Long = dao.upsert(note.toEntity())

    override suspend fun delete(note: Note) = dao.delete(note.toEntity())
}

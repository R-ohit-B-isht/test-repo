package app.ink.lockscreen.data.repository

import app.ink.lockscreen.data.local.TaskDao
import app.ink.lockscreen.data.local.toDomain
import app.ink.lockscreen.data.local.toEntity
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.repository.TaskRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class RoomTaskRepository(
    private val dao: TaskDao,
    private val clock: () -> Long = System::currentTimeMillis,
) : TaskRepository {

    override fun observeActive(): Flow<List<Task>> =
        dao.observeActive().map { rows -> rows.map { it.toDomain() } }

    override suspend fun open(): List<Task> = dao.open().map { it.toDomain() }

    override suspend fun get(id: Long): Task? = dao.byId(id)?.toDomain()

    override suspend fun save(task: Task): Long = dao.upsert(task.toEntity())

    override suspend fun setCompleted(id: Long, completed: Boolean) =
        dao.setCompleted(id, if (completed) clock() else null)

    override suspend fun delete(id: Long) = dao.softDelete(id, clock())
}

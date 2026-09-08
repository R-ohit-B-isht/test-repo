package app.ink.lockscreen.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.model.TaskQuadrant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDateTime

enum class TasksView(val label: String) { MATRIX("Matrix"), LIST("List") }

data class TasksState(
    val view: TasksView = TasksView.MATRIX,
    val showCompleted: Boolean = false,
    val tasks: List<Task> = emptyList(),
    val use24Hour: Boolean = false,
    val editing: Task? = null,
    val editorQuadrant: TaskQuadrant = TaskQuadrant.PLAN,
    val showEditor: Boolean = false,
) {
    val visible: List<Task> get() = tasks.filter { it.isCompleted == showCompleted }
    fun inQuadrant(q: TaskQuadrant): List<Task> = visible.filter { it.quadrant == q }
    val openCount: Int get() = tasks.count { !it.isCompleted }
    val doneCount: Int get() = tasks.count { it.isCompleted }
}

class TasksViewModel(private val container: AppContainer) : ViewModel() {

    private val local = MutableStateFlow(TasksState())

    /** Repository already excludes soft-deleted rows, so nothing deleted can reach the UI. */
    val state: StateFlow<TasksState> = combine(local, container.tasks.observeActive(), container.settings.settings) { s, tasks, settings ->
        s.copy(tasks = tasks, use24Hour = settings.use24Hour)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), TasksState())

    fun setView(view: TasksView) = local.update { it.copy(view = view) }
    fun setShowCompleted(show: Boolean) = local.update { it.copy(showCompleted = show) }

    fun newTask(quadrant: TaskQuadrant = TaskQuadrant.PLAN) = local.update { it.copy(editing = null, editorQuadrant = quadrant, showEditor = true) }
    fun edit(task: Task) = local.update { it.copy(editing = task, editorQuadrant = task.quadrant, showEditor = true) }
    fun closeEditor() = local.update { it.copy(showEditor = false) }

    fun save(task: Task) {
        viewModelScope.launch {
            container.tasks.save(task)
            closeEditor()
            container.refreshSurfaces()
        }
    }

    fun toggleDone(task: Task) {
        viewModelScope.launch {
            container.tasks.setCompleted(task.id, !task.isCompleted)
            container.refreshSurfaces()
        }
    }

    /** Soft delete: the row is flagged with deletedAt and disappears from every query. */
    fun delete(task: Task) {
        viewModelScope.launch {
            container.tasks.delete(task.id)
            closeEditor()
            container.refreshSurfaces()
        }
    }

    fun blankTask(quadrant: TaskQuadrant): Task = Task(title = "", quadrant = quadrant, createdAt = LocalDateTime.now())
}

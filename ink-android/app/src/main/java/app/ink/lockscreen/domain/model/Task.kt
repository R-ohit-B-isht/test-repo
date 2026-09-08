package app.ink.lockscreen.domain.model

import java.time.LocalDateTime

/** Eisenhower matrix quadrant, matching Ink's "Do now / Plan / Delegate / Drop" board. */
enum class TaskQuadrant(val label: String, val subtitle: String) {
    DO_NOW("Do now", "Urgent & important"),
    PLAN("Plan", "Important, not urgent"),
    DELEGATE("Delegate", "Urgent, not important"),
    DROP("Drop", "Neither");

    val isUrgent: Boolean get() = this == DO_NOW || this == DELEGATE
    val isImportant: Boolean get() = this == DO_NOW || this == PLAN
}

/**
 * A to-do item. Tasks are never hard-deleted: [deletedAt] marks a soft delete and
 * every query filters those rows out.
 */
data class Task(
    val id: Long = 0,
    val title: String,
    val quadrant: TaskQuadrant = TaskQuadrant.PLAN,
    val dueAt: LocalDateTime? = null,
    val completedAt: LocalDateTime? = null,
    val notes: String = "",
    val createdAt: LocalDateTime,
    val deletedAt: LocalDateTime? = null,
) {
    val isCompleted: Boolean get() = completedAt != null
}

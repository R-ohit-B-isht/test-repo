package app.ink.lockscreen.ui.tasks

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.model.TaskQuadrant
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkCard
import app.ink.lockscreen.ui.theme.InkColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/** One cell of the Eisenhower matrix. */
@Composable
fun QuadrantCard(quadrant: TaskQuadrant, tasks: List<Task>, use24Hour: Boolean, vm: TasksViewModel, modifier: Modifier = Modifier) {
    InkCard(modifier = modifier.heightIn(min = 180.dp), contentPadding = PaddingValues(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(8.dp).background(quadrant.tint(), CircleShape))
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Text(quadrant.label, style = MaterialTheme.typography.titleMedium)
                Eyebrow(quadrant.subtitle)
            }
            IconButton(onClick = { vm.newTask(quadrant) }, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Outlined.Add, contentDescription = "Add to ${quadrant.label}", tint = InkColors.Muted)
            }
        }
        Spacer(Modifier.size(8.dp))
        if (tasks.isEmpty()) {
            Text("—", style = MaterialTheme.typography.bodyMedium, color = InkColors.Line)
        }
        tasks.take(6).forEach { task ->
            Row(
                Modifier.fillMaxWidth().clickable { vm.edit(task) }.padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(
                    checked = task.isCompleted, onCheckedChange = { vm.toggleDone(task) },
                    modifier = Modifier.size(20.dp),
                    colors = CheckboxDefaults.colors(checkedColor = InkColors.Navy, uncheckedColor = InkColors.Line),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    task.title, style = MaterialTheme.typography.bodyMedium, maxLines = 2,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else null,
                    color = if (task.isCompleted) InkColors.Muted else InkColors.Navy,
                )
            }
        }
        if (tasks.size > 6) Text("+${tasks.size - 6} more", style = MaterialTheme.typography.labelSmall, color = InkColors.Muted)
    }
}

@Composable
fun TaskRow(task: Task, use24Hour: Boolean, onToggle: () -> Unit, onClick: () -> Unit, modifier: Modifier = Modifier) {
    InkCard(modifier = modifier.fillMaxWidth(), onClick = onClick, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = task.isCompleted, onCheckedChange = { onToggle() },
                colors = CheckboxDefaults.colors(checkedColor = InkColors.Navy, uncheckedColor = InkColors.Line),
            )
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    task.title, style = MaterialTheme.typography.bodyMedium, maxLines = 1,
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else null,
                    color = if (task.isCompleted) InkColors.Muted else InkColors.Navy,
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.size(6.dp).background(task.quadrant.tint(), CircleShape))
                    Eyebrow(task.quadrant.label)
                    task.dueAt?.let { Eyebrow(dueLabel(it, use24Hour)) }
                }
            }
        }
    }
}

fun dueLabel(due: java.time.LocalDateTime, use24Hour: Boolean): String {
    val time = due.format(DateTimeFormatter.ofPattern(if (use24Hour) "HH:mm" else "h:mm a"))
    return when (due.toLocalDate()) {
        LocalDate.now() -> "Today $time"
        LocalDate.now().plusDays(1) -> "Tomorrow $time"
        else -> due.format(DateTimeFormatter.ofPattern("d MMM")) + " $time"
    }
}

fun TaskQuadrant.tint() = when (this) {
    TaskQuadrant.DO_NOW -> androidx.compose.ui.graphics.Color(0xFFE07A5F)
    TaskQuadrant.PLAN -> androidx.compose.ui.graphics.Color(0xFF4C6FFF)
    TaskQuadrant.DELEGATE -> InkColors.Accent
    TaskQuadrant.DROP -> InkColors.Muted
}

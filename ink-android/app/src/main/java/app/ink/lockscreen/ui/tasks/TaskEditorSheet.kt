package app.ink.lockscreen.ui.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.Task
import app.ink.lockscreen.domain.model.TaskQuadrant
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.components.pickers.DateField
import app.ink.lockscreen.ui.components.pickers.TimeField
import app.ink.lockscreen.ui.theme.InkColors
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskEditorSheet(
    initial: Task,
    isNew: Boolean,
    use24Hour: Boolean,
    onDismiss: () -> Unit,
    onSave: (Task) -> Unit,
    onDelete: (Task) -> Unit,
) {
    var title by rememberSaveable { mutableStateOf(initial.title) }
    var quadrant by rememberSaveable { mutableStateOf(initial.quadrant) }
    var hasDue by rememberSaveable { mutableStateOf(initial.dueAt != null) }
    var dueDate by rememberSaveable { mutableStateOf(initial.dueAt?.toLocalDate() ?: LocalDate.now()) }
    var dueTime by rememberSaveable { mutableStateOf(initial.dueAt?.toLocalTime() ?: LocalTime.of(9, 0)) }
    var notes by rememberSaveable { mutableStateOf(initial.notes) }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = InkColors.Paper) {
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(if (isNew) "New task" else "Edit task", style = MaterialTheme.typography.headlineLarge)
            OutlinedTextField(
                value = title, onValueChange = { title = it },
                label = { Text("What needs doing?") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
            )
            Eyebrow("Priority")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                PillRow(listOf(TaskQuadrant.DO_NOW, TaskQuadrant.PLAN), quadrant, { it.label }) { quadrant = it }
                PillRow(listOf(TaskQuadrant.DELEGATE, TaskQuadrant.DROP), quadrant, { it.label }) { quadrant = it }
            }
            Text(quadrant.subtitle, style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted)
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Due", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                InkSwitch(hasDue, { hasDue = it })
            }
            if (hasDue) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    DateField("Date", dueDate, modifier = Modifier.weight(1.4f)) { dueDate = it }
                    TimeField("Time", dueTime, use24Hour, modifier = Modifier.weight(1f)) { dueTime = it }
                }
            }
            OutlinedTextField(
                value = notes, onValueChange = { notes = it }, label = { Text("Notes") },
                minLines = 2, modifier = Modifier.fillMaxWidth(),
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (!isNew) TextButton(onClick = { onDelete(initial) }) { Text("Delete", color = InkColors.Danger) }
                Spacer(Modifier.weight(1f))
                Button(
                    enabled = title.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = InkColors.Navy),
                    onClick = {
                        onSave(
                            initial.copy(
                                title = title.trim(),
                                quadrant = quadrant,
                                dueAt = if (hasDue) LocalDateTime.of(dueDate, dueTime) else null,
                                notes = notes.trim(),
                            ),
                        )
                    },
                ) { Text("Save") }
            }
        }
    }
}

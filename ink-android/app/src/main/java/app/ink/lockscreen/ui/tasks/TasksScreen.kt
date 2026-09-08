package app.ink.lockscreen.ui.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.TaskQuadrant
import app.ink.lockscreen.ui.components.EmptyState
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors

@Composable
fun TasksScreen(container: AppContainer) {
    val vm = inkViewModel { TasksViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()

    Box(Modifier.fillMaxSize()) {
        LazyColumn(contentPadding = PaddingValues(bottom = 96.dp)) {
            item {
                Row(
                    Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Tasks", style = MaterialTheme.typography.headlineLarge, modifier = Modifier.weight(1f))
                    PillRow(TasksView.entries, state.view, { it.label }, onSelect = vm::setView)
                }
            }
            item {
                PillRow(
                    options = listOf(false, true),
                    selected = state.showCompleted,
                    label = { if (it) "Completed · ${state.doneCount}" else "To do · ${state.openCount}" },
                    onSelect = vm::setShowCompleted,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                )
            }
            if (state.visible.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Outlined.CheckCircle,
                        title = if (state.showCompleted) "Nothing completed yet" else "No open tasks",
                        message = if (state.showCompleted) "Tick a task and it lands here." else "Tap + to add one. Urgent tasks show up on your lock screen and Tasks widget.",
                    )
                }
            } else when (state.view) {
                TasksView.MATRIX -> {
                    item {
                        Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                QuadrantCard(TaskQuadrant.DO_NOW, state.inQuadrant(TaskQuadrant.DO_NOW), state.use24Hour, vm, Modifier.weight(1f))
                                QuadrantCard(TaskQuadrant.PLAN, state.inQuadrant(TaskQuadrant.PLAN), state.use24Hour, vm, Modifier.weight(1f))
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                QuadrantCard(TaskQuadrant.DELEGATE, state.inQuadrant(TaskQuadrant.DELEGATE), state.use24Hour, vm, Modifier.weight(1f))
                                QuadrantCard(TaskQuadrant.DROP, state.inQuadrant(TaskQuadrant.DROP), state.use24Hour, vm, Modifier.weight(1f))
                            }
                        }
                    }
                }
                TasksView.LIST -> {
                    items(state.visible, key = { it.id }) { task ->
                        TaskRow(task, state.use24Hour, onToggle = { vm.toggleDone(task) }, onClick = { vm.edit(task) }, modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp))
                    }
                }
            }
            item { Spacer(Modifier.height(8.dp)) }
        }
        FloatingActionButton(
            onClick = { vm.newTask() },
            containerColor = InkColors.Navy,
            contentColor = InkColors.Card,
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
        ) { Icon(Icons.Outlined.Add, contentDescription = "Add task") }
    }

    if (state.showEditor) {
        TaskEditorSheet(
            initial = state.editing ?: vm.blankTask(state.editorQuadrant),
            isNew = state.editing == null,
            use24Hour = state.use24Hour,
            onDismiss = vm::closeEditor,
            onSave = vm::save,
            onDelete = vm::delete,
        )
    }
}

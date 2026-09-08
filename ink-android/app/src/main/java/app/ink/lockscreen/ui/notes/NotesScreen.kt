package app.ink.lockscreen.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.staggeredgrid.LazyVerticalStaggeredGrid
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridCells
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridItemSpan
import androidx.compose.foundation.lazy.staggeredgrid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material.icons.outlined.StickyNote2
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.ui.components.EmptyState
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors
import java.time.format.DateTimeFormatter

@Composable
fun NotesScreen(container: AppContainer) {
    val vm = inkViewModel { NotesViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()

    Box(Modifier.fillMaxSize()) {
        LazyVerticalStaggeredGrid(
            columns = StaggeredGridCells.Fixed(2),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 96.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalItemSpacing = 12.dp,
            modifier = Modifier.fillMaxSize(),
        ) {
            item(span = StaggeredGridItemSpan.FullLine) {
                Row(Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Notes", style = MaterialTheme.typography.headlineLarge, modifier = Modifier.weight(1f))
                    Text("${state.notes.size}", style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted)
                }
            }
            if (state.notes.isEmpty()) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    EmptyState(Icons.Outlined.StickyNote2, "No notes yet", "Tap + to jot something down. Pin the ones you want to keep on top.")
                }
            }
            if (state.pinned.isNotEmpty()) {
                item(span = StaggeredGridItemSpan.FullLine) { Eyebrow("Pinned", Modifier.padding(top = 8.dp)) }
                items(state.pinned, key = { "p${it.id}" }) { note -> StickyNote(note, onClick = { vm.edit(note) }, onPin = { vm.togglePin(note) }) }
                if (state.others.isNotEmpty()) item(span = StaggeredGridItemSpan.FullLine) { Eyebrow("Others", Modifier.padding(top = 8.dp)) }
            }
            items(state.others, key = { it.id }) { note -> StickyNote(note, onClick = { vm.edit(note) }, onPin = { vm.togglePin(note) }) }
        }
        FloatingActionButton(
            onClick = vm::newNote,
            containerColor = InkColors.Navy,
            contentColor = InkColors.Card,
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
        ) { Icon(Icons.Outlined.Add, contentDescription = "Add note") }
    }

    if (state.showEditor) {
        NoteEditorSheet(
            initial = state.editing ?: vm.blank(),
            isNew = state.editing == null,
            onDismiss = vm::closeEditor,
            onSave = vm::save,
            onDelete = vm::delete,
        )
    }
}

/** A sticky-note card — Ink's notes board shows notes as tinted paper squares. */
@Composable
private fun StickyNote(note: Note, onClick: () -> Unit, onPin: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .heightIn(min = 120.dp)
            .clip(MaterialTheme.shapes.medium)
            .background(Color(note.color.argb))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Text(
                note.title.ifBlank { "Untitled" }, style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f), maxLines = 2,
            )
            Icon(
                Icons.Outlined.PushPin, contentDescription = if (note.pinned) "Unpin" else "Pin",
                tint = if (note.pinned) InkColors.Navy else InkColors.Navy.copy(alpha = 0.25f),
                modifier = Modifier.height(18.dp).clickable(onClick = onPin),
            )
        }
        if (note.body.isNotBlank()) Text(note.body, style = MaterialTheme.typography.bodyMedium, maxLines = 8)
        Spacer(Modifier.height(2.dp))
        Text(
            note.updatedAt.format(DateTimeFormatter.ofPattern("d MMM")),
            style = MaterialTheme.typography.labelSmall, color = InkColors.Navy.copy(alpha = 0.55f),
        )
    }
}

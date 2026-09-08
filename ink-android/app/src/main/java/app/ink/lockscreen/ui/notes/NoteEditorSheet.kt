package app.ink.lockscreen.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.model.NoteColor
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.theme.InkColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteEditorSheet(initial: Note, isNew: Boolean, onDismiss: () -> Unit, onSave: (Note) -> Unit, onDelete: (Note) -> Unit) {
    var title by rememberSaveable { mutableStateOf(initial.title) }
    var body by rememberSaveable { mutableStateOf(initial.body) }
    var color by rememberSaveable { mutableStateOf(initial.color) }
    var pinned by rememberSaveable { mutableStateOf(initial.pinned) }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Color(color.argb)) {
        Column(Modifier.padding(horizontal = 20.dp).padding(bottom = 32.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text(if (isNew) "New note" else "Edit note", style = MaterialTheme.typography.headlineLarge)
            OutlinedTextField(
                value = title, onValueChange = { title = it }, label = { Text("Title") },
                singleLine = true, modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = body, onValueChange = { body = it }, label = { Text("Write…") },
                minLines = 4, modifier = Modifier.fillMaxWidth(),
            )
            Eyebrow("Color")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                NoteColor.entries.forEach { c ->
                    Box(
                        Modifier
                            .size(32.dp)
                            .background(Color(c.argb), CircleShape)
                            .border(if (c == color) 3.dp else 1.dp, if (c == color) InkColors.Navy else InkColors.Navy.copy(alpha = 0.2f), CircleShape)
                            .clickable { color = c },
                    )
                }
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Pin to top", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                InkSwitch(pinned, { pinned = it })
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (!isNew) TextButton(onClick = { onDelete(initial) }) { Text("Delete", color = InkColors.Danger) }
                Spacer(Modifier.weight(1f))
                Button(
                    enabled = title.isNotBlank() || body.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = InkColors.Navy),
                    onClick = { onSave(initial.copy(title = title.trim(), body = body.trim(), color = color, pinned = pinned)) },
                ) { Text("Save") }
            }
        }
    }
}

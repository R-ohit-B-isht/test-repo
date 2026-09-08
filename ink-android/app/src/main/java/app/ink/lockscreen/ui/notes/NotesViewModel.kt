package app.ink.lockscreen.ui.notes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.Note
import app.ink.lockscreen.domain.model.NoteColor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDateTime

data class NotesState(
    val notes: List<Note> = emptyList(),
    val editing: Note? = null,
    val showEditor: Boolean = false,
) {
    val pinned: List<Note> get() = notes.filter { it.pinned }
    val others: List<Note> get() = notes.filter { !it.pinned }
}

class NotesViewModel(private val container: AppContainer) : ViewModel() {

    private val local = MutableStateFlow(NotesState())

    val state: StateFlow<NotesState> = combine(local, container.notes.observeAll()) { s, notes -> s.copy(notes = notes) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), NotesState())

    fun newNote() = local.update { it.copy(editing = null, showEditor = true) }
    fun edit(note: Note) = local.update { it.copy(editing = note, showEditor = true) }
    fun closeEditor() = local.update { it.copy(showEditor = false) }

    fun blank(): Note {
        val now = LocalDateTime.now()
        val nextColor = NoteColor.entries[local.value.notes.size % NoteColor.entries.size]
        return Note(title = "", body = "", color = nextColor, createdAt = now, updatedAt = now)
    }

    fun save(note: Note) {
        viewModelScope.launch {
            container.notes.save(note.copy(updatedAt = LocalDateTime.now()))
            closeEditor()
        }
    }

    fun togglePin(note: Note) {
        viewModelScope.launch { container.notes.save(note.copy(pinned = !note.pinned)) }
    }

    fun delete(note: Note) {
        viewModelScope.launch {
            container.notes.delete(note)
            closeEditor()
        }
    }
}

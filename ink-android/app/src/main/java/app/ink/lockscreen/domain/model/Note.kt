package app.ink.lockscreen.domain.model

import java.time.LocalDateTime

/** Sticky-note palette used by Ink's notes board. Index is persisted, not the ARGB value. */
enum class NoteColor(val argb: Int) {
    BUTTER(0xFFFFE9A8.toInt()),
    MINT(0xFFCDEFD8.toInt()),
    SKY(0xFFCFE3FF.toInt()),
    BLUSH(0xFFFFD6DB.toInt()),
    LILAC(0xFFE3D7FF.toInt()),
    PAPER(0xFFF4F1EA.toInt()),
}

data class Note(
    val id: Long = 0,
    val title: String,
    val body: String,
    val color: NoteColor = NoteColor.BUTTER,
    val pinned: Boolean = false,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)

package app.ink.lockscreen.ui.wallpaper

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.BlockPosition
import app.ink.lockscreen.domain.model.PresetBackground
import app.ink.lockscreen.domain.model.TodayMarker
import app.ink.lockscreen.domain.model.WallpaperConfig
import app.ink.lockscreen.domain.model.WallpaperLayout
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.theme.InkColors
import java.time.DayOfWeek

private typealias Edit = ((WallpaperConfig) -> WallpaperConfig) -> Unit

@Composable
fun BackgroundPanel(draft: WallpaperConfig, onEdit: Edit, onPickPhoto: () -> Unit, onClearPhoto: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Eyebrow("Your photo")
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onPickPhoto) { Text(if (draft.photoPath == null) "Choose photo" else "Change photo") }
            if (draft.photoPath != null) TextButton(onClick = onClearPhoto) { Text("Remove", color = InkColors.Muted) }
        }
        Eyebrow("Presets")
        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items(PresetBackground.entries) { preset ->
                val selected = draft.photoPath == null && draft.preset == preset
                Box(
                    Modifier
                        .size(56.dp)
                        .background(Brush.linearGradient(listOf(Color(preset.startArgb), Color(preset.endArgb))), CircleShape)
                        .border(if (selected) 3.dp else 1.dp, if (selected) InkColors.Navy else InkColors.Line, CircleShape)
                        .clickable { onEdit { it.copy(preset = preset, photoPath = null) } },
                )
            }
        }
        LabeledSlider("Dim", draft.dim, 0f..0.8f) { v -> onEdit { it.copy(dim = v) } }
        if (draft.photoPath != null) LabeledSlider("Blur", draft.blur, 0f..1f) { v -> onEdit { it.copy(blur = v) } }
    }
}

@Composable
fun CalendarPanel(draft: WallpaperConfig, onEdit: Edit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Eyebrow("Layout")
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            WallpaperLayout.entries.forEach { layout ->
                val selected = draft.layout == layout
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(if (selected) InkColors.Card else Color.Transparent, MaterialTheme.shapes.small)
                        .border(1.dp, if (selected) InkColors.Navy else InkColors.Line, MaterialTheme.shapes.small)
                        .clickable { onEdit { it.copy(layout = layout) } }
                        .height(56.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Spacer(Modifier.size(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text(layout.label, style = MaterialTheme.typography.bodyMedium)
                        Text(layout.description, style = MaterialTheme.typography.labelSmall, color = InkColors.Muted)
                    }
                }
            }
        }
        Eyebrow("Position")
        PillRow(BlockPosition.entries, draft.position, { it.label }) { p -> onEdit { it.copy(position = p) } }
        Eyebrow("Week starts on")
        PillRow(listOf(DayOfWeek.MONDAY, DayOfWeek.SUNDAY, DayOfWeek.SATURDAY), draft.weekStart, { it.name.take(3).lowercase().replaceFirstChar(Char::uppercase) }) { d -> onEdit { it.copy(weekStart = d) } }
        ToggleRow("Show events", draft.showEvents) { v -> onEdit { it.copy(showEvents = v) } }
        ToggleRow("Show tasks", draft.showTasks) { v -> onEdit { it.copy(showTasks = v) } }
    }
}

@Composable
fun StylePanel(draft: WallpaperConfig, onEdit: Edit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Eyebrow("Today marker")
        PillRow(TodayMarker.entries, draft.todayMarker, { it.label }) { m -> onEdit { it.copy(todayMarker = m) } }
        Eyebrow("Accent")
        ColorRow(ACCENTS, draft.accentArgb) { c -> onEdit { it.copy(accentArgb = c) } }
        Eyebrow("Text")
        ColorRow(TEXT_COLORS, draft.textArgb) { c -> onEdit { it.copy(textArgb = c) } }
    }
}

@Composable
private fun ColorRow(colors: List<Int>, selected: Int, onSelect: (Int) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        colors.forEach { argb ->
            Box(
                Modifier
                    .size(36.dp)
                    .background(Color(argb), CircleShape)
                    .border(if (argb == selected) 3.dp else 1.dp, if (argb == selected) InkColors.Navy else InkColors.Line, CircleShape)
                    .clickable { onSelect(argb) },
            )
        }
    }
}

@Composable
private fun LabeledSlider(label: String, value: Float, range: ClosedFloatingPointRange<Float>, onChange: (Float) -> Unit) {
    Column {
        Row { Eyebrow(label); Spacer(Modifier.weight(1f)); Text("${(value * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = InkColors.Muted) }
        Slider(
            value = value, onValueChange = onChange, valueRange = range,
            colors = SliderDefaults.colors(thumbColor = InkColors.Navy, activeTrackColor = InkColors.Navy, inactiveTrackColor = InkColors.Line),
        )
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
        InkSwitch(checked, onChange)
    }
}

private val ACCENTS = listOf(0xFFFFC857, 0xFFE07A5F, 0xFF7C9CFF, 0xFF2BB673, 0xFFB56576, 0xFFFFFFFF).map { it.toInt() }
private val TEXT_COLORS = listOf(0xFFFFFFFF, 0xFFF4F1EA, 0xFF1B2140, 0xFF2B2F5A).map { it.toInt() }

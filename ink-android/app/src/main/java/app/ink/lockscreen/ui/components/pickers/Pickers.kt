package app.ink.lockscreen.ui.components.pickers

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkCard
import app.ink.lockscreen.ui.theme.InkColors
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

/** Tappable field that opens a Material date picker; keeps the Ink card look. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateField(label: String, value: LocalDate, modifier: Modifier = Modifier, enabled: Boolean = true, onChange: (LocalDate) -> Unit) {
    var open by remember { mutableStateOf(false) }
    FieldCard(label, value.format(DateTimeFormatter.ofPattern("EEE, d MMM yyyy")), enabled, modifier) { open = true }
    if (open) {
        val state = rememberDatePickerState(initialSelectedDateMillis = value.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli())
        DatePickerDialog(
            onDismissRequest = { open = false },
            confirmButton = {
                TextButton(onClick = {
                    state.selectedDateMillis?.let { onChange(Instant.ofEpochMilli(it).atZone(ZoneOffset.UTC).toLocalDate()) }
                    open = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { open = false }) { Text("Cancel") } },
        ) { DatePicker(state = state) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimeField(label: String, value: LocalTime, use24Hour: Boolean, modifier: Modifier = Modifier, enabled: Boolean = true, onChange: (LocalTime) -> Unit) {
    var open by remember { mutableStateOf(false) }
    val fmt = DateTimeFormatter.ofPattern(if (use24Hour) "HH:mm" else "h:mm a")
    FieldCard(label, value.format(fmt), enabled, modifier) { open = true }
    if (open) {
        val state = rememberTimePickerState(initialHour = value.hour, initialMinute = value.minute, is24Hour = use24Hour)
        Dialog(onDismissRequest = { open = false }) {
            InkCard {
                TimePicker(state = state)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { open = false }) { Text("Cancel") }
                    TextButton(onClick = { onChange(LocalTime.of(state.hour, state.minute)); open = false }) { Text("OK") }
                }
            }
        }
    }
}

@Composable
private fun FieldCard(label: String, value: String, enabled: Boolean, modifier: Modifier, onClick: () -> Unit) {
    InkCard(modifier = modifier.fillMaxWidth(), onClick = if (enabled) onClick else null) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Eyebrow(label)
            Text(value, style = MaterialTheme.typography.bodyMedium, color = if (enabled) InkColors.Navy else InkColors.Muted)
        }
    }
}

val EVENT_COLORS: List<Int> = listOf(0xFF4C6FFF, 0xFFFF7A59, 0xFF2BB673, 0xFFB56576, 0xFFFFC857, 0xFF6B7088, 0xFF1B2140).map { it.toInt() }

@Composable
fun ColorPicker(selected: Int, onSelect: (Int) -> Unit, colors: List<Int> = EVENT_COLORS) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        colors.forEach { argb ->
            Box(
                Modifier
                    .size(32.dp)
                    .background(Color(argb), CircleShape)
                    .border(if (argb == selected) 3.dp else 0.dp, if (argb == selected) InkColors.Navy else Color.Transparent, CircleShape)
                    .clickable { onSelect(argb) }
                    .padding(2.dp),
            )
        }
    }
}

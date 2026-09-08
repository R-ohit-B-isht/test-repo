package app.ink.lockscreen.ui.calendar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.ReminderLead
import app.ink.lockscreen.domain.model.RepeatRule
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.components.pickers.DateField
import app.ink.lockscreen.ui.components.pickers.TimeField
import app.ink.lockscreen.ui.components.pickers.ColorPicker
import app.ink.lockscreen.ui.theme.InkColors
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventEditorSheet(
    initial: Event?,
    defaultDate: LocalDate,
    use24Hour: Boolean,
    onDismiss: () -> Unit,
    onSave: (Event) -> Unit,
    onDelete: (Event) -> Unit,
) {
    val readOnly = initial?.isReadOnly == true
    var title by rememberSaveable { mutableStateOf(initial?.title ?: "") }
    var date by rememberSaveable { mutableStateOf(initial?.date ?: defaultDate) }
    var start by rememberSaveable { mutableStateOf(initial?.start?.toLocalTime() ?: nextHour()) }
    var end by rememberSaveable { mutableStateOf(initial?.end?.toLocalTime() ?: nextHour().plusHours(1)) }
    var allDay by rememberSaveable { mutableStateOf(initial?.allDay ?: false) }
    var repeat by rememberSaveable { mutableStateOf(initial?.repeat ?: RepeatRule.NONE) }
    var reminder by rememberSaveable { mutableStateOf(initial?.reminder ?: ReminderLead.NONE) }
    var color by rememberSaveable { mutableStateOf(initial?.colorArgb ?: Event.DEFAULT_COLOR) }
    var notes by rememberSaveable { mutableStateOf(initial?.notes ?: "") }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = InkColors.Paper) {
        Column(
            Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                when {
                    readOnly -> "Synced event"
                    initial == null -> "New event"
                    else -> "Edit event"
                },
                style = MaterialTheme.typography.headlineLarge,
            )
            if (readOnly) {
                Text(
                    "This event comes from ${initial?.calendarName ?: "your device calendar"}. Edit it in that calendar app.",
                    style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted,
                )
            }
            OutlinedTextField(
                value = title, onValueChange = { title = it }, enabled = !readOnly,
                label = { Text("Title") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
            )
            DateField("Date", date, enabled = !readOnly) { date = it }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("All day", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                InkSwitch(allDay, { allDay = it }, enabled = !readOnly)
            }
            if (!allDay) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    TimeField("Starts", start, use24Hour, enabled = !readOnly, modifier = Modifier.weight(1f)) {
                        start = it; if (end <= it) end = it.plusHours(1)
                    }
                    TimeField("Ends", end, use24Hour, enabled = !readOnly, modifier = Modifier.weight(1f)) { end = it }
                }
            }
            if (!readOnly) {
                Eyebrow("Repeat")
                PillRow(RepeatRule.entries, repeat, { it.name.lowercase().replaceFirstChar(Char::uppercase) }) { repeat = it }
                Eyebrow("Reminder")
                PillRow(ReminderLead.entries, reminder, { it.label }) { reminder = it }
                Eyebrow("Color")
                ColorPicker(selected = color, onSelect = { color = it })
                OutlinedTextField(
                    value = notes, onValueChange = { notes = it }, label = { Text("Notes") },
                    minLines = 2, modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (initial != null) TextButton(onClick = { onDelete(initial) }) { Text("Delete", color = InkColors.Danger) }
                    Spacer(Modifier.weight(1f))
                    Button(
                        enabled = title.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = InkColors.Navy),
                        onClick = {
                            val s = if (allDay) date.atStartOfDay() else LocalDateTime.of(date, start)
                            val e = if (allDay) date.plusDays(1).atStartOfDay() else LocalDateTime.of(date, end)
                            onSave(
                                (initial ?: Event(title = "", start = s, end = s)).copy(
                                    title = title.trim(), start = s, end = e, allDay = allDay,
                                    repeat = repeat, reminder = reminder, colorArgb = color, notes = notes.trim(),
                                ),
                            )
                        },
                    ) { Text("Save") }
                }
            }
        }
    }
}

private fun nextHour(): LocalTime = LocalTime.now().plusHours(1).withMinute(0).withSecond(0).withNano(0)

private val ReminderLead.label: String
    get() = when (this) {
        ReminderLead.NONE -> "None"
        ReminderLead.AT_TIME -> "At time"
        ReminderLead.FIVE_MIN -> "5 min"
        ReminderLead.FIFTEEN_MIN -> "15 min"
        ReminderLead.THIRTY_MIN -> "30 min"
        ReminderLead.ONE_HOUR -> "1 hour"
        ReminderLead.ONE_DAY -> "1 day"
    }

package app.ink.lockscreen.ui.calendar

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.outlined.KeyboardArrowRight
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.ui.components.ColorDot
import app.ink.lockscreen.ui.components.EmptyState
import app.ink.lockscreen.ui.components.InkCard
import app.ink.lockscreen.ui.components.SectionHeader
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@Composable
fun CalendarScreen(container: AppContainer) {
    val vm = inkViewModel { CalendarViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission(), vm::onCalendarPermission)
    val timeFmt = DateTimeFormatter.ofPattern(if (state.settings.use24Hour) "HH:mm" else "h:mm a")

    Box(Modifier.fillMaxSize()) {
        LazyColumn(contentPadding = PaddingValues(bottom = 96.dp)) {
            item {
                Row(
                    Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        state.month.format(DateTimeFormatter.ofPattern("MMMM yyyy")),
                        style = MaterialTheme.typography.headlineLarge,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = vm::goToday) { Text("Today", color = InkColors.Muted) }
                    IconButton(onClick = { vm.shiftMonth(-1) }) { Icon(Icons.AutoMirrored.Outlined.KeyboardArrowLeft, "Previous month", tint = InkColors.Navy) }
                    IconButton(onClick = { vm.shiftMonth(1) }) { Icon(Icons.AutoMirrored.Outlined.KeyboardArrowRight, "Next month", tint = InkColors.Navy) }
                }
            }
            item {
                MonthGrid(
                    month = state.month,
                    selected = state.selected,
                    weekStart = state.weekStart,
                    eventsOn = state::eventsOn,
                    onSelect = vm::select,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                )
            }
            if (!state.hasCalendarPermission) {
                item {
                    InkCard(
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp).fillMaxWidth(),
                        onClick = { permission.launch(Manifest.permission.READ_CALENDAR) },
                    ) {
                        Text("Show your Google / device calendars", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Ink reads events already synced to this phone. Nothing leaves your device.",
                            style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted,
                        )
                    }
                }
            }
            item {
                Spacer(Modifier.height(8.dp))
                SectionHeader(state.selected.format(DateTimeFormatter.ofPattern("EEEE, d MMM")), count = state.selectedEvents.size)
                Spacer(Modifier.height(8.dp))
            }
            if (state.selectedEvents.isEmpty()) {
                item {
                    EmptyState(
                        icon = Icons.Outlined.CalendarMonth,
                        title = "Nothing planned",
                        message = "Tap + to add an event. It'll appear on your lock screen and widgets.",
                    )
                }
            }
            items(state.selectedEvents, key = { "${it.id}-${it.start}" }) { event ->
                EventRow(event, timeFmt, onClick = { vm.edit(event) }, modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp))
            }
        }
        FloatingActionButton(
            onClick = vm::newEvent,
            containerColor = InkColors.Navy,
            contentColor = InkColors.Card,
            modifier = Modifier.align(Alignment.BottomEnd).padding(20.dp),
        ) { Icon(Icons.Outlined.Add, contentDescription = "Add event") }
    }

    if (state.showEditor) {
        EventEditorSheet(
            initial = state.editing,
            defaultDate = state.selected,
            use24Hour = state.settings.use24Hour,
            onDismiss = vm::closeEditor,
            onSave = vm::save,
            onDelete = vm::delete,
        )
    }
}

@Composable
private fun EventRow(event: Event, timeFmt: DateTimeFormatter, onClick: () -> Unit, modifier: Modifier = Modifier) {
    InkCard(modifier = modifier.fillMaxWidth(), onClick = onClick, contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            ColorDot(event.colorArgb, size = 10)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(event.title, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
                Text(
                    buildString {
                        append(if (event.allDay) "All day" else "${event.start.format(timeFmt)} – ${event.end.format(timeFmt)}")
                        event.calendarName?.let { append("  ·  $it") }
                    },
                    style = MaterialTheme.typography.labelSmall,
                    color = InkColors.Muted,
                )
            }
            if (event.isReadOnly) Text("Synced", style = MaterialTheme.typography.labelSmall, color = InkColors.Muted)
        }
    }
}

@Suppress("unused")
private fun LocalDate.isSameMonth(other: LocalDate) = year == other.year && month == other.month

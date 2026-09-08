package app.ink.lockscreen.ui.settings

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.components.InkCard
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors

@Composable
fun SettingsScreen(container: AppContainer, onBack: () -> Unit) {
    val vm = inkViewModel { SettingsViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val calendarPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        vm.refreshPermissions(); vm.setSyncCalendar(granted)
    }
    val notifPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        vm.refreshPermissions(); if (granted) vm.setLiveSchedule(true)
    }
    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.consumeMessage() } }

    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = InkColors.Navy) }
            Text("Settings", style = MaterialTheme.typography.titleMedium)
        }
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Eyebrow("Calendars")
            InkCard {
                ToggleRow(
                    title = "Sync device calendars",
                    subtitle = if (state.hasCalendarPermission) "Google and other calendars on this phone (read-only)." else "Needs calendar permission.",
                    checked = state.settings.syncDeviceCalendar && state.hasCalendarPermission,
                ) { on ->
                    if (on && !state.hasCalendarPermission) calendarPermission.launch(Manifest.permission.READ_CALENDAR) else vm.setSyncCalendar(on)
                }
            }
            Eyebrow("Surfaces")
            InkCard {
                ToggleRow(
                    title = "Live schedule card",
                    subtitle = "Persistent, silent notification with your next events.",
                    checked = state.settings.liveScheduleEnabled,
                ) { on ->
                    if (on && !state.canPostNotifications && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        vm.setLiveSchedule(on)
                    }
                }
                Spacer(Modifier.height(8.dp))
                ToggleRow(title = "24-hour time", subtitle = "Used on the lock screen, widgets and in the app.", checked = state.settings.use24Hour, onChange = vm::setUse24Hour)
                Spacer(Modifier.height(12.dp))
                OutlinedButton(onClick = vm::refreshNow, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) {
                    Text(if (state.busy) "Refreshing…" else "Refresh everything now")
                }
            }
            if (state.devMode) {
                Eyebrow("Developer")
                InkCard {
                    Text("Debug build", style = MaterialTheme.typography.titleMedium)
                    Text("Loads a clearly-labelled sample week so every surface can be exercised. Not available in release builds.", style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted)
                    Spacer(Modifier.height(12.dp))
                    OutlinedButton(onClick = vm::loadSampleData, enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Load sample week") }
                }
            }
            Eyebrow("About")
            Text(
                "Ink for Android renders your calendar onto the lock screen on-device. Nothing is uploaded anywhere.",
                style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted,
            )
            Spacer(Modifier.height(24.dp))
        }
        SnackbarHost(snackbar)
    }
}

@Composable
private fun ToggleRow(title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium)
            Text(subtitle, style = MaterialTheme.typography.labelSmall, color = InkColors.Muted)
        }
        Spacer(Modifier.height(1.dp))
        InkSwitch(checked, onChange)
    }
}

package app.ink.lockscreen.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.dev.DevTools
import app.ink.lockscreen.domain.model.AppSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsState(
    val settings: AppSettings = AppSettings(),
    val hasCalendarPermission: Boolean = false,
    val canPostNotifications: Boolean = false,
    val devMode: Boolean = DevTools.isEnabled,
    val busy: Boolean = false,
    val message: String? = null,
)

class SettingsViewModel(private val container: AppContainer) : ViewModel() {

    private val local = MutableStateFlow(
        SettingsState(
            hasCalendarPermission = container.deviceCalendar.hasPermission(),
            canPostNotifications = container.notifications.canPost(),
        ),
    )

    val state: StateFlow<SettingsState> = combine(local, container.settings.settings) { s, settings -> s.copy(settings = settings) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), local.value)

    fun refreshPermissions() = local.update {
        it.copy(hasCalendarPermission = container.deviceCalendar.hasPermission(), canPostNotifications = container.notifications.canPost())
    }

    fun setSyncCalendar(enabled: Boolean) = updateSettings { it.copy(syncDeviceCalendar = enabled) }
    fun setLiveSchedule(enabled: Boolean) = updateSettings { it.copy(liveScheduleEnabled = enabled) }
    fun setUse24Hour(enabled: Boolean) = updateSettings { it.copy(use24Hour = enabled) }

    fun refreshNow() {
        viewModelScope.launch {
            local.update { it.copy(busy = true) }
            container.refreshSurfaces()
            local.update { it.copy(busy = false, message = "Lock screen, widgets and live card refreshed.") }
        }
    }

    fun loadSampleData() {
        if (!DevTools.isEnabled) return
        viewModelScope.launch {
            local.update { it.copy(busy = true) }
            DevTools.loadSampleWeek(container)
            container.refreshSurfaces()
            local.update { it.copy(busy = false, message = "Sample week loaded (dev build only).") }
        }
    }

    fun consumeMessage() = local.update { it.copy(message = null) }

    private fun updateSettings(transform: (AppSettings) -> AppSettings) {
        viewModelScope.launch {
            container.settings.update(transform)
            container.refreshSurfaces()
        }
    }
}

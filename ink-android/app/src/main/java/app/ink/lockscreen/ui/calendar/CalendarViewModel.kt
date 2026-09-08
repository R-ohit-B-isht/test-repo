package app.ink.lockscreen.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.AppSettings
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.domain.model.WallpaperConfig
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth

data class CalendarState(
    val month: YearMonth = YearMonth.now(),
    val selected: LocalDate = LocalDate.now(),
    val events: List<Event> = emptyList(),
    val weekStart: DayOfWeek = DayOfWeek.MONDAY,
    val settings: AppSettings = AppSettings(),
    val hasCalendarPermission: Boolean = false,
    val editing: Event? = null,
    val showEditor: Boolean = false,
) {
    fun eventsOn(date: LocalDate): List<Event> = events.filter { it.date == date }
    val selectedEvents: List<Event> get() = eventsOn(selected)
}

class CalendarViewModel(private val container: AppContainer) : ViewModel() {

    private val local = MutableStateFlow(CalendarState(hasCalendarPermission = container.deviceCalendar.hasPermission()))

    @OptIn(ExperimentalCoroutinesApi::class)
    private val monthEvents = local.flatMapLatest { s ->
        container.events.observeBetween(s.month.minusMonths(1).atDay(1).atStartOfDay(), s.month.plusMonths(2).atDay(1).atStartOfDay())
    }

    val state: StateFlow<CalendarState> = combine(local, monthEvents, container.wallpaperConfig.config, container.settings.settings) { s, events, cfg: WallpaperConfig, settings ->
        s.copy(events = events, weekStart = cfg.weekStart, settings = settings)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), local.value)

    fun shiftMonth(delta: Long) = local.update { it.copy(month = it.month.plusMonths(delta)) }
    fun goToday() = local.update { it.copy(month = YearMonth.now(), selected = LocalDate.now()) }
    fun select(date: LocalDate) = local.update { it.copy(selected = date, month = YearMonth.from(date)) }

    fun newEvent() = local.update { it.copy(editing = null, showEditor = true) }
    fun edit(event: Event) = local.update { it.copy(editing = event, showEditor = true) }
    fun closeEditor() = local.update { it.copy(showEditor = false) }

    fun save(event: Event) {
        viewModelScope.launch {
            val id = container.events.save(event)
            container.reminders.schedule(event.copy(id = id))
            closeEditor()
            container.refreshSurfaces()
        }
    }

    fun delete(event: Event) {
        viewModelScope.launch {
            container.reminders.cancel(event.id)
            container.events.delete(event)
            closeEditor()
            container.refreshSurfaces()
        }
    }

    /** Called after the READ_CALENDAR runtime prompt. */
    fun onCalendarPermission(granted: Boolean) {
        local.update { it.copy(hasCalendarPermission = granted) }
        viewModelScope.launch {
            container.settings.update { it.copy(syncDeviceCalendar = granted) }
            container.refreshSurfaces()
        }
    }
}

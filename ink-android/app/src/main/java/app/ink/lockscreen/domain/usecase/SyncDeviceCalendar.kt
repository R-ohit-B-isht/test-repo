package app.ink.lockscreen.domain.usecase

import app.ink.lockscreen.data.calendar.DeviceCalendarSource
import app.ink.lockscreen.data.prefs.AppSettingsStore
import app.ink.lockscreen.domain.repository.EventRepository
import java.time.LocalDate

/**
 * Mirrors device-calendar instances for a rolling window into Room so every surface
 * (screens, wallpaper, widgets, live card) reads from one place. Clears the mirror when
 * sync is off or permission was revoked.
 */
class SyncDeviceCalendar(
    private val source: DeviceCalendarSource,
    private val settings: AppSettingsStore,
    private val events: EventRepository,
) {
    suspend operator fun invoke(today: LocalDate = LocalDate.now()) {
        val enabled = settings.current().syncDeviceCalendar && source.hasPermission()
        if (!enabled) {
            events.replaceSystemMirror(emptyList())
            return
        }
        val mirrored = source.instancesBetween(today.minusMonths(1).withDayOfMonth(1), today.plusMonths(3))
        events.replaceSystemMirror(mirrored)
    }
}

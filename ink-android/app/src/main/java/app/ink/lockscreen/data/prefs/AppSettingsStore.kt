package app.ink.lockscreen.data.prefs

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import app.ink.lockscreen.domain.model.AppSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

class AppSettingsStore(private val store: DataStore<Preferences>) {

    val settings: Flow<AppSettings> = store.data.map { it.toSettings() }

    suspend fun current(): AppSettings = settings.first()

    suspend fun update(transform: (AppSettings) -> AppSettings) {
        store.edit { prefs ->
            val next = transform(prefs.toSettings())
            prefs[SettingsKeys.SYNC_DEVICE_CALENDAR] = next.syncDeviceCalendar
            prefs[SettingsKeys.LIVE_SCHEDULE] = next.liveScheduleEnabled
            prefs[SettingsKeys.USE_24H] = next.use24Hour
            prefs[SettingsKeys.ONBOARDING_DONE] = next.onboardingDone
        }
    }

    private fun Preferences.toSettings(): AppSettings {
        val d = AppSettings()
        return AppSettings(
            syncDeviceCalendar = this[SettingsKeys.SYNC_DEVICE_CALENDAR] ?: d.syncDeviceCalendar,
            liveScheduleEnabled = this[SettingsKeys.LIVE_SCHEDULE] ?: d.liveScheduleEnabled,
            use24Hour = this[SettingsKeys.USE_24H] ?: d.use24Hour,
            onboardingDone = this[SettingsKeys.ONBOARDING_DONE] ?: d.onboardingDone,
        )
    }
}

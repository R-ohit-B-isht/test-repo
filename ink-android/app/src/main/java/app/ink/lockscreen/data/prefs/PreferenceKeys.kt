package app.ink.lockscreen.data.prefs

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore

val Context.inkPrefs: DataStore<Preferences> by preferencesDataStore(name = "ink_prefs")

object WallpaperKeys {
    val LAYOUT = stringPreferencesKey("wp_layout")
    val PRESET = stringPreferencesKey("wp_preset")
    val PHOTO_PATH = stringPreferencesKey("wp_photo")
    val TEXT_ARGB = intPreferencesKey("wp_text")
    val ACCENT_ARGB = intPreferencesKey("wp_accent")
    val DIM = floatPreferencesKey("wp_dim")
    val BLUR = floatPreferencesKey("wp_blur")
    val WEEK_START = intPreferencesKey("wp_week_start")
    val TODAY_MARKER = stringPreferencesKey("wp_today_marker")
    val POSITION = stringPreferencesKey("wp_position")
    val SHOW_EVENTS = booleanPreferencesKey("wp_show_events")
    val SHOW_TASKS = booleanPreferencesKey("wp_show_tasks")
    val AUTO_REFRESH = booleanPreferencesKey("wp_auto_refresh")
}

object SettingsKeys {
    val SYNC_DEVICE_CALENDAR = booleanPreferencesKey("s_sync_calendar")
    val LIVE_SCHEDULE = booleanPreferencesKey("s_live_schedule")
    val USE_24H = booleanPreferencesKey("s_24h")
    val ONBOARDING_DONE = booleanPreferencesKey("s_onboarding")
}

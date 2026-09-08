package app.ink.lockscreen.data.prefs

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import app.ink.lockscreen.domain.model.WallpaperConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.time.DayOfWeek

class WallpaperConfigStore(private val store: DataStore<Preferences>) {

    val config: Flow<WallpaperConfig> = store.data.map { it.toConfig() }

    suspend fun current(): WallpaperConfig = config.first()

    suspend fun update(transform: (WallpaperConfig) -> WallpaperConfig) {
        store.edit { prefs ->
            val next = transform(prefs.toConfig())
            prefs[WallpaperKeys.LAYOUT] = next.layout.name
            prefs[WallpaperKeys.PRESET] = next.preset.name
            next.photoPath?.let { prefs[WallpaperKeys.PHOTO_PATH] = it } ?: prefs.remove(WallpaperKeys.PHOTO_PATH)
            prefs[WallpaperKeys.TEXT_ARGB] = next.textArgb
            prefs[WallpaperKeys.ACCENT_ARGB] = next.accentArgb
            prefs[WallpaperKeys.DIM] = next.dim
            prefs[WallpaperKeys.BLUR] = next.blur
            prefs[WallpaperKeys.WEEK_START] = next.weekStart.value
            prefs[WallpaperKeys.TODAY_MARKER] = next.todayMarker.name
            prefs[WallpaperKeys.POSITION] = next.position.name
            prefs[WallpaperKeys.SHOW_EVENTS] = next.showEvents
            prefs[WallpaperKeys.SHOW_TASKS] = next.showTasks
            prefs[WallpaperKeys.AUTO_REFRESH] = next.autoRefresh
        }
    }

    private fun Preferences.toConfig(): WallpaperConfig {
        val d = WallpaperConfig()
        return WallpaperConfig(
            layout = enumOr(this[WallpaperKeys.LAYOUT], d.layout),
            preset = enumOr(this[WallpaperKeys.PRESET], d.preset),
            photoPath = this[WallpaperKeys.PHOTO_PATH],
            textArgb = this[WallpaperKeys.TEXT_ARGB] ?: d.textArgb,
            accentArgb = this[WallpaperKeys.ACCENT_ARGB] ?: d.accentArgb,
            dim = this[WallpaperKeys.DIM] ?: d.dim,
            blur = this[WallpaperKeys.BLUR] ?: d.blur,
            weekStart = this[WallpaperKeys.WEEK_START]?.let { DayOfWeek.of(it) } ?: d.weekStart,
            todayMarker = enumOr(this[WallpaperKeys.TODAY_MARKER], d.todayMarker),
            position = enumOr(this[WallpaperKeys.POSITION], d.position),
            showEvents = this[WallpaperKeys.SHOW_EVENTS] ?: d.showEvents,
            showTasks = this[WallpaperKeys.SHOW_TASKS] ?: d.showTasks,
            autoRefresh = this[WallpaperKeys.AUTO_REFRESH] ?: d.autoRefresh,
        )
    }
}

internal inline fun <reified E : Enum<E>> enumOr(name: String?, default: E): E =
    enumValues<E>().firstOrNull { it.name == name } ?: default

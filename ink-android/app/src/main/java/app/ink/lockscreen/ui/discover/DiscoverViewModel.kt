package app.ink.lockscreen.ui.discover

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.AppSettings
import app.ink.lockscreen.domain.model.LockscreenDesign
import app.ink.lockscreen.domain.model.WallpaperConfig
import app.ink.lockscreen.domain.model.WallpaperLayout
import app.ink.lockscreen.wallpaper.LockScreenApplier
import app.ink.lockscreen.wallpaper.WallpaperComposer
import app.ink.lockscreen.widget.WidgetUpdater
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class DiscoverState(
    val config: WallpaperConfig = WallpaperConfig(),
    val settings: AppSettings = AppSettings(),
    val filter: WallpaperLayout? = null,
    /** Live-data thumbnails per design id; rendered lazily off the main thread. */
    val previews: Map<String, Bitmap> = emptyMap(),
    val message: String? = null,
    val applying: Boolean = false,
) {
    val designs: List<LockscreenDesign>
        get() = LockscreenDesign.catalog.filter { filter == null || it.layout == filter }
}

class DiscoverViewModel(private val container: AppContainer) : ViewModel() {

    private val composer = WallpaperComposer()
    private val local = MutableStateFlow(DiscoverState())

    val state: StateFlow<DiscoverState> = combine(local, container.wallpaperConfig.config, container.settings.settings) { s, cfg, settings ->
        s.copy(config = cfg, settings = settings)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), DiscoverState())

    init {
        renderPreviews()
    }

    fun setFilter(layout: WallpaperLayout?) = local.update { it.copy(filter = layout) }

    fun applyDesign(design: LockscreenDesign) {
        viewModelScope.launch {
            local.update { it.copy(applying = true) }
            container.wallpaperConfig.update { design.applyTo(it).copy(autoRefresh = true) }
            val result = container.lockScreen.apply()
            local.update {
                it.copy(
                    applying = false,
                    message = when (result) {
                        LockScreenApplier.Result.Applied -> "Lock screen updated — it refreshes itself every night."
                        is LockScreenApplier.Result.Failed -> result.reason
                    },
                )
            }
        }
    }

    fun setLiveSchedule(enabled: Boolean) {
        viewModelScope.launch {
            container.settings.update { it.copy(liveScheduleEnabled = enabled) }
            container.refreshSurfaces(includeLockScreen = false)
        }
    }

    fun pinWidget(kind: WidgetUpdater.Kind) {
        viewModelScope.launch {
            val ok = container.widgets.requestPin(kind)
            if (!ok) local.update { it.copy(message = "Your launcher doesn't support pinning — add it from the widget picker.") }
        }
    }

    fun consumeMessage() = local.update { it.copy(message = null) }

    /** Re-render thumbnails from current data (call when returning to the tab). */
    fun renderPreviews() {
        viewModelScope.launch {
            val snapshot = container.buildSnapshot()
            val use24h = container.settings.current().use24Hour
            val base = container.wallpaperConfig.current().copy(photoPath = null)
            val bitmaps = withContext(Dispatchers.Default) {
                LockscreenDesign.catalog.associate { design ->
                    design.id to composer.compose(PREVIEW_W, PREVIEW_H, design.applyTo(base), snapshot, use24h)
                }
            }
            local.update { it.copy(previews = bitmaps) }
        }
    }

    private companion object {
        const val PREVIEW_W = 360
        const val PREVIEW_H = 780
    }
}

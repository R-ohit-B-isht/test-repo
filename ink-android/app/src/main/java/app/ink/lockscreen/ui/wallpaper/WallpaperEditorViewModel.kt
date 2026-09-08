package app.ink.lockscreen.ui.wallpaper

import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.WallpaperConfig
import app.ink.lockscreen.wallpaper.LockScreenApplier
import app.ink.lockscreen.wallpaper.WallpaperComposer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

enum class EditorTab(val label: String) { BACKGROUND("Background"), CALENDAR("Calendar"), STYLE("Style") }

data class EditorState(
    val draft: WallpaperConfig = WallpaperConfig(),
    val tab: EditorTab = EditorTab.BACKGROUND,
    val preview: Bitmap? = null,
    val loaded: Boolean = false,
    val applying: Boolean = false,
    val message: String? = null,
)

/** Edits a draft [WallpaperConfig]; nothing is persisted until [setAsCurrent]. */
class WallpaperEditorViewModel(private val container: AppContainer) : ViewModel() {

    private val composer = WallpaperComposer()
    private val _state = MutableStateFlow(EditorState())
    val state: StateFlow<EditorState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            _state.update { it.copy(draft = container.wallpaperConfig.current(), loaded = true) }
            observeDraftForPreview()
        }
    }

    @OptIn(FlowPreview::class)
    private fun observeDraftForPreview() {
        viewModelScope.launch {
            _state.map { it.draft }.distinctUntilChanged().debounce(120).collect { draft ->
                val snapshot = container.buildSnapshot()
                val use24h = container.settings.current().use24Hour
                val bmp = withContext(Dispatchers.Default) { composer.compose(PREVIEW_W, PREVIEW_H, draft, snapshot, use24h) }
                _state.update { it.copy(preview = bmp) }
            }
        }
    }

    fun selectTab(tab: EditorTab) = _state.update { it.copy(tab = tab) }

    fun edit(transform: (WallpaperConfig) -> WallpaperConfig) = _state.update { it.copy(draft = transform(it.draft)) }

    fun pickPhoto(uri: Uri) {
        viewModelScope.launch {
            val file = container.photos.import(uri)
            if (file == null) {
                _state.update { it.copy(message = "Couldn't read that photo.") }
            } else {
                edit { it.copy(photoPath = file.absolutePath) }
            }
        }
    }

    fun clearPhoto() {
        viewModelScope.launch {
            container.photos.clear()
            edit { it.copy(photoPath = null) }
        }
    }

    fun setAsCurrent() {
        viewModelScope.launch {
            _state.update { it.copy(applying = true) }
            container.wallpaperConfig.update { _state.value.draft.copy(autoRefresh = true) }
            val result = container.lockScreen.apply()
            _state.update {
                it.copy(
                    applying = false,
                    draft = it.draft.copy(autoRefresh = true),
                    message = when (result) {
                        LockScreenApplier.Result.Applied -> "Set as your lock screen. Ink keeps it fresh every night."
                        is LockScreenApplier.Result.Failed -> result.reason
                    },
                )
            }
        }
    }

    fun consumeMessage() = _state.update { it.copy(message = null) }

    private companion object {
        const val PREVIEW_W = 540
        const val PREVIEW_H = 1170
    }
}

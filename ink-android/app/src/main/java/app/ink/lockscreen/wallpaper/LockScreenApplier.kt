package app.ink.lockscreen.wallpaper

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.util.DisplayMetrics
import android.view.WindowManager
import app.ink.lockscreen.data.prefs.AppSettingsStore
import app.ink.lockscreen.data.prefs.WallpaperConfigStore
import app.ink.lockscreen.domain.usecase.BuildScheduleSnapshot
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException

/** Renders the current config against live data and pushes it to the lock screen. */
class LockScreenApplier(
    private val context: Context,
    private val composer: WallpaperComposer,
    private val configStore: WallpaperConfigStore,
    private val settingsStore: AppSettingsStore,
    private val buildSnapshot: BuildScheduleSnapshot,
) {
    sealed interface Result {
        data object Applied : Result
        data class Failed(val reason: String) : Result
    }

    suspend fun render(): Bitmap = withContext(Dispatchers.Default) {
        val (w, h) = screenSize()
        composer.compose(w, h, configStore.current(), buildSnapshot(), settingsStore.current().use24Hour)
    }

    suspend fun apply(): Result = withContext(Dispatchers.IO) {
        val bitmap = render()
        try {
            WallpaperManager.getInstance(context).setBitmap(bitmap, null, true, WallpaperManager.FLAG_LOCK)
            Result.Applied
        } catch (e: IOException) {
            Result.Failed(e.message ?: "Could not write wallpaper")
        } catch (e: SecurityException) {
            Result.Failed("Wallpaper permission denied")
        } finally {
            bitmap.recycle()
        }
    }

    private fun screenSize(): Pair<Int, Int> {
        val wm = context.getSystemService(WindowManager::class.java)
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        wm.defaultDisplay.getRealMetrics(metrics)
        val w = minOf(metrics.widthPixels, metrics.heightPixels)
        val h = maxOf(metrics.widthPixels, metrics.heightPixels)
        return w to h
    }
}

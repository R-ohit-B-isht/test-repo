package app.ink.lockscreen

import android.app.Application
import androidx.work.Configuration
import app.ink.lockscreen.wallpaper.WallpaperRefreshWorker

class InkApplication : Application(), Configuration.Provider {

    val container: AppContainer by lazy { AppContainer(this) }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder().setMinimumLoggingLevel(android.util.Log.INFO).build()

    override fun onCreate() {
        super.onCreate()
        WallpaperRefreshWorker.schedule(this)
    }
}

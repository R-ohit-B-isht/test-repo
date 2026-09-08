package app.ink.lockscreen.system

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import app.ink.lockscreen.wallpaper.WallpaperRefreshWorker

/** Re-arms periodic work after reboot / date or timezone changes so the lock screen never goes stale. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_DATE_CHANGED -> {
                WallpaperRefreshWorker.schedule(context)
                WallpaperRefreshWorker.runNow(context)
            }
        }
    }
}

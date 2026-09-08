package app.ink.lockscreen.wallpaper

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import app.ink.lockscreen.InkApplication
import java.time.Duration
import java.time.LocalDateTime
import java.time.LocalTime

/**
 * Keeps every glanceable surface current: re-syncs the device calendar, redraws the lock
 * screen (if the user set one), refreshes widgets and the live card. Runs shortly after
 * midnight and on a 6h heartbeat so a missed alarm never leaves yesterday's date on screen.
 */
class WallpaperRefreshWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val container = (applicationContext as InkApplication).container
        container.refreshSurfaces()
        scheduleNextMidnight(applicationContext)
        return Result.success()
    }

    companion object {
        private const val MIDNIGHT_WORK = "ink-refresh-midnight"
        private const val HEARTBEAT_WORK = "ink-refresh-heartbeat"

        fun schedule(context: Context) {
            scheduleNextMidnight(context)
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                HEARTBEAT_WORK,
                ExistingPeriodicWorkPolicy.KEEP,
                PeriodicWorkRequestBuilder<WallpaperRefreshWorker>(Duration.ofHours(6)).build(),
            )
        }

        fun runNow(context: Context) {
            WorkManager.getInstance(context).enqueueUniqueWork(
                "ink-refresh-now", ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<WallpaperRefreshWorker>().build(),
            )
        }

        private fun scheduleNextMidnight(context: Context) {
            val now = LocalDateTime.now()
            val next = now.toLocalDate().plusDays(1).atTime(LocalTime.of(0, 2))
            WorkManager.getInstance(context).enqueueUniqueWork(
                MIDNIGHT_WORK, ExistingWorkPolicy.REPLACE,
                OneTimeWorkRequestBuilder<WallpaperRefreshWorker>()
                    .setInitialDelay(Duration.between(now, next))
                    .build(),
            )
        }
    }
}

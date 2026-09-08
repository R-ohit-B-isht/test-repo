package app.ink.lockscreen.reminders

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.os.Build
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.text.format.DateUtils
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import app.ink.lockscreen.MainActivity
import app.ink.lockscreen.R
import app.ink.lockscreen.domain.usecase.ScheduleSnapshot
import java.time.format.DateTimeFormatter

/** Single owner of notification channels: event reminders + the persistent "live schedule" card. */
class InkNotifications(private val context: Context) {

    init {
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_REMINDERS, context.getString(R.string.notification_channel_reminders), NotificationManager.IMPORTANCE_HIGH),
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_LIVE, context.getString(R.string.notification_channel_live), NotificationManager.IMPORTANCE_LOW).apply {
                description = context.getString(R.string.notification_channel_live_description)
                setShowBadge(false)
            },
        )
    }

    fun canPost(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    /** Permission is checked in [canPost]; the try/catch covers a revoke racing the post. */
    @SuppressLint("MissingPermission")
    private fun post(id: Int, notification: android.app.Notification) {
        if (!canPost()) return
        try {
            NotificationManagerCompat.from(context).notify(id, notification)
        } catch (_: SecurityException) {
        }
    }

    fun showReminder(eventId: Long, title: String, startMillis: Long, allDay: Boolean) {
        val whenText = if (allDay) "Today, all day" else DateUtils.formatDateTime(context, startMillis, DateUtils.FORMAT_SHOW_TIME)
        val n = NotificationCompat.Builder(context, CHANNEL_REMINDERS)
            .setSmallIcon(R.drawable.ic_stat_ink)
            .setContentTitle(title)
            .setContentText(whenText)
            .setContentIntent(openApp())
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .build()
        post(REMINDER_ID_BASE + (eventId % 10_000).toInt(), n)
    }

    /** Android stand-in for iOS Live Activities: an ongoing, silent card with what's next. */
    fun showLiveSchedule(snapshot: ScheduleSnapshot, use24Hour: Boolean) {
        val fmt = DateTimeFormatter.ofPattern(if (use24Hour) "HH:mm" else "h:mm a")
        val next = snapshot.nextEvent
        val title = next?.let { "Next: ${it.title}" } ?: "No more events today"
        val upcoming = snapshot.events.filter { it.end > snapshot.now }.take(4)
        val style = NotificationCompat.InboxStyle().also { s ->
            upcoming.forEach { e -> s.addLine("${if (e.allDay) "All day" else e.start.format(fmt)}  ${e.title}") }
            if (snapshot.openTasks.isNotEmpty()) s.setSummaryText("${snapshot.openTasks.size} open tasks")
        }
        val n = NotificationCompat.Builder(context, CHANNEL_LIVE)
            .setSmallIcon(R.drawable.ic_stat_ink)
            .setContentTitle(title)
            .setContentText(next?.let { if (it.allDay) "All day" else it.start.format(fmt) } ?: "${snapshot.openTasks.size} open tasks")
            .setStyle(style)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setContentIntent(openApp())
            .build()
        post(LIVE_ID, n)
    }

    fun hideLiveSchedule() = NotificationManagerCompat.from(context).cancel(LIVE_ID)

    private fun openApp(): PendingIntent = PendingIntent.getActivity(
        context, 0, Intent(context, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    private companion object {
        const val CHANNEL_REMINDERS = "reminders"
        const val CHANNEL_LIVE = "live_schedule"
        const val REMINDER_ID_BASE = 10_000
        const val LIVE_ID = 1
    }
}

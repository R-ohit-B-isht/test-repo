package app.ink.lockscreen

import android.content.Context
import app.ink.lockscreen.data.calendar.DeviceCalendarSource
import app.ink.lockscreen.data.local.InkDatabase
import app.ink.lockscreen.data.prefs.AppSettingsStore
import app.ink.lockscreen.data.prefs.WallpaperConfigStore
import app.ink.lockscreen.data.prefs.inkPrefs
import app.ink.lockscreen.data.repository.RoomEventRepository
import app.ink.lockscreen.data.repository.RoomNoteRepository
import app.ink.lockscreen.data.repository.RoomTaskRepository
import app.ink.lockscreen.domain.repository.EventRepository
import app.ink.lockscreen.domain.repository.NoteRepository
import app.ink.lockscreen.domain.repository.TaskRepository
import app.ink.lockscreen.domain.usecase.BuildScheduleSnapshot
import app.ink.lockscreen.domain.usecase.SyncDeviceCalendar
import app.ink.lockscreen.reminders.InkNotifications
import app.ink.lockscreen.reminders.ReminderScheduler
import app.ink.lockscreen.wallpaper.LockScreenApplier
import app.ink.lockscreen.wallpaper.PhotoStore
import app.ink.lockscreen.wallpaper.WallpaperComposer
import app.ink.lockscreen.widget.WidgetUpdater

/** Manual dependency graph (single composition root; no DI framework needed at this size). */
class AppContainer(private val context: Context) {

    private val db: InkDatabase by lazy { InkDatabase.build(context) }

    val events: EventRepository by lazy { RoomEventRepository(db.eventDao()) }
    val tasks: TaskRepository by lazy { RoomTaskRepository(db.taskDao()) }
    val notes: NoteRepository by lazy { RoomNoteRepository(db.noteDao()) }

    val wallpaperConfig by lazy { WallpaperConfigStore(context.inkPrefs) }
    val settings by lazy { AppSettingsStore(context.inkPrefs) }

    val deviceCalendar by lazy { DeviceCalendarSource(context) }
    val syncDeviceCalendar by lazy { SyncDeviceCalendar(deviceCalendar, settings, events) }
    val buildSnapshot by lazy { BuildScheduleSnapshot(events, tasks) }

    val notifications by lazy { InkNotifications(context) }
    val reminders by lazy { ReminderScheduler(context, events) }
    val widgets by lazy { WidgetUpdater(context) }
    val photos by lazy { PhotoStore(context) }
    val lockScreen by lazy { LockScreenApplier(context, WallpaperComposer(), wallpaperConfig, settings, buildSnapshot) }

    /** One entry point used by the worker, receivers, and after every user edit. */
    suspend fun refreshSurfaces(includeLockScreen: Boolean = true) {
        syncDeviceCalendar()
        val snapshot = buildSnapshot()
        val prefs = settings.current()
        if (prefs.liveScheduleEnabled) notifications.showLiveSchedule(snapshot, prefs.use24Hour) else notifications.hideLiveSchedule()
        widgets.updateAll()
        reminders.rescheduleAll()
        if (includeLockScreen && wallpaperConfig.current().autoRefresh) lockScreen.apply()
    }
}

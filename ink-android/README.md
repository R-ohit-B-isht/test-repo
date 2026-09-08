# Ink for Android

Android counterpart of *Ink: Lockscreen Calendar, Note* (iOS). Your month grid, weekly
timetable, agenda or to-do list is rendered on-device onto the lock-screen wallpaper and
refreshed automatically — no Shortcuts automation needed.

## What's inside

| iOS Ink | Android implementation |
|---|---|
| Lock-screen wallpaper designs | `WallpaperManager.setBitmap(FLAG_LOCK)`; renderers in `wallpaper/render` |
| Daily Shortcut refresh | `WallpaperRefreshWorker` (WorkManager, nightly + on change) |
| Live Activities | Persistent silent notification (`InkNotifications.showLiveSchedule`) |
| Home-screen widgets | Glance widgets: Calendar, Tasks, Next event |
| Google / Apple Calendar sync | Read-only mirror of the device calendar (`CalendarContract`) |
| Events, tasks (Eisenhower matrix), notes | Room; tasks are soft-deleted (`deletedAt`) |
| Reminders | `AlarmManager` + notification channel |

## Build

Requires JDK 17 and an Android SDK with platform 35 / build-tools 35.0.0.

```bash
export ANDROID_HOME=~/android-sdk
./gradlew :app:assembleDebug :app:lintDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Debug builds enable `BuildConfig.DEV_MODE` (override with `INK_DEV_MODE=false`), which adds
a **Load sample week** action under Settings → Developer. Release builds never ship sample data.

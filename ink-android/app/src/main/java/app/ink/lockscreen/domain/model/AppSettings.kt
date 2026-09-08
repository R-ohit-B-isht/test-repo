package app.ink.lockscreen.domain.model

data class AppSettings(
    /** Mirror events from the device calendar provider (Google/Exchange accounts synced to the phone). */
    val syncDeviceCalendar: Boolean = false,
    /** Persistent notification with the next events — Android stand-in for iOS Live Activities. */
    val liveScheduleEnabled: Boolean = false,
    val use24Hour: Boolean = false,
    val onboardingDone: Boolean = false,
)

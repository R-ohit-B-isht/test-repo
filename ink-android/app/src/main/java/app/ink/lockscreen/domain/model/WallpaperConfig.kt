package app.ink.lockscreen.domain.model

import java.time.DayOfWeek

/** Lock-screen layouts offered under Discover → Lockscreen (Ink's Timeline / Timetable / Today filters). */
enum class WallpaperLayout(val label: String, val description: String) {
    MONTH("Month", "Full month grid with today marked"),
    TIMELINE("Timeline", "Next days as a vertical agenda"),
    TIMETABLE("Timetable", "This week, hour by hour"),
    TODAY("Today", "Today's events and open tasks"),
    TASKS("To-do", "Your open tasks as a checklist"),
}

enum class TodayMarker(val label: String) { DOT("Dot"), RING("Ring"), SQUARE("Square") }

/** Where the calendar block sits on the lock screen; kept clear of the clock (top) and shortcuts (bottom). */
enum class BlockPosition(val label: String) { UPPER("Upper"), MIDDLE("Middle"), LOWER("Lower") }

/** Built-in gradient backgrounds used when the user has not picked a photo. */
enum class PresetBackground(val label: String, val startArgb: Int, val endArgb: Int) {
    MIDNIGHT("Midnight", 0xFF141A33.toInt(), 0xFF2B2F5A.toInt()),
    INK("Ink", 0xFF1B2140.toInt(), 0xFF0C0F1F.toInt()),
    DUSK("Dusk", 0xFF3B2C5A.toInt(), 0xFFB56576.toInt()),
    FOREST("Forest", 0xFF13312B.toInt(), 0xFF2F6B5A.toInt()),
    SAND("Sand", 0xFFE8DCC8.toInt(), 0xFFC9B79C.toInt()),
    CLOUD("Cloud", 0xFFF3F1EC.toInt(), 0xFFD9D6CE.toInt()),
}

data class WallpaperConfig(
    val layout: WallpaperLayout = WallpaperLayout.MONTH,
    val preset: PresetBackground = PresetBackground.MIDNIGHT,
    /** Absolute path (inside app storage) of the user's photo, if any. Wins over [preset]. */
    val photoPath: String? = null,
    val textArgb: Int = 0xFFFFFFFF.toInt(),
    val accentArgb: Int = 0xFFFFC857.toInt(),
    /** 0f..0.8f darkening overlay on the background so text stays readable. */
    val dim: Float = 0.25f,
    /** 0f..1f — blur strength on the photo background. */
    val blur: Float = 0f,
    val weekStart: DayOfWeek = DayOfWeek.MONDAY,
    val todayMarker: TodayMarker = TodayMarker.RING,
    val position: BlockPosition = BlockPosition.LOWER,
    val showEvents: Boolean = true,
    val showTasks: Boolean = true,
    /** Whether the daily WorkManager refresh is armed (set after the first "Set as current"). */
    val autoRefresh: Boolean = false,
)

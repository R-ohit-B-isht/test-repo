package app.ink.lockscreen.domain.model

/** A curated template (layout + palette) shown in Discover; applying one seeds [WallpaperConfig]. */
data class LockscreenDesign(
    val id: String,
    val name: String,
    val layout: WallpaperLayout,
    val preset: PresetBackground,
    val accentArgb: Int,
    val textArgb: Int = 0xFFFFFFFF.toInt(),
    val todayMarker: TodayMarker = TodayMarker.RING,
) {
    fun applyTo(config: WallpaperConfig): WallpaperConfig = config.copy(
        layout = layout,
        preset = preset,
        accentArgb = accentArgb,
        textArgb = textArgb,
        todayMarker = todayMarker,
    )

    companion object {
        private const val WHITE = 0xFFFFFFFF.toInt()
        private const val NAVY = 0xFF1B2140.toInt()

        val catalog: List<LockscreenDesign> = listOf(
            LockscreenDesign("month-midnight", "Midnight month", WallpaperLayout.MONTH, PresetBackground.MIDNIGHT, 0xFFFFC857.toInt()),
            LockscreenDesign("month-sand", "Paper month", WallpaperLayout.MONTH, PresetBackground.SAND, 0xFFE07A5F.toInt(), NAVY, TodayMarker.DOT),
            LockscreenDesign("month-forest", "Forest month", WallpaperLayout.MONTH, PresetBackground.FOREST, 0xFFB7E4C7.toInt(), WHITE, TodayMarker.SQUARE),
            LockscreenDesign("timeline-ink", "Ink timeline", WallpaperLayout.TIMELINE, PresetBackground.INK, 0xFF7C9CFF.toInt()),
            LockscreenDesign("timeline-dusk", "Dusk timeline", WallpaperLayout.TIMELINE, PresetBackground.DUSK, 0xFFFFD6A5.toInt()),
            LockscreenDesign("timetable-midnight", "Week timetable", WallpaperLayout.TIMETABLE, PresetBackground.MIDNIGHT, 0xFFFFC857.toInt()),
            LockscreenDesign("timetable-cloud", "Cloud timetable", WallpaperLayout.TIMETABLE, PresetBackground.CLOUD, 0xFF4C6FFF.toInt(), NAVY),
            LockscreenDesign("today-ink", "Today focus", WallpaperLayout.TODAY, PresetBackground.INK, 0xFFFFC857.toInt()),
            LockscreenDesign("today-sand", "Today on paper", WallpaperLayout.TODAY, PresetBackground.SAND, 0xFFE07A5F.toInt(), NAVY),
            LockscreenDesign("tasks-forest", "To-do list", WallpaperLayout.TASKS, PresetBackground.FOREST, 0xFFFFC857.toInt()),
            LockscreenDesign("tasks-cloud", "To-do on cloud", WallpaperLayout.TASKS, PresetBackground.CLOUD, 0xFF4C6FFF.toInt(), NAVY),
        )
    }
}

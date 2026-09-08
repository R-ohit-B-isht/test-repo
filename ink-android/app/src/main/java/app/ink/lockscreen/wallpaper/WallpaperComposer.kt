package app.ink.lockscreen.wallpaper

import android.graphics.Bitmap
import android.graphics.Canvas
import app.ink.lockscreen.domain.model.WallpaperConfig
import app.ink.lockscreen.domain.model.WallpaperLayout
import app.ink.lockscreen.domain.usecase.ScheduleSnapshot
import app.ink.lockscreen.wallpaper.render.BackgroundPainter
import app.ink.lockscreen.wallpaper.render.LayoutRenderer
import app.ink.lockscreen.wallpaper.render.MonthRenderer
import app.ink.lockscreen.wallpaper.render.RenderContext
import app.ink.lockscreen.wallpaper.render.TasksRenderer
import app.ink.lockscreen.wallpaper.render.TimelineRenderer
import app.ink.lockscreen.wallpaper.render.TimetableRenderer
import app.ink.lockscreen.wallpaper.render.TodayRenderer

/** Facade: background + the layout strategy for [WallpaperConfig.layout] → one bitmap. */
class WallpaperComposer {

    fun rendererFor(layout: WallpaperLayout): LayoutRenderer = when (layout) {
        WallpaperLayout.MONTH -> MonthRenderer()
        WallpaperLayout.TIMELINE -> TimelineRenderer()
        WallpaperLayout.TIMETABLE -> TimetableRenderer()
        WallpaperLayout.TODAY -> TodayRenderer()
        WallpaperLayout.TASKS -> TasksRenderer()
    }

    fun compose(
        width: Int,
        height: Int,
        config: WallpaperConfig,
        snapshot: ScheduleSnapshot,
        use24Hour: Boolean,
    ): Bitmap {
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        BackgroundPainter.paint(canvas, width, height, config)
        rendererFor(config.layout).draw(RenderContext(canvas, width, height, config, snapshot, use24Hour))
        return bitmap
    }
}

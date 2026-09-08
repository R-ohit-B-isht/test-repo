package app.ink.lockscreen.wallpaper.render

import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import app.ink.lockscreen.domain.model.BlockPosition
import app.ink.lockscreen.domain.model.WallpaperConfig
import app.ink.lockscreen.domain.usecase.ScheduleSnapshot
import java.time.format.DateTimeFormatter

/** Shared drawing state handed to every [LayoutRenderer]. */
class RenderContext(
    val canvas: Canvas,
    val width: Int,
    val height: Int,
    val config: WallpaperConfig,
    val snapshot: ScheduleSnapshot,
    val use24Hour: Boolean,
) {
    val density: Float = width / 411f
    fun dp(v: Float): Float = v * density
    fun sp(v: Float): Float = v * density

    val timeFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern(if (use24Hour) "HH:mm" else "h:mm a")

    /**
     * Safe area for the calendar block. Keeps ~30% clear at the top for the system clock
     * (Android's large clock reaches ~2/3 down when there are no notifications, so LOWER is
     * the default) and ~6% at the bottom for lock-screen shortcuts / the fingerprint hint.
     */
    val block: RectF by lazy {
        val margin = dp(24f)
        val top = height * 0.30f
        val bottom = height * 0.94f
        val avail = bottom - top
        val blockH = avail * 0.47f
        val y = when (config.position) {
            BlockPosition.UPPER -> top
            BlockPosition.MIDDLE -> top + (avail - blockH) / 2f
            BlockPosition.LOWER -> bottom - blockH
        }
        RectF(margin, y, width - margin, y + blockH)
    }

    fun textPaint(size: Float, bold: Boolean = false, alpha: Int = 255, color: Int = config.textArgb) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        this.alpha = alpha
        textSize = sp(size)
        typeface = Typeface.create(Typeface.SANS_SERIF, if (bold) Typeface.BOLD else Typeface.NORMAL)
        setShadowLayer(dp(2f), 0f, dp(1f), 0x55000000)
    }

    fun fillPaint(color: Int, alpha: Int = 255) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        this.alpha = alpha
        style = Paint.Style.FILL
    }

    fun strokePaint(color: Int, widthDp: Float, alpha: Int = 255) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        this.alpha = alpha
        style = Paint.Style.STROKE
        strokeWidth = dp(widthDp)
    }

    fun ellipsize(text: String, paint: Paint, maxWidth: Float): String {
        if (paint.measureText(text) <= maxWidth) return text
        var end = text.length
        while (end > 1 && paint.measureText(text.substring(0, end) + "…") > maxWidth) end--
        return text.substring(0, end).trimEnd() + "…"
    }
}

/** Strategy: one implementation per [app.ink.lockscreen.domain.model.WallpaperLayout]. */
interface LayoutRenderer {
    fun draw(ctx: RenderContext)
}

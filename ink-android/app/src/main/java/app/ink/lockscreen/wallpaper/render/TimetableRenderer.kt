package app.ink.lockscreen.wallpaper.render

import android.graphics.Paint
import android.graphics.RectF
import java.time.format.TextStyle
import java.util.Locale

/** "Timetable" template: this week, hour rows × weekday columns, events as colored blocks. */
class TimetableRenderer : LayoutRenderer {

    private val startHour = 7
    private val endHour = 21

    override fun draw(ctx: RenderContext) {
        val b = ctx.block
        val today = ctx.snapshot.today
        val weekStart = today.minusDays(((today.dayOfWeek.value - ctx.config.weekStart.value) + 7L) % 7)
        val gutter = ctx.dp(34f)
        val headerH = ctx.dp(34f)
        val colW = (b.width() - gutter) / 7f
        val rowH = (b.height() - headerH) / (endHour - startHour)
        val gridTop = b.top + headerH

        val hourPaint = ctx.textPaint(9f, alpha = 150).apply { textAlign = Paint.Align.RIGHT }
        val line = ctx.strokePaint(ctx.config.textArgb, 0.5f, alpha = 50)
        for (h in startHour..endHour) {
            val y = gridTop + (h - startHour) * rowH
            ctx.canvas.drawLine(b.left + gutter, y, b.right, y, line)
            if (h % 3 == 0) ctx.canvas.drawText(hourLabel(ctx, h), b.left + gutter - ctx.dp(6f), y + ctx.sp(3f), hourPaint)
        }

        val dowPaint = ctx.textPaint(10f, alpha = 170).apply { textAlign = Paint.Align.CENTER }
        val numPaint = ctx.textPaint(14f, bold = true).apply { textAlign = Paint.Align.CENTER }
        val titlePaint = ctx.textPaint(8.5f, bold = true, color = 0xFFFFFFFF.toInt())
        for (i in 0 until 7) {
            val date = weekStart.plusDays(i.toLong())
            val cx = b.left + gutter + colW * i + colW / 2f
            if (date == today) {
                ctx.canvas.drawRoundRect(
                    RectF(cx - colW / 2f + ctx.dp(2f), b.top, cx + colW / 2f - ctx.dp(2f), b.bottom),
                    ctx.dp(10f), ctx.dp(10f), ctx.fillPaint(ctx.config.accentArgb, 40),
                )
                ctx.canvas.drawCircle(cx, b.top + ctx.dp(20f), ctx.dp(11f), ctx.fillPaint(ctx.config.accentArgb))
            }
            ctx.canvas.drawText(date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(1), cx, b.top + ctx.sp(9f), dowPaint)
            ctx.canvas.drawText(date.dayOfMonth.toString(), cx, b.top + ctx.dp(20f) + ctx.sp(5f), numPaint)

            ctx.snapshot.eventsOn(date).filter { !it.allDay }.forEach { e ->
                val sh = e.start.hour + e.start.minute / 60f
                val eh = (e.end.hour + e.end.minute / 60f).coerceAtLeast(sh + 0.5f)
                if (eh <= startHour || sh >= endHour) return@forEach
                val top = gridTop + (sh.coerceAtLeast(startHour.toFloat()) - startHour) * rowH
                val bottom = gridTop + (eh.coerceAtMost(endHour.toFloat()) - startHour) * rowH
                val rect = RectF(cx - colW / 2f + ctx.dp(3f), top + ctx.dp(1f), cx + colW / 2f - ctx.dp(3f), bottom - ctx.dp(1f))
                ctx.canvas.drawRoundRect(rect, ctx.dp(4f), ctx.dp(4f), ctx.fillPaint(e.colorArgb, 230))
                if (rect.height() > ctx.sp(12f)) {
                    ctx.canvas.drawText(ctx.ellipsize(e.title, titlePaint, rect.width() - ctx.dp(6f)), rect.left + ctx.dp(3f), rect.top + ctx.sp(10f), titlePaint)
                }
            }
        }
    }

    private fun hourLabel(ctx: RenderContext, h: Int): String =
        if (ctx.use24Hour) "%02d".format(h) else "${if (h % 12 == 0) 12 else h % 12}${if (h < 12) "a" else "p"}"
}

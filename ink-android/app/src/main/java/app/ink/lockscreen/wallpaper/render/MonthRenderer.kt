package app.ink.lockscreen.wallpaper.render

import android.graphics.Paint
import android.graphics.RectF
import app.ink.lockscreen.domain.model.TodayMarker
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

/** Ink's signature design: a full month grid with event dots and a highlighted today. */
class MonthRenderer : LayoutRenderer {

    override fun draw(ctx: RenderContext) {
        val b = ctx.block
        val today = ctx.snapshot.today
        val month = YearMonth.from(today)
        val title = ctx.textPaint(30f, bold = true)
        val monthName = month.month.getDisplayName(TextStyle.FULL, Locale.getDefault())
        ctx.canvas.drawText(monthName, b.left, b.top + ctx.sp(30f), title)
        val yearPaint = ctx.textPaint(16f, alpha = 170)
        ctx.canvas.drawText(month.year.toString(), b.left + title.measureText(monthName) + ctx.dp(10f), b.top + ctx.sp(30f), yearPaint)

        val gridTop = b.top + ctx.dp(52f)
        val cellW = b.width() / 7f
        val dowPaint = ctx.textPaint(11f, alpha = 160).apply { textAlign = Paint.Align.CENTER }
        val days = (0 until 7).map { ctx.config.weekStart.plus(it.toLong()) }
        days.forEachIndexed { i, d ->
            val label = d.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2).uppercase()
            ctx.canvas.drawText(label, b.left + cellW * i + cellW / 2f, gridTop, dowPaint)
        }

        val first = month.atDay(1)
        val offset = ((first.dayOfWeek.value - ctx.config.weekStart.value) + 7) % 7
        val rows = (offset + month.lengthOfMonth() + 6) / 7
        val cellH = ((b.bottom - gridTop - ctx.dp(16f)) / rows).coerceAtMost(cellW * 1.15f)
        val numPaint = ctx.textPaint(15f).apply { textAlign = Paint.Align.CENTER }
        val pastPaint = ctx.textPaint(15f, alpha = 110).apply { textAlign = Paint.Align.CENTER }
        val todayText = ctx.textPaint(15f, bold = true, color = contrastOn(ctx.config.accentArgb)).apply { textAlign = Paint.Align.CENTER }

        for (day in 1..month.lengthOfMonth()) {
            val idx = offset + day - 1
            val cx = b.left + cellW * (idx % 7) + cellW / 2f
            val cy = gridTop + ctx.dp(16f) + cellH * (idx / 7) + cellH / 2f
            val date = month.atDay(day)
            val isToday = date == today
            val r = minOf(cellW, cellH) * 0.36f
            if (isToday) drawTodayMarker(ctx, cx, cy, r)
            val paint = when {
                isToday && ctx.config.todayMarker != TodayMarker.RING -> todayText
                date.isBefore(today) -> pastPaint
                else -> numPaint
            }
            ctx.canvas.drawText(day.toString(), cx, cy + paint.textSize * 0.35f, paint)
            if (ctx.config.showEvents) drawEventDots(ctx, date, cx, cy + r + ctx.dp(5f))
        }
    }

    private fun drawTodayMarker(ctx: RenderContext, cx: Float, cy: Float, r: Float) {
        val accent = ctx.config.accentArgb
        when (ctx.config.todayMarker) {
            TodayMarker.DOT -> ctx.canvas.drawCircle(cx, cy, r, ctx.fillPaint(accent))
            TodayMarker.RING -> ctx.canvas.drawCircle(cx, cy, r, ctx.strokePaint(accent, 2f))
            TodayMarker.SQUARE -> ctx.canvas.drawRoundRect(
                RectF(cx - r, cy - r, cx + r, cy + r), ctx.dp(6f), ctx.dp(6f), ctx.fillPaint(accent),
            )
        }
    }

    private fun drawEventDots(ctx: RenderContext, date: java.time.LocalDate, cx: Float, y: Float) {
        val events = ctx.snapshot.eventsOn(date).take(3)
        if (events.isEmpty()) return
        val dot = ctx.dp(2.2f)
        val gap = ctx.dp(3f)
        val total = events.size * dot * 2 + (events.size - 1) * gap
        var x = cx - total / 2f + dot
        events.forEach { e ->
            ctx.canvas.drawCircle(x, y, dot, ctx.fillPaint(e.colorArgb))
            x += dot * 2 + gap
        }
    }

    private fun contrastOn(argb: Int): Int {
        val r = (argb shr 16) and 0xFF; val g = (argb shr 8) and 0xFF; val bl = argb and 0xFF
        val luma = 0.299 * r + 0.587 * g + 0.114 * bl
        return if (luma > 150) 0xFF1B2140.toInt() else 0xFFFFFFFF.toInt()
    }
}

package app.ink.lockscreen.wallpaper.render

import android.graphics.Paint
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

/** "Timeline" template: the next 5 days as a vertical agenda with a rail on the left. */
class TimelineRenderer : LayoutRenderer {

    override fun draw(ctx: RenderContext) {
        val b = ctx.block
        val railX = b.left + ctx.dp(56f)
        var y = b.top
        val dayPaint = ctx.textPaint(13f, bold = true).apply { textAlign = Paint.Align.RIGHT }
        val datePaint = ctx.textPaint(22f, bold = true).apply { textAlign = Paint.Align.RIGHT }
        val eventPaint = ctx.textPaint(14f)
        val timePaint = ctx.textPaint(11f, alpha = 170)
        val emptyPaint = ctx.textPaint(13f, alpha = 120)
        val rail = ctx.strokePaint(ctx.config.textArgb, 1f, alpha = 70)

        ctx.canvas.drawLine(railX, b.top, railX, b.bottom, rail)

        for (i in 0 until 5) {
            if (y > b.bottom - ctx.dp(40f)) break
            val date = ctx.snapshot.today.plusDays(i.toLong())
            val isToday = i == 0
            y += ctx.sp(22f)
            ctx.canvas.drawText(date.dayOfMonth.toString(), railX - ctx.dp(14f), y, datePaint)
            ctx.canvas.drawText(
                date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).uppercase(),
                railX - ctx.dp(14f), y + ctx.sp(14f), dayPaint,
            )
            ctx.canvas.drawCircle(
                railX, y - ctx.sp(8f), ctx.dp(if (isToday) 6f else 4f),
                ctx.fillPaint(if (isToday) ctx.config.accentArgb else ctx.config.textArgb, if (isToday) 255 else 140),
            )
            y = drawDay(ctx, date, railX + ctx.dp(18f), y - ctx.sp(8f), eventPaint, timePaint, emptyPaint)
            y += ctx.dp(18f)
        }
    }

    private fun drawDay(
        ctx: RenderContext, date: LocalDate, x: Float, startY: Float,
        eventPaint: Paint, timePaint: Paint, emptyPaint: Paint,
    ): Float {
        var y = startY
        val events = ctx.snapshot.eventsOn(date).take(4)
        if (events.isEmpty()) {
            ctx.canvas.drawText("Nothing planned", x, y + ctx.sp(5f), emptyPaint)
            return y + ctx.sp(18f)
        }
        events.forEach { e ->
            val maxW = ctx.block.right - x - ctx.dp(12f)
            ctx.canvas.drawRoundRect(x - ctx.dp(6f), y - ctx.sp(8f), x - ctx.dp(3f), y + ctx.sp(8f), ctx.dp(2f), ctx.dp(2f), ctx.fillPaint(e.colorArgb))
            ctx.canvas.drawText(ctx.ellipsize(e.title, eventPaint, maxW), x + ctx.dp(6f), y + ctx.sp(5f), eventPaint)
            val time = if (e.allDay) "All day" else e.start.format(ctx.timeFormatter)
            ctx.canvas.drawText(time, x + ctx.dp(6f), y + ctx.sp(19f), timePaint)
            y += ctx.sp(34f)
        }
        return y - ctx.sp(8f)
    }
}

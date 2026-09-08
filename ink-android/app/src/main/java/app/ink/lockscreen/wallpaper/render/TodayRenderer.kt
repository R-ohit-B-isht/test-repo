package app.ink.lockscreen.wallpaper.render

import android.graphics.Paint
import android.graphics.RectF
import java.time.format.DateTimeFormatter

/** "Today" template: a headline date, today's events, then open tasks as a checklist. */
class TodayRenderer : LayoutRenderer {

    override fun draw(ctx: RenderContext) {
        val b = ctx.block
        var y = b.top + ctx.sp(34f)
        val head = ctx.textPaint(34f, bold = true)
        val sub = ctx.textPaint(14f, alpha = 170)
        val date = ctx.snapshot.today
        ctx.canvas.drawText(date.format(DateTimeFormatter.ofPattern("EEEE")), b.left, y, head)
        y += ctx.sp(20f)
        ctx.canvas.drawText(date.format(DateTimeFormatter.ofPattern("d MMMM")), b.left, y, sub)
        y += ctx.dp(28f)

        y = section(ctx, "EVENTS", y)
        val events = ctx.snapshot.todayEvents.take(5)
        if (events.isEmpty()) y = emptyLine(ctx, "No events today", y)
        events.forEach { e ->
            if (y > b.bottom - ctx.sp(20f)) return
            val timePaint = ctx.textPaint(12f, alpha = 170).apply { textAlign = Paint.Align.LEFT }
            val titlePaint = ctx.textPaint(15f)
            ctx.canvas.drawRoundRect(RectF(b.left, y - ctx.sp(11f), b.left + ctx.dp(3f), y + ctx.sp(4f)), ctx.dp(2f), ctx.dp(2f), ctx.fillPaint(e.colorArgb))
            val time = if (e.allDay) "All day" else e.start.format(ctx.timeFormatter)
            ctx.canvas.drawText(time, b.left + ctx.dp(12f), y, timePaint)
            ctx.canvas.drawText(ctx.ellipsize(e.title, titlePaint, b.width() - ctx.dp(90f)), b.left + ctx.dp(78f), y, titlePaint)
            y += ctx.sp(26f)
        }

        if (!ctx.config.showTasks) return
        y += ctx.dp(12f)
        y = section(ctx, "TO-DO", y)
        val tasks = ctx.snapshot.openTasks.take(6)
        if (tasks.isEmpty()) emptyLine(ctx, "All clear", y)
        tasks.forEach { t ->
            if (y > b.bottom - ctx.sp(20f)) return
            val box = RectF(b.left, y - ctx.sp(11f), b.left + ctx.sp(13f), y + ctx.sp(2f))
            ctx.canvas.drawRoundRect(box, ctx.dp(3f), ctx.dp(3f), ctx.strokePaint(ctx.config.textArgb, 1.2f, alpha = 200))
            if (t.quadrant.isUrgent) ctx.canvas.drawCircle(box.centerX(), box.centerY(), ctx.dp(2.5f), ctx.fillPaint(ctx.config.accentArgb))
            val p = ctx.textPaint(15f)
            ctx.canvas.drawText(ctx.ellipsize(t.title, p, b.width() - ctx.dp(30f)), b.left + ctx.dp(26f), y, p)
            y += ctx.sp(26f)
        }
    }

    private fun section(ctx: RenderContext, label: String, y: Float): Float {
        val p = ctx.textPaint(11f, bold = true, alpha = 190, color = ctx.config.accentArgb).apply { letterSpacing = 0.12f }
        ctx.canvas.drawText(label, ctx.block.left, y, p)
        return y + ctx.sp(26f)
    }

    private fun emptyLine(ctx: RenderContext, text: String, y: Float): Float {
        ctx.canvas.drawText(text, ctx.block.left, y, ctx.textPaint(14f, alpha = 130))
        return y + ctx.sp(26f)
    }
}

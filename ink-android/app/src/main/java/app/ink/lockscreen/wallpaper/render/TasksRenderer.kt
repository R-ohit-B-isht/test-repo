package app.ink.lockscreen.wallpaper.render

import android.graphics.RectF
import app.ink.lockscreen.domain.model.TaskQuadrant

/** "To-do" template: open tasks grouped by Eisenhower quadrant. */
class TasksRenderer : LayoutRenderer {

    override fun draw(ctx: RenderContext) {
        val b = ctx.block
        var y = b.top + ctx.sp(30f)
        ctx.canvas.drawText("To-do", b.left, y, ctx.textPaint(30f, bold = true))
        val open = ctx.snapshot.openTasks
        ctx.canvas.drawText("${open.size} open", b.left + ctx.dp(96f), y, ctx.textPaint(15f, alpha = 170))
        y += ctx.dp(30f)

        if (open.isEmpty()) {
            ctx.canvas.drawText("Nothing to do — enjoy the calm.", b.left, y, ctx.textPaint(15f, alpha = 150))
            return
        }
        for (q in TaskQuadrant.entries) {
            val tasks = open.filter { it.quadrant == q }.take(5)
            if (tasks.isEmpty()) continue
            if (y > b.bottom - ctx.sp(40f)) return
            ctx.canvas.drawText(q.label.uppercase(), b.left, y, ctx.textPaint(11f, bold = true, color = ctx.config.accentArgb).apply { letterSpacing = 0.12f })
            y += ctx.sp(22f)
            tasks.forEach { t ->
                if (y > b.bottom - ctx.sp(16f)) return
                val box = RectF(b.left, y - ctx.sp(11f), b.left + ctx.sp(13f), y + ctx.sp(2f))
                ctx.canvas.drawRoundRect(box, ctx.dp(3f), ctx.dp(3f), ctx.strokePaint(ctx.config.textArgb, 1.2f, alpha = 200))
                val p = ctx.textPaint(15f)
                ctx.canvas.drawText(ctx.ellipsize(t.title, p, b.width() - ctx.dp(30f)), b.left + ctx.dp(26f), y, p)
                y += ctx.sp(25f)
            }
            y += ctx.dp(10f)
        }
    }
}

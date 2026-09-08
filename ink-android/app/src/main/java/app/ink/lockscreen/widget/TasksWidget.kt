package app.ink.lockscreen.widget

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.Text
import app.ink.lockscreen.InkApplication
import app.ink.lockscreen.MainActivity
import app.ink.lockscreen.domain.model.Task

class TasksWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = TasksWidget()
}

/** Open tasks, most urgent quadrant first. */
class TasksWidget : GlanceAppWidget() {

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val container = (context.applicationContext as InkApplication).container
        val tasks = container.tasks.open().sortedBy { it.quadrant.ordinal }
        provideContent { Content(tasks) }
    }

    @Composable
    private fun Content(tasks: List<Task>) {
        WidgetCard(GlanceModifier.clickable(actionStartActivity<MainActivity>())) {
            Row(GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Tasks", style = WidgetTheme.title)
                Spacer(GlanceModifier.defaultWeight())
                Text("${tasks.size} open", style = WidgetTheme.caption)
            }
            Spacer(GlanceModifier.height(8.dp))
            if (tasks.isEmpty()) {
                Text("All clear. Add a task in Ink.", style = WidgetTheme.caption)
            }
            tasks.take(5).forEach { task ->
                Row(GlanceModifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        GlanceModifier.size(14.dp).background(WidgetTheme.line).cornerRadius(4.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (task.quadrant.isUrgent) Box(GlanceModifier.size(6.dp).background(WidgetTheme.accent).cornerRadius(3.dp)) {}
                    }
                    Spacer(GlanceModifier.size(8.dp))
                    Text(task.title, style = WidgetTheme.body, maxLines = 1)
                }
            }
        }
    }
}

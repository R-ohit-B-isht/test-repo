package app.ink.lockscreen.ui.discover

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.LockscreenDesign
import app.ink.lockscreen.ui.components.Eyebrow
import app.ink.lockscreen.ui.components.InkSwitch
import app.ink.lockscreen.ui.components.InkCard
import app.ink.lockscreen.ui.theme.InkColors
import app.ink.lockscreen.widget.WidgetUpdater

@Composable
fun SetupBanner(active: Boolean, layoutLabel: String, onCustomize: () -> Unit, modifier: Modifier = Modifier) {
    InkCard(modifier = modifier.fillMaxWidth(), onClick = onCustomize) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(10.dp).background(if (active) InkColors.Accent else InkColors.Line, CircleShape),
            )
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(
                    if (active) "Lock screen is live" else "Set up your lock screen",
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    if (active) "$layoutLabel layout · refreshes nightly" else "Your schedule on the lock screen, refreshed every day.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkColors.Muted,
                )
            }
            Text(if (active) "Edit" else "Start", style = MaterialTheme.typography.bodyMedium, color = InkColors.Navy)
        }
    }
}

@Composable
fun DesignCard(design: LockscreenDesign, preview: Bitmap?, isCurrent: Boolean, busy: Boolean, onApply: () -> Unit) {
    Column(Modifier.width(150.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(360f / 780f)
                .clip(MaterialTheme.shapes.medium)
                .background(InkColors.Mist),
        ) {
            if (preview != null) {
                Image(preview.asImageBitmap(), contentDescription = design.name, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxWidth())
            }
        }
        Eyebrow(design.layout.label)
        Text(design.name, style = MaterialTheme.typography.bodyMedium, maxLines = 1)
        if (isCurrent) {
            OutlinedButton(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) { Text("Current") }
        } else {
            Button(
                onClick = onApply,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = InkColors.Navy),
            ) { Text("Set as current") }
        }
    }
}

@Composable
fun LiveScheduleCard(enabled: Boolean, onToggle: (Boolean) -> Unit, modifier: Modifier = Modifier) {
    InkCard(modifier = modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Next events, always visible", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(2.dp))
                Text(
                    "A quiet, persistent card on your lock screen and notification shade with what's next.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = InkColors.Muted,
                )
            }
            Spacer(Modifier.width(12.dp))
            InkSwitch(enabled, onToggle)
        }
    }
}

@Composable
fun WidgetCard(kind: WidgetUpdater.Kind, onAdd: () -> Unit) {
    val icon = when (kind) {
        WidgetUpdater.Kind.CALENDAR -> Icons.Outlined.CalendarMonth
        WidgetUpdater.Kind.TASKS -> Icons.Outlined.CheckCircle
        WidgetUpdater.Kind.NEXT_EVENT -> Icons.Outlined.Schedule
    }
    InkCard(modifier = Modifier.width(180.dp)) {
        Box(Modifier.size(40.dp).background(InkColors.Mist, CircleShape), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = null, tint = InkColors.Navy)
        }
        Spacer(Modifier.height(12.dp))
        Text(kind.label, style = MaterialTheme.typography.titleMedium)
        Text(kind.description, style = MaterialTheme.typography.bodyMedium, color = InkColors.Muted, minLines = 2)
        Spacer(Modifier.height(12.dp))
        OutlinedButton(onClick = onAdd, modifier = Modifier.fillMaxWidth()) { Text("Add widget") }
    }
}

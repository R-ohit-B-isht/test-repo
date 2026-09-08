package app.ink.lockscreen.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import app.ink.lockscreen.domain.model.Event
import app.ink.lockscreen.ui.theme.InkColors
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

/** Month grid mirroring the wallpaper's Month layout so what you tap is what you see on the lock screen. */
@Composable
fun MonthGrid(
    month: YearMonth,
    selected: LocalDate,
    weekStart: DayOfWeek,
    eventsOn: (LocalDate) -> List<Event>,
    onSelect: (LocalDate) -> Unit,
    modifier: Modifier = Modifier,
) {
    val today = LocalDate.now()
    val offset = ((month.atDay(1).dayOfWeek.value - weekStart.value) + 7) % 7
    val rows = (offset + month.lengthOfMonth() + 6) / 7

    Column(modifier) {
        Row(Modifier.fillMaxWidth()) {
            for (i in 0 until 7) {
                Text(
                    weekStart.plus(i.toLong()).getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2).uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = InkColors.Muted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f),
                )
            }
        }
        for (r in 0 until rows) {
            Row(Modifier.fillMaxWidth()) {
                for (c in 0 until 7) {
                    val day = r * 7 + c - offset + 1
                    Box(Modifier.weight(1f).aspectRatio(0.9f), contentAlignment = Alignment.Center) {
                        if (day in 1..month.lengthOfMonth()) {
                            val date = month.atDay(day)
                            DayCell(date, date == today, date == selected, eventsOn(date), onClick = { onSelect(date) })
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DayCell(date: LocalDate, isToday: Boolean, isSelected: Boolean, events: List<Event>, onClick: () -> Unit) {
    val bg = when {
        isSelected -> InkColors.Navy
        isToday -> InkColors.Accent
        else -> Color.Transparent
    }
    val fg = when {
        isSelected -> InkColors.Card
        else -> InkColors.Navy
    }
    Column(
        Modifier.clickable(onClick = onClick).padding(2.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Box(Modifier.size(34.dp).background(bg, CircleShape), contentAlignment = Alignment.Center) {
            Text(
                date.dayOfMonth.toString(),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isToday || isSelected) FontWeight.Bold else FontWeight.Normal,
                color = fg,
            )
        }
        Row(Modifier.height(5.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            events.take(3).forEach { Box(Modifier.size(5.dp).background(Color(it.colorArgb), CircleShape)) }
        }
    }
}

package app.ink.lockscreen.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Ink's visual language, lifted from the original app: warm paper surfaces, deep navy ink,
 * hairline borders, generously rounded cards and a single warm accent. 60/30/10 — paper /
 * navy / accent. Four type sizes, two weights.
 */
object InkColors {
    val Paper = Color(0xFFF7F6F2)
    val Card = Color(0xFFFFFFFF)
    val Navy = Color(0xFF1B2140)
    val Muted = Color(0xFF6B7088)
    val Line = Color(0xFFE6E4DD)
    val Accent = Color(0xFFFFC857)
    val AccentInk = Color(0xFF1B2140)
    val Danger = Color(0xFFD9534F)
    val Mist = Color(0xFFEFEDE6)
}

private val InkColorScheme = lightColorScheme(
    primary = InkColors.Navy,
    onPrimary = Color.White,
    secondary = InkColors.Accent,
    onSecondary = InkColors.AccentInk,
    background = InkColors.Paper,
    onBackground = InkColors.Navy,
    surface = InkColors.Card,
    onSurface = InkColors.Navy,
    surfaceVariant = InkColors.Mist,
    onSurfaceVariant = InkColors.Muted,
    surfaceContainer = InkColors.Card,
    surfaceContainerLow = InkColors.Paper,
    surfaceContainerHigh = InkColors.Mist,
    surfaceContainerHighest = InkColors.Mist,
    primaryContainer = InkColors.Navy,
    onPrimaryContainer = Color.White,
    secondaryContainer = InkColors.Mist,
    onSecondaryContainer = InkColors.Navy,
    outline = InkColors.Muted,
    outlineVariant = InkColors.Line,
    error = InkColors.Danger,
)

private val InkTypography = Typography(
    headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 30.sp, lineHeight = 36.sp, letterSpacing = (-0.5).sp),
    titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 17.sp, lineHeight = 22.sp),
    bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Normal, fontSize = 15.sp, lineHeight = 21.sp),
    labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 11.sp, lineHeight = 14.sp, letterSpacing = 1.2.sp),
)

private val InkShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(26.dp),
)

@Composable
fun InkTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = InkColorScheme, typography = InkTypography, shapes = InkShapes, content = content)
}

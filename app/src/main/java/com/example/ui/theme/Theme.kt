package com.example.ui.theme

import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val PunkDarkColorScheme = darkColorScheme(
    primary = SportsRed,
    onPrimary = PureWhite,
    primaryContainer = SportsRedTint,
    onPrimaryContainer = SportsRedBright,
    secondary = NeonGreen,
    onSecondary = VoidBlack,
    secondaryContainer = NeonGreenTint,
    onSecondaryContainer = NeonGreen,
    tertiary = NeonGreenCrisp,
    onTertiary = VoidBlack,
    background = VoidBlack,
    onBackground = PureWhite,
    surface = ObsidianSurface,
    onSurface = PureWhite,
    surfaceVariant = CarbonSurface,
    onSurfaceVariant = AshGray,
    outline = GraphiteBorder,
    outlineVariant = ElevatedCarbon,
    error = SportsRedBright,
    onError = VoidBlack
)

val PunkShapes = Shapes(
    extraSmall = CutCornerShape(4.dp),
    small = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
    medium = CutCornerShape(topEnd = 14.dp, bottomStart = 14.dp),
    large = CutCornerShape(topEnd = 18.dp, bottomStart = 18.dp),
    extraLarge = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = true,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = PunkDarkColorScheme,
        typography = Typography,
        shapes = PunkShapes,
        content = content
    )
}

package com.example.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val PixelLightColorScheme = lightColorScheme(
    primary = PixelBlue,
    onPrimary = PureWhite,
    primaryContainer = PixelBlueContainer,
    onPrimaryContainer = OnPixelBlueContainer,
    secondary = CampusEmerald,
    onSecondary = PureWhite,
    secondaryContainer = CampusEmeraldTint,
    onSecondaryContainer = CampusEmeraldDark,
    tertiary = SkyTeal,
    onTertiary = PureWhite,
    background = PorcelainCanvas,
    onBackground = InkBlack,
    surface = PureSurface,
    onSurface = InkBlack,
    surfaceVariant = TonalMist,
    onSurfaceVariant = SlateGray,
    outline = MistOutline,
    outlineVariant = SoftOutline,
    error = CampusCrimson,
    onError = PureWhite,
    errorContainer = CampusCrimsonTint,
    onErrorContainer = CampusCrimson
)

val PixelShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(20.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp)
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = false,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = PixelLightColorScheme,
        typography = Typography,
        shapes = PixelShapes,
        content = content
    )
}

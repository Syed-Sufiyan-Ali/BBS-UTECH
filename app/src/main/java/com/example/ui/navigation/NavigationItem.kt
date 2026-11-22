package com.example.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Layers
import androidx.compose.material.icons.outlined.Map
import androidx.compose.material.icons.outlined.School
import androidx.compose.ui.graphics.vector.ImageVector

enum class AppScreen(
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
) {
    HOME("Home", Icons.Filled.Home, Icons.Outlined.Home, "nav_tab_home"),
    OUTDOOR_MAP("Campus GPS", Icons.Filled.Map, Icons.Outlined.Map, "nav_tab_outdoor"),
    INDOOR_MAP("Indoor Plans", Icons.Filled.Layers, Icons.Outlined.Layers, "nav_tab_indoor"),
    SCHEDULE("Timetable", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth, "nav_tab_schedule"),
    RESOURCES("Resources", Icons.Filled.School, Icons.Outlined.School, "nav_tab_resources")
}

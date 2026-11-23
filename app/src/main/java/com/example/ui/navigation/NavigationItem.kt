package com.example.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.DirectionsBus
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Map
import androidx.compose.ui.graphics.vector.ImageVector

enum class AppScreen(
    val title: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val testTag: String
) {
    HOME("Home", Icons.Filled.Home, Icons.Outlined.Home, "nav_tab_home"),
    OUTDOOR_MAP("Campus GPS", Icons.Filled.Map, Icons.Outlined.Map, "nav_tab_outdoor"),
    SCHEDULE("Timetable", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth, "nav_tab_schedule"),
    BUSES("Bus Timetables", Icons.Filled.DirectionsBus, Icons.Outlined.DirectionsBus, "nav_tab_buses")
}

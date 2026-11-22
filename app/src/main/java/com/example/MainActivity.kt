package com.example

import android.graphics.Color as AndroidColor
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.repository.CampusRepository
import com.example.location.LocationHelper
import com.example.ui.MainViewModel
import com.example.ui.navigation.AppScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.IndoorMapScreen
import com.example.ui.screens.OutdoorMapScreen
import com.example.ui.screens.PinDetailSheet
import com.example.ui.screens.ResourcesScreen
import com.example.ui.screens.ScheduleScreen
import com.example.ui.theme.AshGray
import com.example.ui.theme.DisplayFontFamily
import com.example.ui.theme.GraphiteBorder
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.PureWhite
import com.example.ui.theme.SportsRed
import com.example.ui.theme.SportsRedTint
import com.example.ui.theme.VoidBlack

class MainActivity : ComponentActivity() {

    private lateinit var locationHelper: LocationHelper
    private lateinit var repository: CampusRepository
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT)
        )

        repository = CampusRepository()
        locationHelper = LocationHelper(applicationContext)
        viewModel = MainViewModel(repository, locationHelper)

        setContent {
            MyApplicationTheme {
                BBSUTSDApp(viewModel = viewModel)
            }
        }
    }

    override fun onStart() {
        super.onStart()
        locationHelper.startLocationUpdates()
    }

    override fun onStop() {
        super.onStop()
        locationHelper.stopLocationUpdates()
    }
}

@Composable
fun BBSUTSDApp(viewModel: MainViewModel) {
    val currentScreen by viewModel.currentScreen.collectAsState()
    val selectedPin by viewModel.selectedPin.collectAsState()
    val userLocation by viewModel.locationHelper.currentLocation.collectAsState()

    BackHandler(enabled = currentScreen != AppScreen.HOME) {
        viewModel.navigateToScreen(AppScreen.HOME)
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = VoidBlack,
        bottomBar = {
            Column(modifier = Modifier.fillMaxWidth()) {
                HorizontalDivider(color = GraphiteBorder, thickness = 1.dp)
                NavigationBar(
                    containerColor = VoidBlack,
                    tonalElevation = 0.dp,
                    windowInsets = WindowInsets.navigationBars,
                    modifier = Modifier.testTag("main_bottom_nav_bar")
                ) {
                    AppScreen.values().forEach { screen ->
                        val isSelected = currentScreen == screen
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { viewModel.navigateToScreen(screen) },
                            icon = {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    if (isSelected) {
                                        Box(
                                            modifier = Modifier
                                                .width(18.dp)
                                                .height(2.5.dp)
                                                .clip(CutCornerShape(2.dp))
                                                .background(NeonGreen)
                                        )
                                    } else {
                                        Box(modifier = Modifier.height(2.5.dp))
                                    }
                                    Box(modifier = Modifier.padding(top = 3.dp)) {
                                        Icon(
                                            imageVector = if (isSelected) screen.selectedIcon else screen.unselectedIcon,
                                            contentDescription = screen.title,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                            },
                            label = {
                                Text(
                                    text = when (screen) {
                                        AppScreen.HOME -> "HOME"
                                        AppScreen.OUTDOOR_MAP -> "GPS MAP"
                                        AppScreen.INDOOR_MAP -> "INDOOR"
                                        AppScreen.SCHEDULE -> "CLASSES"
                                        AppScreen.RESOURCES -> "HUB"
                                    },
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 10.sp,
                                    letterSpacing = 0.6.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = SportsRed,
                                selectedTextColor = PureWhite,
                                indicatorColor = SportsRedTint,
                                unselectedIconColor = AshGray,
                                unselectedTextColor = AshGray
                            ),
                            modifier = Modifier.testTag(screen.testTag)
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(VoidBlack)
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                AppScreen.HOME -> HomeScreen(viewModel = viewModel)
                AppScreen.OUTDOOR_MAP -> OutdoorMapScreen(viewModel = viewModel)
                AppScreen.INDOOR_MAP -> IndoorMapScreen(viewModel = viewModel)
                AppScreen.SCHEDULE -> ScheduleScreen(viewModel = viewModel)
                AppScreen.RESOURCES -> ResourcesScreen(viewModel = viewModel)
            }

            if (selectedPin != null) {
                PinDetailSheet(
                    pin = selectedPin!!,
                    userLocation = userLocation,
                    repository = viewModel.repository,
                    onDismiss = { viewModel.selectPin(null) },
                    onNavigateIndoor = { pin -> viewModel.locatePinIndoor(pin) },
                    onNavigateOutdoor = { pin -> viewModel.locatePinOutdoor(pin) },
                    onOpenBusTimings = { viewModel.openBusTimings() }
                )
            }
        }
    }
}

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
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.repository.CampusRepository
import com.example.location.LocationHelper
import com.example.ui.MainViewModel
import com.example.ui.navigation.AppScreen
import com.example.ui.screens.BusesScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.OutdoorMapScreen
import com.example.ui.screens.PinDetailSheet
import com.example.ui.screens.ScheduleScreen
import com.example.ui.theme.BodyFontFamily
import com.example.ui.theme.HazelnutBorder
import com.example.ui.theme.InkBlack
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.PorcelainCanvas
import com.example.ui.theme.PureSurface
import com.example.ui.theme.RoastedWalnut
import com.example.ui.theme.SlateGray
import com.example.ui.theme.ToastedCreamTint
import com.example.ui.theme.warmShadow

class MainActivity : ComponentActivity() {

    private lateinit var locationHelper: LocationHelper
    private lateinit var repository: CampusRepository
    private lateinit var viewModel: MainViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.light(AndroidColor.TRANSPARENT, AndroidColor.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.light(AndroidColor.TRANSPARENT, AndroidColor.TRANSPARENT)
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
        containerColor = PorcelainCanvas,
        bottomBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .warmShadow(elevation = 10.dp)
            ) {
                HorizontalDivider(color = HazelnutBorder, thickness = 1.dp)
                NavigationBar(
                    containerColor = PureSurface,
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
                                Icon(
                                    imageVector = if (isSelected) screen.selectedIcon else screen.unselectedIcon,
                                    contentDescription = screen.title,
                                    modifier = Modifier.size(22.dp)
                                )
                            },
                            label = {
                                Text(
                                    text = when (screen) {
                                        AppScreen.HOME -> "Home"
                                        AppScreen.OUTDOOR_MAP -> "Map"
                                        AppScreen.SCHEDULE -> "Classes"
                                        AppScreen.BUSES -> "Buses"
                                    },
                                    fontFamily = BodyFontFamily,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = RoastedWalnut,
                                selectedTextColor = InkBlack,
                                indicatorColor = ToastedCreamTint,
                                unselectedIconColor = SlateGray,
                                unselectedTextColor = SlateGray
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
                .background(PorcelainCanvas)
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                AppScreen.HOME -> HomeScreen(viewModel = viewModel)
                AppScreen.OUTDOOR_MAP -> OutdoorMapScreen(viewModel = viewModel)
                AppScreen.SCHEDULE -> ScheduleScreen(viewModel = viewModel)
                AppScreen.BUSES -> BusesScreen(viewModel = viewModel)
            }

            if (selectedPin != null) {
                PinDetailSheet(
                    pin = selectedPin!!,
                    userLocation = userLocation,
                    repository = viewModel.repository,
                    onDismiss = { viewModel.selectPin(null) },
                    onNavigateOutdoor = { pin -> viewModel.locatePinOutdoor(pin) },
                    onOpenBusTimings = { viewModel.openBusTimings() }
                )
            }
        }
    }
}

package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Building
import com.example.data.model.CampusPin
import com.example.ui.MainViewModel
import com.example.ui.navigation.AppScreen
import com.example.ui.theme.BodyFontFamily
import com.example.ui.theme.CampusCrimson
import com.example.ui.theme.CampusCrimsonTint
import com.example.ui.theme.CampusEmerald
import com.example.ui.theme.CampusEmeraldBorder
import com.example.ui.theme.CampusEmeraldDark
import com.example.ui.theme.CampusEmeraldTint
import com.example.ui.theme.DisplayFontFamily
import com.example.ui.theme.InkBlack
import com.example.ui.theme.MistOutline
import com.example.ui.theme.MonoFontFamily
import com.example.ui.theme.MutedGray
import com.example.ui.theme.OnPixelBlueContainer
import com.example.ui.theme.PixelBlue
import com.example.ui.theme.PixelBlueContainer
import com.example.ui.theme.PixelBlueTint
import com.example.ui.theme.PorcelainCanvas
import com.example.ui.theme.PureSurface
import com.example.ui.theme.PureWhite
import com.example.ui.theme.SlateGray
import com.example.ui.theme.TonalMist
import kotlinx.coroutines.delay

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val allPins by viewModel.repository.allPins.collectAsState()
    val nextClass by viewModel.nextClassItem.collectAsState()
    val userLocation by viewModel.locationHelper.currentLocation.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<CampusPin>>(emptyList()) }
    var heroVisible by remember { mutableStateOf(false) }
    var sectionsVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        heroVisible = true
        delay(120)
        sectionsVisible = true
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(PorcelainCanvas),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // =====================================================================
        // 1. HERO LANDING CARD (ABOUT BBS-UTECH + PRIMARY ACTIONS + SEARCH)
        // =====================================================================
        item {
            AnimatedVisibility(
                visible = heroVisible,
                enter = fadeIn(tween(420)) + slideInVertically(tween(420, easing = FastOutSlowInEasing)) { it / 10 }
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = PureSurface),
                    shape = RoundedCornerShape(28.dp),
                    border = BorderStroke(1.dp, MistOutline),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Surface(
                            color = PixelBlueTint,
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, PixelBlueContainer)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AutoAwesome,
                                    contentDescription = null,
                                    tint = PixelBlue,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "BBS-UTECH • Smart Campus Companion",
                                    fontFamily = BodyFontFamily,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = PixelBlue
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "Navigate every lab, hall, and bus route at BBS-UTECH.",
                            fontFamily = DisplayFontFamily,
                            fontSize = 24.sp,
                            lineHeight = 30.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = InkBlack
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "The unified digital guide for The Benazir Bhutto Shaheed University of Technology & Skill Development, Khairpur Mirs—built for live GPS shortest-path walking routes, department class schedules, and all 7 official city bus & coaster routes.",
                            fontFamily = BodyFontFamily,
                            fontSize = 13.sp,
                            lineHeight = 19.sp,
                            color = SlateGray
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = PixelBlue,
                                    contentColor = PureWhite
                                ),
                                shape = RoundedCornerShape(50),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp)
                                    .testTag("hero_launch_map_button")
                            ) {
                                Icon(Icons.Default.NearMe, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Campus Map",
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            OutlinedButton(
                                onClick = { viewModel.openBusTimings() },
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(1.dp, MistOutline),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp)
                                    .testTag("hero_bus_timetables_button")
                            ) {
                                Icon(
                                    Icons.Default.DirectionsBus,
                                    contentDescription = null,
                                    tint = PixelBlue,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Buses (7)",
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkBlack
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Lightweight Quick Search Pill
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = {
                                searchQuery = it
                                searchResults = if (it.trim().isNotEmpty()) {
                                    viewModel.repository.searchPins(it).take(5)
                                } else {
                                    emptyList()
                                }
                            },
                            placeholder = {
                                Text(
                                    "Quick search: Central Library, Main Gates, Mosque, Points...",
                                    fontFamily = BodyFontFamily,
                                    fontSize = 12.5.sp,
                                    color = MutedGray,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = null, tint = PixelBlue)
                            },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(
                                        onClick = {
                                            searchQuery = ""
                                            searchResults = emptyList()
                                        },
                                        modifier = Modifier.minimumInteractiveComponentSize()
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = SlateGray)
                                    }
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = PorcelainCanvas,
                                unfocusedContainerColor = PorcelainCanvas,
                                focusedTextColor = InkBlack,
                                unfocusedTextColor = InkBlack,
                                focusedBorderColor = PixelBlue,
                                unfocusedBorderColor = MistOutline,
                                cursorColor = PixelBlue
                            ),
                            shape = RoundedCornerShape(50),
                            singleLine = true,
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("home_instant_search_input")
                        )

                        AnimatedVisibility(
                            visible = searchQuery.isNotBlank(),
                            enter = fadeIn() + slideInVertically { -it / 4 },
                            exit = fadeOut()
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 10.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                if (searchResults.isEmpty()) {
                                    Text(
                                        text = "No landmark matching \"$searchQuery\".",
                                        fontFamily = BodyFontFamily,
                                        fontSize = 12.sp,
                                        color = SlateGray,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                } else {
                                    searchResults.forEach { pin ->
                                        Surface(
                                            color = PorcelainCanvas,
                                            shape = RoundedCornerShape(16.dp),
                                            border = BorderStroke(1.dp, MistOutline),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable { viewModel.selectPin(pin) }
                                                .testTag("search_result_${pin.id}")
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Surface(color = PixelBlueTint, shape = RoundedCornerShape(50)) {
                                                    Text(
                                                        text = pin.roomNumber,
                                                        fontFamily = MonoFontFamily,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 10.5.sp,
                                                        color = PixelBlue,
                                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                                    )
                                                }
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Column(modifier = Modifier.weight(1f)) {
                                                    Text(
                                                        text = pin.name,
                                                        fontFamily = DisplayFontFamily,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 13.sp,
                                                        color = InkBlack,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                    Text(
                                                        text = "${pin.building.shortName} • ${pin.floor.displayName}",
                                                        fontFamily = BodyFontFamily,
                                                        fontSize = 11.sp,
                                                        color = SlateGray
                                                    )
                                                }
                                                IconButton(
                                                    onClick = { viewModel.locatePinOutdoor(pin) },
                                                    modifier = Modifier.minimumInteractiveComponentSize()
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.NearMe,
                                                        contentDescription = "Locate on campus map",
                                                        tint = PixelBlue
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // =====================================================================
        // 2. ANIMATED LIVE CAMPUS ROUTING PREVIEW WIDGET
        // =====================================================================
        item {
            AnimatedVisibility(
                visible = heroVisible,
                enter = fadeIn(tween(520, delayMillis = 80)) + slideInVertically(tween(520, delayMillis = 80)) { it / 8 }
            ) {
                AnimatedRoutingPreviewCard(
                    pinCount = allPins.size,
                    hasLiveGps = userLocation != null,
                    onClick = { viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP) }
                )
            }
        }

        // =====================================================================
        // 3. SORTED 4-PILLAR PLATFORM OVERVIEW
        // =====================================================================
        item {
            AnimatedVisibility(
                visible = sectionsVisible,
                enter = fadeIn(tween(480)) + slideInVertically(tween(480)) { it / 8 }
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Route,
                            contentDescription = null,
                            tint = PixelBlue,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "INSIDE THE PORTAL • SORTED INTO 3 TOOLS",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = PixelBlue
                        )
                    }

                    PillarModuleCard(
                        eyebrow = "01 • LIVE GPS NAVIGATION",
                        title = "Interactive Campus Map",
                        description = "Live GPS shortest-path walking directions with step-by-step turns and zoom-reveal landmark labels.",
                        icon = Icons.Default.Map,
                        iconBg = PixelBlueTint,
                        iconTint = PixelBlue,
                        ctaLabel = "Open Campus Map",
                        testTag = "pillar_campus_map"
                    ) {
                        viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP)
                    }

                    PillarModuleCard(
                        eyebrow = "02 • ACADEMIC TIMETABLE",
                        title = "Department Class Schedules",
                        description = "Structured weekly lecture and lab timetables with instructor names and one-tap GPS map pinpointing.",
                        icon = Icons.Default.CalendarMonth,
                        iconBg = CampusEmeraldTint,
                        iconTint = CampusEmeraldDark,
                        ctaLabel = "View Timetable",
                        testTag = "pillar_timetable"
                    ) {
                        viewModel.navigateToScreen(AppScreen.SCHEDULE)
                    }

                    PillarModuleCard(
                        eyebrow = "03 • CITY TRANSIT FLEET",
                        title = "Bus & Coaster Timetables (7)",
                        description = "Official morning university bus stops (Bus 01–05, Hino GS-9526 & Coaster GSF-325) across Hingorja, Sukkur, Chondko, Sobhodero, Thari Mirwah & Khairpur City.",
                        icon = Icons.Default.DirectionsBus,
                        iconBg = CampusCrimsonTint,
                        iconTint = CampusCrimson,
                        ctaLabel = "View Bus Timetables",
                        testTag = "pillar_buses_hub"
                    ) {
                        viewModel.openBusTimings()
                    }
                }
            }
        }

        // =====================================================================
        // 4. HOW THE CAMPUS IS ORGANIZED (3 ZONES)
        // =====================================================================
        item {
            AnimatedVisibility(
                visible = sectionsVisible,
                enter = fadeIn(tween(520, delayMillis = 120))
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.School,
                            contentDescription = null,
                            tint = CampusEmeraldDark,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "UNIVERSITY GROUNDS • CAMPUS STRUCTURE",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = CampusEmeraldDark
                        )
                    }

                    CampusZoneOverviewCard(
                        badge = "West of Dividing Road",
                        title = "Old Academic & Admin Complex",
                        summary = "Vice Chancellor Secretariat, Registrar, Examinations Branch, Finance, Admissions, and Engineering Technology workshops.",
                        containerColor = CampusCrimsonTint.copy(alpha = 0.55f),
                        borderColor = CampusCrimson.copy(alpha = 0.35f),
                        badgeBg = CampusCrimsonTint,
                        badgeTint = CampusCrimson,
                        actionLabel = "Locate on Map",
                        testTag = "shortcut_old_building"
                    ) {
                        viewModel.locatePinById("gate_main")
                    }

                    CampusZoneOverviewCard(
                        badge = "Central Spine • Hami Road Gate",
                        title = "Campus Dividing Road",
                        summary = "Main road connecting Main Gate, Campus Masjid, University Canteen, Hostels, and the Transport Terminal.",
                        containerColor = PixelBlueTint.copy(alpha = 0.55f),
                        borderColor = PixelBlueContainer,
                        badgeBg = PixelBlueTint,
                        badgeTint = PixelBlue,
                        actionLabel = "Trace Route on Map",
                        testTag = "shortcut_campus_gps"
                    ) {
                        viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP)
                    }

                    CampusZoneOverviewCard(
                        badge = "East of Dividing Road",
                        title = "New Academic & Skill Complex",
                        summary = "Computer Science & AI labs, Skill Development Directorate, Central Digital Library, Medical Unit, and Auditorium.",
                        containerColor = CampusEmeraldTint.copy(alpha = 0.65f),
                        borderColor = CampusEmeraldBorder,
                        badgeBg = CampusEmeraldTint,
                        badgeTint = CampusEmeraldDark,
                        actionLabel = "Locate on Map",
                        testTag = "shortcut_new_building"
                    ) {
                        viewModel.locatePinById("new_1_smart_class")
                    }
                }
            }
        }

        // =====================================================================
        // 5. MINIMALIST BOTTOM ACTION STRIP
        // =====================================================================
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = PureSurface),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, MistOutline),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Explore,
                            contentDescription = null,
                            tint = PixelBlue,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Need directions right now?",
                            fontFamily = DisplayFontFamily,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkBlack
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = nextClass?.let {
                            "Next session on file: ${it.subjectTitle} (${it.roomLabel})."
                        } ?: "Inspect all 7 university bus timetables or jump straight into live turn-by-turn campus routing.",
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        color = SlateGray
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.openBusTimings() },
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, MistOutline),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.DirectionsBus,
                                contentDescription = null,
                                tint = PixelBlue,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Buses (7)",
                                fontFamily = DisplayFontFamily,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkBlack
                            )
                        }

                        Button(
                            onClick = { viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = PixelBlue,
                                contentColor = PureWhite
                            ),
                            shape = RoundedCornerShape(50),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.NearMe, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Navigate",
                                fontFamily = DisplayFontFamily,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AnimatedRoutingPreviewCard(
    pinCount: Int,
    hasLiveGps: Boolean,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "campus_route_preview")
    val routeProgress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "route_progress"
    )
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 8f,
        targetValue = 16f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dest_pulse"
    )

    Card(
        colors = CardDefaults.cardColors(containerColor = PureSurface),
        shape = RoundedCornerShape(26.dp),
        border = BorderStroke(1.dp, MistOutline),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(9.dp)
                            .clip(CircleShape)
                            .background(CampusEmerald)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Live Campus Routing Preview",
                        fontFamily = DisplayFontFamily,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkBlack
                    )
                }
                Surface(color = TonalMist, shape = RoundedCornerShape(50)) {
                    Text(
                        text = if (hasLiveGps) "GPS Ready" else "27.51°N 68.74°E",
                        fontFamily = MonoFontFamily,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PixelBlue,
                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(145.dp)
                    .clip(RoundedCornerShape(18.dp))
                    .background(PorcelainCanvas)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    // Subtle blueprint grid
                    val step = 28.dp.toPx()
                    var gx = step
                    while (gx < w) {
                        drawLine(MistOutline.copy(alpha = 0.55f), Offset(gx, 0f), Offset(gx, h), 1f)
                        gx += step
                    }
                    var gy = step
                    while (gy < h) {
                        drawLine(MistOutline.copy(alpha = 0.55f), Offset(0f, gy), Offset(w, gy), 1f)
                        gy += step
                    }

                    // Old Complex Block
                    drawRoundRect(
                        color = CampusCrimsonTint,
                        topLeft = Offset(w * 0.08f, h * 0.14f),
                        size = Size(w * 0.30f, h * 0.30f),
                        cornerRadius = CornerRadius(14f, 14f)
                    )
                    drawRoundRect(
                        color = CampusCrimson,
                        topLeft = Offset(w * 0.08f, h * 0.14f),
                        size = Size(w * 0.30f, h * 0.30f),
                        cornerRadius = CornerRadius(14f, 14f),
                        style = Stroke(width = 2.5f)
                    )

                    // New Complex Block
                    drawRoundRect(
                        color = CampusEmeraldTint,
                        topLeft = Offset(w * 0.58f, h * 0.54f),
                        size = Size(w * 0.34f, h * 0.32f),
                        cornerRadius = CornerRadius(14f, 14f)
                    )
                    drawRoundRect(
                        color = CampusEmerald,
                        topLeft = Offset(w * 0.58f, h * 0.54f),
                        size = Size(w * 0.34f, h * 0.32f),
                        cornerRadius = CornerRadius(14f, 14f),
                        style = Stroke(width = 2.5f)
                    )

                    // Dividing Road Spine
                    drawLine(
                        color = Color(0xFFCBD5E1),
                        start = Offset(w * 0.10f, h * 0.84f),
                        end = Offset(w * 0.88f, h * 0.16f),
                        strokeWidth = 14f,
                        cap = StrokeCap.Round
                    )
                    drawLine(
                        color = PureWhite,
                        start = Offset(w * 0.10f, h * 0.84f),
                        end = Offset(w * 0.88f, h * 0.16f),
                        strokeWidth = 3f,
                        pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 12f)),
                        cap = StrokeCap.Round
                    )

                    // Animated Shortest Path Route
                    val routePath = Path().apply {
                        moveTo(w * 0.15f, h * 0.80f)
                        lineTo(w * 0.49f, h * 0.50f)
                        lineTo(w * 0.62f, h * 0.62f)
                        lineTo(w * 0.75f, h * 0.62f)
                    }
                    val measure = PathMeasure()
                    measure.setPath(routePath, false)
                    val animatedPath = Path()
                    measure.getSegment(0f, measure.length * routeProgress, animatedPath, true)
                    drawPath(
                        path = animatedPath,
                        color = PixelBlue,
                        style = Stroke(width = 7f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                    )

                    // Origin & Destination nodes
                    drawCircle(
                        color = PureWhite,
                        radius = 12f,
                        center = Offset(w * 0.15f, h * 0.80f)
                    )
                    drawCircle(
                        color = CampusEmerald,
                        radius = 8f,
                        center = Offset(w * 0.15f, h * 0.80f)
                    )

                    drawCircle(
                        color = PixelBlue.copy(alpha = 0.22f),
                        radius = pulseRadius,
                        center = Offset(w * 0.75f, h * 0.62f)
                    )
                    drawCircle(
                        color = PureWhite,
                        radius = 12f,
                        center = Offset(w * 0.75f, h * 0.62f)
                    )
                    drawCircle(
                        color = PixelBlue,
                        radius = 8f,
                        center = Offset(w * 0.75f, h * 0.62f)
                    )
                }

                // Subtle block captions overlaid cleanly
                Text(
                    text = "OLD COMPLEX",
                    fontFamily = MonoFontFamily,
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = CampusCrimson,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(start = 34.dp, top = 28.dp)
                )
                Text(
                    text = "NEW COMPLEX",
                    fontFamily = MonoFontFamily,
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = CampusEmeraldDark,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = 30.dp, bottom = 24.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TelemetryMetricChip(value = "$pinCount", label = "Campus Pins", valueColor = InkBlack, modifier = Modifier.weight(1f))
                TelemetryMetricChip(value = "5", label = "Departments", valueColor = PixelBlue, modifier = Modifier.weight(1f))
                TelemetryMetricChip(value = "7", label = "Bus Routes", valueColor = CampusEmeraldDark, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun TelemetryMetricChip(
    value: String,
    label: String,
    valueColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = PorcelainCanvas,
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 6.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                fontFamily = DisplayFontFamily,
                fontSize = 16.sp,
                fontWeight = FontWeight.ExtraBold,
                color = valueColor
            )
            Text(
                text = label,
                fontFamily = BodyFontFamily,
                fontSize = 10.5.sp,
                color = SlateGray
            )
        }
    }
}

@Composable
private fun PillarModuleCard(
    eyebrow: String,
    title: String,
    description: String,
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    ctaLabel: String,
    testTag: String,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureSurface),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, MistOutline),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag(testTag)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = iconBg,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.size(42.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = iconTint,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                Text(
                    text = eyebrow,
                    fontFamily = MonoFontFamily,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = SlateGray
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                fontFamily = DisplayFontFamily,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = InkBlack
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                fontFamily = BodyFontFamily,
                fontSize = 12.5.sp,
                lineHeight = 18.sp,
                color = SlateGray
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = ctaLabel,
                    fontFamily = DisplayFontFamily,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = PixelBlue
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = null,
                    tint = PixelBlue,
                    modifier = Modifier.size(15.dp)
                )
            }
        }
    }
}

@Composable
private fun CampusZoneOverviewCard(
    badge: String,
    title: String,
    summary: String,
    containerColor: Color,
    borderColor: Color,
    badgeBg: Color,
    badgeTint: Color,
    actionLabel: String,
    testTag: String,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(22.dp),
        border = BorderStroke(1.dp, borderColor),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag(testTag)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Surface(color = badgeBg, shape = RoundedCornerShape(50)) {
                Text(
                    text = badge,
                    fontFamily = MonoFontFamily,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = badgeTint,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = title,
                fontFamily = DisplayFontFamily,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = InkBlack
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = summary,
                fontFamily = BodyFontFamily,
                fontSize = 12.5.sp,
                lineHeight = 18.sp,
                color = SlateGray
            )
            Spacer(modifier = Modifier.height(12.dp))
            Surface(color = PureSurface, shape = RoundedCornerShape(50)) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = actionLabel,
                        fontFamily = DisplayFontFamily,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = InkBlack
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = null,
                        tint = PixelBlue,
                        modifier = Modifier.size(13.dp)
                    )
                }
            }
        }
    }
}

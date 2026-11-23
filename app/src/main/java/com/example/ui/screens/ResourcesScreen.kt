package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Launch
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.AcademicResource
import com.example.data.model.BusPointRoute
import com.example.data.model.CampusNotice
import com.example.data.model.FacultyMember
import com.example.ui.MainViewModel
import com.example.ui.theme.BodyFontFamily
import com.example.ui.theme.CampusCrimson
import com.example.ui.theme.CampusCrimsonBorder
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
import com.example.ui.theme.SoftOutline
import com.example.ui.theme.TonalMist

@Composable
fun ResourcesScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val resources by viewModel.repository.resources.collectAsState()
    val busRoutes by viewModel.repository.busPointRoutes.collectAsState()
    val facultyList by viewModel.repository.faculty.collectAsState()
    val notices by viewModel.repository.notices.collectAsState()

    val selectedTabIndex by viewModel.resourcesTabIndex.collectAsState()
    val selectedBusPoint by viewModel.selectedBusPointNumber.collectAsState()

    var busSearchQuery by remember { mutableStateOf("") }
    var facultyQuery by remember { mutableStateOf("") }
    var selectedResource by remember { mutableStateOf<AcademicResource?>(null) }
    var selectedNotice by remember { mutableStateOf<CampusNotice?>(null) }

    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(PorcelainCanvas)
    ) {
        // Minimalist Pixel Header
        Surface(
            color = PureSurface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Text(
                    text = "BBS-UTECH Campus Hub",
                    fontFamily = DisplayFontFamily,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkBlack
                )
                Text(
                    text = "7-Route bus fleet, portals, faculty directory & notices",
                    fontFamily = BodyFontFamily,
                    fontSize = 12.sp,
                    color = SlateGray
                )
            }
        }

        // Sub-tabs
        val tabTitles = listOf("Academic Hub", "Point Buses (7)", "Faculty", "Notices")
        ScrollableTabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = PureSurface,
            contentColor = PixelBlue,
            edgePadding = 12.dp,
            divider = { HorizontalDivider(color = MistOutline) },
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = PixelBlue,
                    height = 3.dp
                )
            },
            modifier = Modifier.testTag("resources_tab_row")
        ) {
            tabTitles.forEachIndexed { index, title ->
                val isSelected = selectedTabIndex == index
                Tab(
                    selected = isSelected,
                    onClick = { viewModel.setResourcesTab(index) },
                    text = {
                        Text(
                            text = title,
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) PixelBlue else SlateGray,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier.testTag("res_subtab_$index")
                )
            }
        }

        when (selectedTabIndex) {
            0 -> AcademicHubView(
                resources = resources,
                onSelectResource = { res ->
                    if (res.id == "res_bus_schedule") {
                        viewModel.setResourcesTab(1)
                    } else {
                        selectedResource = res
                    }
                }
            )
            1 -> PointBusesView(
                busRoutes = busRoutes,
                selectedPoint = selectedBusPoint,
                query = busSearchQuery,
                onSelectPoint = { viewModel.setSelectedBusPoint(it) },
                onQueryChange = { busSearchQuery = it },
                onLocateTransportOffice = {
                    val transportPin = viewModel.repository.getPinById("campus_transport_office")
                    if (transportPin != null) {
                        viewModel.locatePinOutdoor(transportPin)
                    }
                }
            )
            2 -> FacultyDirectoryView(
                facultyList = facultyList,
                query = facultyQuery,
                onQueryChange = { facultyQuery = it },
                onLocateOffice = { pinId -> viewModel.locatePinById(pinId) }
            )
            3 -> NoticeBoardView(
                notices = notices,
                onSelectNotice = { selectedNotice = it }
            )
        }
    }

    // Resource Detail Dialog
    if (selectedResource != null) {
        val res = selectedResource!!
        AlertDialog(
            onDismissRequest = { selectedResource = null },
            containerColor = PureSurface,
            titleContentColor = InkBlack,
            textContentColor = SlateGray,
            shape = RoundedCornerShape(28.dp),
            title = {
                Text(
                    text = res.title,
                    fontFamily = DisplayFontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = InkBlack
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    Surface(
                        color = PixelBlueTint,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = res.category,
                            fontFamily = BodyFontFamily,
                            color = PixelBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = res.details,
                        fontFamily = BodyFontFamily,
                        fontSize = 13.5.sp,
                        lineHeight = 20.sp,
                        color = InkBlack
                    )
                }
            },
            confirmButton = {
                if (res.externalUrl != null) {
                    Button(
                        onClick = {
                            try {
                                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(res.externalUrl))
                                context.startActivity(browserIntent)
                            } catch (_: Exception) {}
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PixelBlue,
                            contentColor = PureWhite
                        ),
                        shape = RoundedCornerShape(50)
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(res.actionText, fontFamily = BodyFontFamily, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    TextButton(onClick = { selectedResource = null }) {
                        Text("Close", fontFamily = BodyFontFamily, color = PixelBlue, fontWeight = FontWeight.SemiBold)
                    }
                }
            },
            dismissButton = {
                if (res.externalUrl != null) {
                    TextButton(onClick = { selectedResource = null }) {
                        Text("Cancel", fontFamily = BodyFontFamily, color = SlateGray)
                    }
                }
            }
        )
    }

    // Notice Detail Dialog
    if (selectedNotice != null) {
        val notice = selectedNotice!!
        AlertDialog(
            onDismissRequest = { selectedNotice = null },
            containerColor = PureSurface,
            titleContentColor = InkBlack,
            textContentColor = SlateGray,
            shape = RoundedCornerShape(28.dp),
            title = {
                Text(
                    text = notice.title,
                    fontFamily = DisplayFontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = InkBlack
                )
            },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = if (notice.isHighPriority) CampusCrimsonTint else PixelBlueTint,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = notice.category,
                                fontFamily = BodyFontFamily,
                                color = if (notice.isHighPriority) CampusCrimson else PixelBlue,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                        Text(
                            text = notice.date,
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            color = MutedGray
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = notice.summary,
                        fontFamily = BodyFontFamily,
                        fontSize = 13.5.sp,
                        lineHeight = 20.sp,
                        color = InkBlack
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedNotice = null },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PixelBlue,
                        contentColor = PureWhite
                    ),
                    shape = RoundedCornerShape(50)
                ) {
                    Text("Got it", fontFamily = BodyFontFamily, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}

@Composable
private fun PointBusesView(
    busRoutes: List<BusPointRoute>,
    selectedPoint: Int?,
    query: String,
    onSelectPoint: (Int?) -> Unit,
    onQueryChange: (String) -> Unit,
    onLocateTransportOffice: () -> Unit
) {
    val q = query.trim().lowercase()
    val filteredRoutes = remember(busRoutes, selectedPoint, q) {
        busRoutes.filter { route ->
            val matchesPoint = selectedPoint == null || route.pointNumber == selectedPoint
            val matchesQuery = q.isEmpty() ||
                route.busTitle.lowercase().contains(q) ||
                route.busNumber.lowercase().contains(q) ||
                route.corridorSummary.lowercase().contains(q) ||
                route.citiesCovered.any { it.lowercase().contains(q) } ||
                route.stops.any {
                    it.stopName.lowercase().contains(q) ||
                        it.cityArea.lowercase().contains(q) ||
                        it.morningPickup.lowercase().contains(q)
                }
            matchesPoint && matchesQuery
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Transport Office Header Banner
        item {
            Spacer(modifier = Modifier.height(12.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = PureSurface),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, MistOutline),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Surface(
                        color = PixelBlueTint,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = "Transport Office • Next to Boys Hostel",
                            fontFamily = BodyFontFamily,
                            color = PixelBlue,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "BBS-UTECH Official 7-Route Bus Fleet",
                        fontFamily = DisplayFontFamily,
                        color = InkBlack,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Points 01–05, Hino (GS-9526) & Coaster (GSF-325) • In-Charge: 0304-3482840",
                        fontFamily = BodyFontFamily,
                        color = SlateGray,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 3.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = CampusEmeraldTint,
                            shape = RoundedCornerShape(50),
                            border = BorderStroke(1.dp, CampusEmeraldBorder),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = null,
                                    tint = CampusEmeraldDark,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "In 08:25 AM • Out 03:30 PM",
                                    fontFamily = MonoFontFamily,
                                    color = CampusEmeraldDark,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        OutlinedButton(
                            onClick = onLocateTransportOffice,
                            border = BorderStroke(1.dp, SoftOutline),
                            shape = RoundedCornerShape(50),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                            modifier = Modifier
                                .height(48.dp)
                                .testTag("bus_tab_locate_office_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Locate Transport Office",
                                tint = PixelBlue,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Map Pin",
                                fontFamily = BodyFontFamily,
                                color = InkBlack,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }

        // City / Stop Search Pill
        item {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = {
                    Text(
                        "Search city or stop (Sukkur, Gambat, Hingorja, Pir Jo Goth...)",
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        color = MutedGray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PixelBlue) },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(
                            onClick = { onQueryChange("") },
                            modifier = Modifier.minimumInteractiveComponentSize()
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Clear bus search", tint = SlateGray)
                        }
                    }
                },
                shape = RoundedCornerShape(50),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = PureSurface,
                    unfocusedContainerColor = PureSurface,
                    focusedTextColor = InkBlack,
                    unfocusedTextColor = InkBlack,
                    focusedBorderColor = PixelBlue,
                    unfocusedBorderColor = MistOutline,
                    cursorColor = PixelBlue
                ),
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("bus_city_search_input")
            )
        }

        // Point 1..5 Filter Pills
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedPoint == null,
                    onClick = { onSelectPoint(null) },
                    label = {
                        Text(
                            "All 7",
                            fontFamily = BodyFontFamily,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    },
                    shape = RoundedCornerShape(50),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = PureSurface,
                        labelColor = SlateGray,
                        selectedContainerColor = PixelBlue,
                        selectedLabelColor = PureWhite
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selectedPoint == null,
                        borderColor = MistOutline,
                        selectedBorderColor = PixelBlue
                    ),
                    modifier = Modifier.testTag("bus_filter_all")
                )
                busRoutes.forEach { route ->
                    val pt = route.pointNumber
                    val isSelected = selectedPoint == pt
                    val chipText = when {
                        pt <= 5 -> "Bus 0$pt"
                        pt == 6 -> "Hino"
                        else -> "Coaster"
                    }
                    FilterChip(
                        selected = isSelected,
                        onClick = { onSelectPoint(if (isSelected) null else pt) },
                        label = {
                            Text(
                                chipText,
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        },
                        shape = RoundedCornerShape(50),
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = PureSurface,
                            labelColor = SlateGray,
                            selectedContainerColor = PixelBlueContainer,
                            selectedLabelColor = OnPixelBlueContainer
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            borderColor = MistOutline,
                            selectedBorderColor = PixelBlueContainer
                        ),
                        modifier = Modifier.testTag("bus_filter_point_$pt")
                    )
                }
            }
        }

        if (filteredRoutes.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = PureSurface),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(1.dp, MistOutline),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.DirectionsBus,
                            contentDescription = null,
                            tint = PixelBlue.copy(alpha = 0.6f),
                            modifier = Modifier.size(38.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "No point route matches \"$query\"",
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = InkBlack
                        )
                        Text(
                            text = "Try Sukkur, Gambat, Hingorja, Ranipur, Pir Jo Goth, Rohri, or Thari Mirwah.",
                            fontFamily = BodyFontFamily,
                            fontSize = 12.5.sp,
                            color = SlateGray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
        } else {
            items(filteredRoutes, key = { it.pointNumber }) { route ->
                BusPointRouteCard(
                    route = route,
                    highlightQuery = q,
                    defaultExpanded = filteredRoutes.size == 1 || q.isNotEmpty() || route.pointNumber == 1 || route.pointNumber == 3
                )
            }
        }

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}

@Composable
private fun BusPointRouteCard(
    route: BusPointRoute,
    highlightQuery: String,
    defaultExpanded: Boolean
) {
    var expanded by remember(route.pointNumber, defaultExpanded) { mutableStateOf(defaultExpanded) }

    Card(
        colors = CardDefaults.cardColors(containerColor = PureSurface),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, if (expanded) PixelBlue.copy(alpha = 0.45f) else MistOutline),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("bus_point_card_${route.pointNumber}")
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = PixelBlue,
                        shape = RoundedCornerShape(50)
                    ) {
                        val badgeLabel = when {
                            route.pointNumber <= 5 -> "Bus No. 0${route.pointNumber}"
                            route.pointNumber == 6 -> "HINO Bus"
                            else -> "City Coaster"
                        }
                        Text(
                            text = badgeLabel,
                            fontFamily = MonoFontFamily,
                            color = PureWhite,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = CampusEmeraldTint,
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(1.dp, CampusEmeraldBorder)
                    ) {
                        Text(
                            text = route.busNumber,
                            fontFamily = MonoFontFamily,
                            color = CampusEmeraldDark,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                        )
                    }
                }

                IconButton(
                    onClick = { expanded = !expanded },
                    modifier = Modifier
                        .minimumInteractiveComponentSize()
                        .testTag("expand_bus_point_${route.pointNumber}")
                ) {
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Collapse route stops" else "Expand route stops",
                        tint = PixelBlue
                    )
                }
            }

            Text(
                text = route.busTitle,
                fontFamily = DisplayFontFamily,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = InkBlack
            )
            Text(
                text = route.corridorSummary,
                fontFamily = BodyFontFamily,
                fontSize = 12.5.sp,
                color = SlateGray,
                modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TonalMist, RoundedCornerShape(16.dp))
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TimingBadgeColumn(label = "Starts", time = route.morningStartTime, accent = InkBlack)
                TimingBadgeColumn(label = "Arrival", time = route.campusArrivalTime, accent = CampusEmeraldDark)
                TimingBadgeColumn(label = "Return", time = route.afternoonDepartureTime, accent = PixelBlue)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                route.citiesCovered.forEach { city ->
                    val isMatchedCity = highlightQuery.isNotEmpty() && city.lowercase().contains(highlightQuery)
                    Surface(
                        color = if (isMatchedCity) CampusEmeraldTint else TonalMist,
                        shape = RoundedCornerShape(50),
                        border = BorderStroke(
                            1.dp,
                            if (isMatchedCity) CampusEmerald else Color.Transparent
                        )
                    ) {
                        Text(
                            text = city,
                            fontFamily = BodyFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isMatchedCity) CampusEmeraldDark else SlateGray,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    HorizontalDivider(color = MistOutline)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Stops Timeline (${route.stops.size})",
                            fontFamily = DisplayFontFamily,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = PixelBlue
                        )
                        Text(
                            text = route.contactPhone,
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CampusEmeraldDark
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    route.stops.forEachIndexed { index, stop ->
                        val isLast = index == route.stops.lastIndex
                        val isMatch = highlightQuery.isNotEmpty() && (
                            stop.stopName.lowercase().contains(highlightQuery) ||
                                stop.cityArea.lowercase().contains(highlightQuery)
                            )

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    if (isMatch) CampusEmeraldTint else Color.Transparent,
                                    RoundedCornerShape(12.dp)
                                )
                                .padding(horizontal = 4.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(
                                        color = when {
                                            index == 0 -> PixelBlue
                                            isLast -> CampusEmerald
                                            else -> TonalMist
                                        },
                                        shape = CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${index + 1}",
                                    fontFamily = MonoFontFamily,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (index == 0 || isLast) PureWhite else SlateGray
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = stop.stopName,
                                    fontFamily = BodyFontFamily,
                                    fontSize = 13.sp,
                                    fontWeight = if (index == 0 || isLast || isMatch) FontWeight.Bold else FontWeight.Medium,
                                    color = InkBlack
                                )
                                Text(
                                    text = if (stop.note.isNotEmpty()) "${stop.cityArea} • ${stop.note}" else stop.cityArea,
                                    fontFamily = BodyFontFamily,
                                    fontSize = 11.sp,
                                    color = SlateGray
                                )
                            }

                            Surface(
                                color = if (isLast) CampusEmeraldTint else TonalMist,
                                shape = RoundedCornerShape(50),
                                border = BorderStroke(
                                    1.dp,
                                    if (isLast) CampusEmeraldBorder else MistOutline
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AccessTime,
                                        contentDescription = null,
                                        tint = if (isLast) CampusEmeraldDark else PixelBlue,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = stop.morningPickup,
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isLast) CampusEmeraldDark else InkBlack
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

@Composable
private fun TimingBadgeColumn(
    label: String,
    time: String,
    accent: Color
) {
    Column {
        Text(
            text = label,
            fontFamily = BodyFontFamily,
            fontSize = 10.5.sp,
            color = MutedGray,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = time,
            fontFamily = MonoFontFamily,
            fontSize = 12.sp,
            color = accent,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun AcademicHubView(
    resources: List<AcademicResource>,
    onSelectResource: (AcademicResource) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(resources) { item ->
            val isTransport = item.category == "Transport"
            val accent = if (isTransport) CampusEmeraldDark else PixelBlue
            val tintBg = if (isTransport) CampusEmeraldTint else PixelBlueTint
            Card(
                colors = CardDefaults.cardColors(containerColor = PureSurface),
                shape = RoundedCornerShape(22.dp),
                border = BorderStroke(1.dp, MistOutline),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectResource(item) }
                    .testTag("resource_item_${item.id}")
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = tintBg,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.size(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            val icon = when (item.category) {
                                "Portals" -> Icons.Default.Launch
                                "Transport" -> Icons.Default.DirectionsBus
                                "Freshmen Guide" -> Icons.Default.HelpOutline
                                else -> Icons.Default.MenuBook
                            }
                            Icon(
                                imageVector = icon,
                                contentDescription = null,
                                tint = accent,
                                modifier = Modifier.size(21.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Surface(
                            color = TonalMist,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = item.category,
                                fontFamily = BodyFontFamily,
                                color = accent,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = item.title,
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.5.sp,
                            color = InkBlack
                        )
                        Text(
                            text = item.description,
                            fontFamily = BodyFontFamily,
                            fontSize = 12.sp,
                            color = SlateGray,
                            maxLines = 2,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MutedGray,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun FacultyDirectoryView(
    facultyList: List<FacultyMember>,
    query: String,
    onQueryChange: (String) -> Unit,
    onLocateOffice: (String) -> Unit
) {
    val filtered = facultyList.filter {
        query.isEmpty() ||
            it.name.contains(query, ignoreCase = true) ||
            it.department.contains(query, ignoreCase = true) ||
            it.designation.contains(query, ignoreCase = true)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            placeholder = { Text("Search professor, chairman or dept...", fontFamily = BodyFontFamily, fontSize = 13.sp, color = MutedGray) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PixelBlue) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(
                        onClick = { onQueryChange("") },
                        modifier = Modifier.minimumInteractiveComponentSize()
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = SlateGray)
                    }
                }
            },
            shape = RoundedCornerShape(50),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = PureSurface,
                unfocusedContainerColor = PureSurface,
                focusedTextColor = InkBlack,
                unfocusedTextColor = InkBlack,
                focusedBorderColor = PixelBlue,
                unfocusedBorderColor = MistOutline,
                cursorColor = PixelBlue
            ),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("faculty_search_input")
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "Faculty Directory (${filtered.size})",
            fontFamily = DisplayFontFamily,
            fontSize = 12.5.sp,
            fontWeight = FontWeight.Bold,
            color = PixelBlue
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filtered) { member ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = PureSurface),
                    shape = RoundedCornerShape(22.dp),
                    border = BorderStroke(1.dp, MistOutline),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("faculty_card_${member.id}")
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = PixelBlueContainer,
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.School,
                                        contentDescription = null,
                                        tint = OnPixelBlueContainer,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = member.name,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkBlack
                                )
                                Text(
                                    text = "${member.designation} • ${member.department}",
                                    fontFamily = BodyFontFamily,
                                    fontSize = 12.sp,
                                    color = SlateGray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Email,
                                contentDescription = null,
                                tint = PixelBlue,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = member.email,
                                fontFamily = BodyFontFamily,
                                fontSize = 11.5.sp,
                                color = InkBlack
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = CampusEmeraldDark,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = member.phoneExt,
                                fontFamily = MonoFontFamily,
                                fontSize = 11.sp,
                                color = SlateGray
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TonalMist, RoundedCornerShape(14.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = member.roomName,
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = InkBlack,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )

                            Surface(
                                color = PixelBlueTint,
                                shape = RoundedCornerShape(50),
                                modifier = Modifier
                                    .clickable { onLocateOffice(member.officePinId) }
                                    .testTag("locate_faculty_${member.id}")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Layers,
                                        contentDescription = null,
                                        tint = PixelBlue,
                                        modifier = Modifier.size(12.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Locate",
                                        fontFamily = BodyFontFamily,
                                        color = PixelBlue,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
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

@Composable
private fun NoticeBoardView(
    notices: List<CampusNotice>,
    onSelectNotice: (CampusNotice) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        items(notices) { notice ->
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (notice.isHighPriority) CampusCrimsonTint else PureSurface
                ),
                shape = RoundedCornerShape(22.dp),
                border = BorderStroke(
                    1.dp,
                    if (notice.isHighPriority) CampusCrimsonBorder else MistOutline
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectNotice(notice) }
                    .testTag("notice_item_${notice.id}")
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = if (notice.isHighPriority) CampusCrimson else PixelBlueTint,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = if (notice.isHighPriority) "Priority Notice" else notice.category,
                                fontFamily = BodyFontFamily,
                                color = if (notice.isHighPriority) PureWhite else PixelBlue,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp)
                            )
                        }

                        Text(
                            text = notice.date,
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            color = MutedGray
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = notice.title,
                        fontFamily = DisplayFontFamily,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkBlack
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = notice.summary,
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        color = SlateGray,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

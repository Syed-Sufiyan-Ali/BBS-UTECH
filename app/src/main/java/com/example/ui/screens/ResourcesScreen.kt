package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CutCornerShape
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
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
import com.example.ui.theme.AshGray
import com.example.ui.theme.CarbonSurface
import com.example.ui.theme.DisplayFontFamily
import com.example.ui.theme.GraphiteBorder
import com.example.ui.theme.MonoFontFamily
import com.example.ui.theme.NeonGreen
import com.example.ui.theme.NeonGreenTint
import com.example.ui.theme.ObsidianSurface
import com.example.ui.theme.PureWhite
import com.example.ui.theme.SportsRed
import com.example.ui.theme.SportsRedTint
import com.example.ui.theme.SteelGray
import com.example.ui.theme.VoidBlack

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
            .background(VoidBlack)
    ) {
        // Minimalist Punk Header
        Surface(
            color = VoidBlack,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .drawBehind {
                        drawLine(
                            color = SportsRed,
                            start = Offset(0f, 0f),
                            end = Offset(size.width * 0.4f, 0f),
                            strokeWidth = 5f
                        )
                    }
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Text(
                    text = "BBSUTSD // CAMPUS HUB",
                    fontFamily = DisplayFontFamily,
                    fontSize = 18.sp,
                    letterSpacing = 0.8.sp,
                    fontWeight = FontWeight.Bold,
                    color = PureWhite
                )
                Text(
                    text = "5-POINT BUSES • PORTALS • FACULTY • BULLETINS",
                    fontFamily = MonoFontFamily,
                    fontSize = 10.sp,
                    color = NeonGreen
                )
            }
        }

        // Sub-tabs
        val tabTitles = listOf("ACADEMIC HUB", "POINT BUSES (1–5)", "FACULTY", "NOTICES")
        ScrollableTabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = ObsidianSurface,
            contentColor = PureWhite,
            edgePadding = 12.dp,
            divider = { HorizontalDivider(color = GraphiteBorder) },
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = SportsRed,
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
                            color = if (isSelected) SportsRed else AshGray,
                            fontSize = 12.sp,
                            letterSpacing = 0.5.sp
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
            containerColor = ObsidianSurface,
            titleContentColor = PureWhite,
            textContentColor = AshGray,
            shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
            title = {
                Text(
                    text = res.title,
                    fontFamily = DisplayFontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = PureWhite
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    Surface(
                        color = SportsRedTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, SportsRed)
                    ) {
                        Text(
                            text = res.category.uppercase(),
                            fontFamily = MonoFontFamily,
                            color = SportsRed,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = res.details,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                        color = PureWhite.copy(alpha = 0.9f)
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
                            containerColor = SportsRed,
                            contentColor = PureWhite
                        ),
                        shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp)
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(res.actionText.uppercase(), fontFamily = DisplayFontFamily, fontWeight = FontWeight.Bold)
                    }
                } else {
                    TextButton(onClick = { selectedResource = null }) {
                        Text("CLOSE", fontFamily = MonoFontFamily, color = NeonGreen, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                if (res.externalUrl != null) {
                    TextButton(onClick = { selectedResource = null }) {
                        Text("CANCEL", fontFamily = MonoFontFamily, color = AshGray)
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
            containerColor = ObsidianSurface,
            titleContentColor = PureWhite,
            textContentColor = AshGray,
            shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
            title = {
                Text(
                    text = notice.title,
                    fontFamily = DisplayFontFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = PureWhite
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
                            color = if (notice.isHighPriority) SportsRedTint else NeonGreenTint,
                            shape = CutCornerShape(4.dp),
                            border = BorderStroke(1.dp, if (notice.isHighPriority) SportsRed else NeonGreen)
                        ) {
                            Text(
                                text = notice.category.uppercase(),
                                fontFamily = MonoFontFamily,
                                color = if (notice.isHighPriority) SportsRed else NeonGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                        Text(
                            text = notice.date,
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
                            color = AshGray
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = notice.summary,
                        fontSize = 13.sp,
                        lineHeight = 20.sp,
                        color = PureWhite.copy(alpha = 0.9f)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { selectedNotice = null },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SportsRed,
                        contentColor = PureWhite
                    ),
                    shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp)
                ) {
                    Text("UNDERSTOOD", fontFamily = DisplayFontFamily, fontWeight = FontWeight.Bold)
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
                colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
                border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.75f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .drawBehind {
                            drawLine(
                                color = SportsRed,
                                start = Offset(0f, 0f),
                                end = Offset(0f, size.height),
                                strokeWidth = 8f
                            )
                        }
                        .padding(14.dp)
                ) {
                    Surface(
                        color = SportsRedTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, SportsRed)
                    ) {
                        Text(
                            text = "TRANSPORT OFFICE // NEXT TO BOYS HOSTEL",
                            fontFamily = MonoFontFamily,
                            color = SportsRed,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "BBSUTSD 5-POINT BUS FLEET",
                        fontFamily = DisplayFontFamily,
                        color = PureWhite,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "In-Charge: Engr. Sameeullah Khan / Imran Gilal (0304-3482840)",
                        color = AshGray,
                        fontSize = 11.5.sp,
                        modifier = Modifier.padding(top = 2.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = NeonGreenTint,
                            shape = CutCornerShape(6.dp),
                            border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.55f)),
                            modifier = Modifier.weight(1f)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(15.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "IN 08:25 AM • OUT 03:30 PM",
                                    fontFamily = MonoFontFamily,
                                    color = NeonGreen,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        OutlinedButton(
                            onClick = onLocateTransportOffice,
                            border = BorderStroke(1.5.dp, NeonGreen),
                            shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                            modifier = Modifier
                                .height(48.dp)
                                .testTag("bus_tab_locate_office_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = "Locate Transport Office",
                                tint = NeonGreen,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "MAP PIN",
                                fontFamily = MonoFontFamily,
                                color = NeonGreen,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // City / Stop Search Box
        item {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                placeholder = {
                    Text(
                        "Search city or stop (Sukkur, Gambat, Hingorja, Pir Jo Goth...)",
                        fontSize = 12.sp,
                        color = SteelGray,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = SportsRed) },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(onClick = { onQueryChange("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear bus search", tint = PureWhite)
                        }
                    }
                },
                shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = CarbonSurface,
                    unfocusedContainerColor = ObsidianSurface,
                    focusedTextColor = PureWhite,
                    unfocusedTextColor = PureWhite,
                    focusedBorderColor = SportsRed,
                    unfocusedBorderColor = GraphiteBorder,
                    cursorColor = NeonGreen
                ),
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("bus_city_search_input")
            )
        }

        // Point 1..5 Filter Chips
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
                            "ALL 5 POINTS",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    shape = CutCornerShape(6.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = ObsidianSurface,
                        labelColor = AshGray,
                        selectedContainerColor = SportsRed,
                        selectedLabelColor = PureWhite
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selectedPoint == null,
                        borderColor = GraphiteBorder,
                        selectedBorderColor = SportsRed
                    ),
                    modifier = Modifier.testTag("bus_filter_all")
                )
                (1..5).forEach { pt ->
                    val isSelected = selectedPoint == pt
                    FilterChip(
                        selected = isSelected,
                        onClick = { onSelectPoint(if (isSelected) null else pt) },
                        label = {
                            Text(
                                "POINT $pt",
                                fontFamily = MonoFontFamily,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        shape = CutCornerShape(6.dp),
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = ObsidianSurface,
                            labelColor = AshGray,
                            selectedContainerColor = NeonGreen,
                            selectedLabelColor = VoidBlack
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            borderColor = GraphiteBorder,
                            selectedBorderColor = NeonGreen
                        ),
                        modifier = Modifier.testTag("bus_filter_point_$pt")
                    )
                }
            }
        }

        if (filteredRoutes.isEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                    shape = CutCornerShape(topEnd = 14.dp, bottomStart = 14.dp),
                    border = BorderStroke(1.dp, GraphiteBorder),
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
                            tint = SportsRed.copy(alpha = 0.7f),
                            modifier = Modifier.size(38.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "NO POINT ROUTE MATCHES \"$query\"",
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = PureWhite
                        )
                        Text(
                            text = "Try Sukkur, Gambat, Hingorja, Ranipur, Pir Jo Goth, Rohri, or Thari Mirwah.",
                            fontSize = 12.sp,
                            color = AshGray,
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
        colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
        shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
        border = BorderStroke(1.dp, if (expanded) SportsRed.copy(alpha = 0.6f) else GraphiteBorder),
        modifier = Modifier
            .fillMaxWidth()
            .testTag("bus_point_card_${route.pointNumber}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
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
                        color = SportsRed,
                        shape = CutCornerShape(4.dp)
                    ) {
                        Text(
                            text = "POINT 0${route.pointNumber}",
                            fontFamily = MonoFontFamily,
                            color = PureWhite,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        color = NeonGreenTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.6f))
                    ) {
                        Text(
                            text = route.busNumber,
                            fontFamily = MonoFontFamily,
                            color = NeonGreen,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                IconButton(
                    onClick = { expanded = !expanded },
                    modifier = Modifier.testTag("expand_bus_point_${route.pointNumber}")
                ) {
                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Collapse route stops" else "Expand route stops",
                        tint = NeonGreen
                    )
                }
            }

            Text(
                text = route.busTitle,
                fontFamily = DisplayFontFamily,
                fontSize = 15.5.sp,
                fontWeight = FontWeight.Bold,
                color = PureWhite
            )
            Text(
                text = route.corridorSummary,
                fontSize = 12.sp,
                color = AshGray,
                modifier = Modifier.padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(CarbonSurface, CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp))
                    .border(1.dp, GraphiteBorder, CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp))
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                TimingBadgeColumn(label = "STARTS", time = route.morningStartTime, accent = PureWhite)
                TimingBadgeColumn(label = "ARRIVAL", time = route.campusArrivalTime, accent = NeonGreen)
                TimingBadgeColumn(label = "RETURN", time = route.afternoonDepartureTime, accent = SportsRed)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                route.citiesCovered.forEach { city ->
                    val isMatchedCity = highlightQuery.isNotEmpty() && city.lowercase().contains(highlightQuery)
                    Surface(
                        color = if (isMatchedCity) NeonGreenTint else CarbonSurface,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(
                            1.dp,
                            if (isMatchedCity) NeonGreen else GraphiteBorder
                        )
                    ) {
                        Text(
                            text = city.uppercase(),
                            fontFamily = MonoFontFamily,
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isMatchedCity) NeonGreen else AshGray,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 12.dp)) {
                    HorizontalDivider(color = GraphiteBorder)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "STOPS TIMELINE (${route.stops.size})",
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = SportsRed
                        )
                        Text(
                            text = route.contactPhone,
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonGreen
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
                                    if (isMatch) NeonGreenTint else Color.Transparent,
                                    CutCornerShape(4.dp)
                                )
                                .padding(horizontal = 4.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(22.dp)
                                    .background(
                                        color = when {
                                            index == 0 -> SportsRed
                                            isLast -> NeonGreen
                                            else -> CarbonSurface
                                        },
                                        shape = CutCornerShape(4.dp)
                                    )
                                    .border(
                                        1.dp,
                                        when {
                                            index == 0 -> SportsRed
                                            isLast -> NeonGreen
                                            else -> GraphiteBorder
                                        },
                                        CutCornerShape(4.dp)
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${index + 1}",
                                    fontFamily = MonoFontFamily,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = when {
                                        index == 0 -> PureWhite
                                        isLast -> VoidBlack
                                        else -> AshGray
                                    }
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = stop.stopName,
                                    fontSize = 12.5.sp,
                                    fontWeight = if (index == 0 || isLast || isMatch) FontWeight.Bold else FontWeight.Medium,
                                    color = PureWhite
                                )
                                Text(
                                    text = if (stop.note.isNotEmpty()) "${stop.cityArea} • ${stop.note}" else stop.cityArea,
                                    fontSize = 10.5.sp,
                                    color = AshGray
                                )
                            }

                            Surface(
                                color = if (isLast) NeonGreenTint else CarbonSurface,
                                shape = CutCornerShape(4.dp),
                                border = BorderStroke(
                                    1.dp,
                                    if (isLast) NeonGreen.copy(alpha = 0.7f) else GraphiteBorder
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AccessTime,
                                        contentDescription = null,
                                        tint = if (isLast) NeonGreen else SportsRed,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = stop.morningPickup,
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isLast) NeonGreen else PureWhite
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
            fontFamily = MonoFontFamily,
            fontSize = 9.sp,
            color = SteelGray,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = time,
            fontFamily = MonoFontFamily,
            fontSize = 11.5.sp,
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
            val accent = if (item.category == "Transport") NeonGreen else SportsRed
            Card(
                colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                border = BorderStroke(1.dp, GraphiteBorder),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectResource(item) }
                    .testTag("resource_item_${item.id}")
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = accent.copy(alpha = 0.14f),
                        shape = CutCornerShape(6.dp),
                        border = BorderStroke(1.dp, accent.copy(alpha = 0.6f)),
                        modifier = Modifier.size(42.dp)
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
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Surface(
                            color = CarbonSurface,
                            shape = CutCornerShape(4.dp),
                            border = BorderStroke(1.dp, GraphiteBorder)
                        ) {
                            Text(
                                text = item.category.uppercase(),
                                fontFamily = MonoFontFamily,
                                color = accent,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(5.dp))
                        Text(
                            text = item.title,
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = PureWhite
                        )
                        Text(
                            text = item.description,
                            fontSize = 11.5.sp,
                            color = AshGray,
                            maxLines = 2,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = AshGray,
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
            placeholder = { Text("Search professor, chairman or dept...", fontSize = 13.sp, color = SteelGray) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = SportsRed) },
            trailingIcon = {
                if (query.isNotEmpty()) {
                    IconButton(onClick = { onQueryChange("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = PureWhite)
                    }
                }
            },
            shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = CarbonSurface,
                unfocusedContainerColor = ObsidianSurface,
                focusedTextColor = PureWhite,
                unfocusedTextColor = PureWhite,
                focusedBorderColor = SportsRed,
                unfocusedBorderColor = GraphiteBorder,
                cursorColor = NeonGreen
            ),
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("faculty_search_input")
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "FACULTY DIRECTORY (${filtered.size})",
            fontFamily = MonoFontFamily,
            fontSize = 10.5.sp,
            fontWeight = FontWeight.Bold,
            color = NeonGreen
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(filtered) { member ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                    shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                    border = BorderStroke(1.dp, GraphiteBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("faculty_card_${member.id}")
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = SportsRedTint,
                                shape = CutCornerShape(6.dp),
                                border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.6f)),
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Default.School,
                                        contentDescription = null,
                                        tint = SportsRed,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = member.name,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 14.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PureWhite
                                )
                                Text(
                                    text = "${member.designation} • ${member.department}",
                                    fontSize = 11.sp,
                                    color = AshGray
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Email,
                                contentDescription = null,
                                tint = NeonGreen,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = member.email,
                                fontSize = 11.sp,
                                color = PureWhite.copy(alpha = 0.9f)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = SportsRed,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = member.phoneExt,
                                fontFamily = MonoFontFamily,
                                fontSize = 10.5.sp,
                                color = PureWhite.copy(alpha = 0.9f)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CarbonSurface, CutCornerShape(6.dp))
                                .border(1.dp, GraphiteBorder, CutCornerShape(6.dp))
                                .padding(horizontal = 10.dp, vertical = 6.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = member.roomName,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Medium,
                                color = PureWhite,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )

                            Surface(
                                color = SportsRed,
                                shape = CutCornerShape(4.dp),
                                modifier = Modifier
                                    .clickable { onLocateOffice(member.officePinId) }
                                    .testTag("locate_faculty_${member.id}")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Layers,
                                        contentDescription = null,
                                        tint = PureWhite,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "LOCATE",
                                        fontFamily = MonoFontFamily,
                                        color = PureWhite,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
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
                    containerColor = if (notice.isHighPriority) SportsRedTint else ObsidianSurface
                ),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                border = BorderStroke(
                    1.dp,
                    if (notice.isHighPriority) SportsRed else GraphiteBorder
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onSelectNotice(notice) }
                    .testTag("notice_item_${notice.id}")
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = if (notice.isHighPriority) SportsRed else NeonGreenTint,
                            shape = CutCornerShape(4.dp),
                            border = BorderStroke(
                                1.dp,
                                if (notice.isHighPriority) SportsRed else NeonGreen
                            )
                        ) {
                            Text(
                                text = if (notice.isHighPriority) "URGENT NOTICE" else notice.category.uppercase(),
                                fontFamily = MonoFontFamily,
                                color = if (notice.isHighPriority) PureWhite else NeonGreen,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                            )
                        }

                        Text(
                            text = notice.date,
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
                            color = AshGray
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = notice.title,
                        fontFamily = DisplayFontFamily,
                        fontSize = 14.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = PureWhite
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = notice.summary,
                        fontSize = 12.sp,
                        color = AshGray,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

package com.example.ui.screens

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.BusPointRoute
import com.example.ui.MainViewModel
import com.example.ui.theme.BodyFontFamily
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
fun BusesScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val busRoutes by viewModel.repository.busPointRoutes.collectAsState()
    val selectedBusPoint by viewModel.selectedBusPointNumber.collectAsState()
    var busSearchQuery by remember { mutableStateOf("") }

    val q = busSearchQuery.trim().lowercase()
    val filteredRoutes = remember(busRoutes, selectedBusPoint, q) {
        busRoutes.filter { route ->
            val matchesPoint = selectedBusPoint == null || route.pointNumber == selectedBusPoint
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
                    text = "Bus & Coaster Timetables",
                    fontFamily = DisplayFontFamily,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkBlack
                )
                Text(
                    text = "BBS-UTECH Official 7-Route Morning Transport Fleet",
                    fontFamily = BodyFontFamily,
                    fontSize = 12.sp,
                    color = SlateGray
                )
            }
        }
        HorizontalDivider(color = MistOutline)

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
                            text = "Bus 01–05, Hino (GS-9526) & Coaster (GSF-325) • In-Charge: 0304-3482840",
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
                                onClick = {
                                    val transportPin = viewModel.repository.getPinById("campus_transport_office")
                                    if (transportPin != null) {
                                        viewModel.locatePinOutdoor(transportPin)
                                    }
                                },
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
                    value = busSearchQuery,
                    onValueChange = { busSearchQuery = it },
                    placeholder = {
                        Text(
                            "Search city or stop (Sukkur, Gambat, Hingorja, Thari Mirwah...)",
                            fontFamily = BodyFontFamily,
                            fontSize = 12.5.sp,
                            color = MutedGray,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = PixelBlue) },
                    trailingIcon = {
                        if (busSearchQuery.isNotEmpty()) {
                            IconButton(
                                onClick = { busSearchQuery = "" },
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

            // All 7 Routes Filter Pills
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedBusPoint == null,
                        onClick = { viewModel.setSelectedBusPoint(null) },
                        label = {
                            Text(
                                "All 7 Routes",
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
                            selected = selectedBusPoint == null,
                            borderColor = MistOutline,
                            selectedBorderColor = PixelBlue
                        ),
                        modifier = Modifier.testTag("bus_filter_all")
                    )
                    busRoutes.forEach { route ->
                        val pt = route.pointNumber
                        val isSelected = selectedBusPoint == pt
                        val chipText = when {
                            pt <= 5 -> "Bus 0$pt"
                            pt == 6 -> "Hino (GS-9526)"
                            else -> "Coaster (GSF-325)"
                        }
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.setSelectedBusPoint(if (isSelected) null else pt) },
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
                                text = "No route matches \"$busSearchQuery\"",
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
                        defaultExpanded = true
                    )
                }
            }

            item { Spacer(modifier = Modifier.height(20.dp)) }
        }
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
                            text = "${route.driverOrIncharge} • ${route.contactPhone}",
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = CampusEmeraldDark,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
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

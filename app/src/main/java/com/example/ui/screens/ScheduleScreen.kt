package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import com.example.ui.theme.TonalMist
import java.util.Calendar

@Composable
fun ScheduleScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val classes by viewModel.filteredClasses.collectAsState()
    val selectedDept by viewModel.selectedDept.collectAsState()
    val selectedSemester by viewModel.selectedSemester.collectAsState()
    val selectedSection by viewModel.selectedSection.collectAsState()
    val selectedDay by viewModel.selectedDay.collectAsState()

    val savedDept by viewModel.repository.savedDept.collectAsState()
    val savedSemester by viewModel.repository.savedSemester.collectAsState()
    val savedSection by viewModel.repository.savedSection.collectAsState()

    val isCurrentSaved = selectedDept == savedDept &&
        selectedSemester == savedSemester &&
        selectedSection == savedSection

    val departments = listOf(
        "Computer Systems Engineering" to "CSE",
        "Electrical Engineering" to "EE",
        "Civil Engineering" to "CE",
        "Mechanical Engineering" to "ME",
        "Petroleum & Gas Tech" to "PGE"
    )

    val daysOfWeek = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")

    val calendar = Calendar.getInstance()
    val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(PorcelainCanvas)
    ) {
        // Pixel Header
        Surface(
            color = PureSurface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Class Schedule",
                        fontFamily = DisplayFontFamily,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkBlack
                    )
                    Text(
                        text = "BBS-UTECH • Fall 2026 Timetable",
                        fontFamily = BodyFontFamily,
                        fontSize = 12.sp,
                        color = SlateGray
                    )
                }

                Surface(
                    color = if (isCurrentSaved) CampusEmeraldTint else PixelBlueContainer,
                    shape = RoundedCornerShape(50),
                    border = BorderStroke(
                        1.dp,
                        if (isCurrentSaved) CampusEmeraldBorder else PixelBlueContainer
                    ),
                    modifier = Modifier
                        .clickable {
                            viewModel.saveMySchedulePreference(selectedDept, selectedSemester, selectedSection)
                        }
                        .testTag("button_bookmark_schedule")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (isCurrentSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                            contentDescription = "Bookmark",
                            tint = if (isCurrentSaved) CampusEmeraldDark else OnPixelBlueContainer,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isCurrentSaved) "My Timetable" else "Save Mine",
                            fontFamily = BodyFontFamily,
                            color = if (isCurrentSaved) CampusEmeraldDark else OnPixelBlueContainer,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Surface(
                color = CampusEmeraldTint,
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, CampusEmeraldBorder),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 10.dp)
                    .clickable { viewModel.openBusTimings() }
                    .testTag("schedule_open_bus_timetables")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsBus,
                            contentDescription = null,
                            tint = CampusEmeraldDark,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Bus 01–05, Hino & Coaster Timetables (7)",
                            fontFamily = DisplayFontFamily,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = CampusEmeraldDark
                        )
                    }
                    Text(
                        text = "View All",
                        fontFamily = BodyFontFamily,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = PixelBlue
                    )
                }
            }
        }

        // Department Tabs
        val selectedDeptIndex = departments.indexOfFirst { it.first == selectedDept }.coerceAtLeast(0)
        ScrollableTabRow(
            selectedTabIndex = selectedDeptIndex,
            containerColor = PureSurface,
            contentColor = PixelBlue,
            edgePadding = 12.dp,
            divider = { HorizontalDivider(color = MistOutline) },
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedDeptIndex]),
                    color = PixelBlue,
                    height = 3.dp
                )
            },
            modifier = Modifier.testTag("schedule_department_tabs")
        ) {
            departments.forEach { (fullName, shortCode) ->
                val isSelected = selectedDept == fullName
                Tab(
                    selected = isSelected,
                    onClick = {
                        viewModel.setScheduleFilter(fullName, selectedSemester, selectedSection, selectedDay)
                    },
                    text = {
                        Text(
                            text = shortCode,
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) PixelBlue else SlateGray,
                            fontSize = 13.5.sp
                        )
                    },
                    modifier = Modifier.testTag("tab_dept_$shortCode")
                )
            }
        }

        // Semester & Section Pill Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "Sem",
                fontFamily = BodyFontFamily,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = MutedGray
            )

            (1..4).forEach { sem ->
                FilterChip(
                    selected = selectedSemester == sem,
                    onClick = {
                        viewModel.setScheduleFilter(selectedDept, sem, selectedSection, selectedDay)
                    },
                    label = {
                        Text(
                            "S$sem",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.5.sp,
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
                        selected = selectedSemester == sem,
                        borderColor = MistOutline,
                        selectedBorderColor = PixelBlue
                    ),
                    modifier = Modifier.testTag("chip_sem_$sem")
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            listOf("A", "B").forEach { sec ->
                FilterChip(
                    selected = selectedSection == sec,
                    onClick = {
                        viewModel.setScheduleFilter(selectedDept, selectedSemester, sec, selectedDay)
                    },
                    label = {
                        Text(
                            "Sec $sec",
                            fontFamily = BodyFontFamily,
                            fontSize = 11.5.sp,
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
                        selected = selectedSection == sec,
                        borderColor = MistOutline,
                        selectedBorderColor = PixelBlueContainer
                    ),
                    modifier = Modifier.testTag("chip_sec_$sec")
                )
            }
        }

        // Day Selector Pill Strip
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            daysOfWeek.forEach { day ->
                val isSelected = selectedDay.equals(day, ignoreCase = true)
                Surface(
                    color = if (isSelected) PixelBlueContainer else PureSurface,
                    shape = RoundedCornerShape(50),
                    border = BorderStroke(1.dp, if (isSelected) PixelBlueContainer else MistOutline),
                    modifier = Modifier
                        .clickable {
                            viewModel.setScheduleFilter(selectedDept, selectedSemester, selectedSection, day)
                        }
                        .testTag("day_tab_$day")
                ) {
                    Text(
                        text = day.take(3),
                        fontFamily = BodyFontFamily,
                        color = if (isSelected) OnPixelBlueContainer else SlateGray,
                        fontSize = 12.5.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Classes List
        if (classes.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = PixelBlue.copy(alpha = 0.55f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No sessions on $selectedDay",
                        fontFamily = DisplayFontFamily,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkBlack
                    )
                    Text(
                        text = "Use this slot for Central Library or workshop hours.",
                        fontFamily = BodyFontFamily,
                        fontSize = 13.sp,
                        color = SlateGray,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 6.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(classes) { item ->
                    val isOngoing = item.startMinutes <= currentMinutes && item.endMinutes >= currentMinutes
                    val isUpcoming = item.startMinutes > currentMinutes

                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isOngoing) CampusEmeraldTint else PureSurface
                        ),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(
                            if (isOngoing) 1.5.dp else 1.dp,
                            if (isOngoing) CampusEmerald else MistOutline
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("class_card_${item.subjectCode}")
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        color = if (item.isLab) CampusEmeraldTint else PixelBlueContainer,
                                        shape = RoundedCornerShape(50)
                                    ) {
                                        Text(
                                            text = item.subjectCode,
                                            fontFamily = MonoFontFamily,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            color = if (item.isLab) CampusEmeraldDark else OnPixelBlueContainer,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                        )
                                    }
                                    if (item.isLab) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            color = TonalMist,
                                            shape = RoundedCornerShape(50)
                                        ) {
                                            Text(
                                                text = "Lab",
                                                fontFamily = BodyFontFamily,
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 10.5.sp,
                                                color = SlateGray,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }
                                    }
                                }

                                if (isOngoing) {
                                    Surface(
                                        color = CampusEmerald,
                                        shape = RoundedCornerShape(50)
                                    ) {
                                        Text(
                                            text = "Live Now",
                                            fontFamily = BodyFontFamily,
                                            color = PureWhite,
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                        )
                                    }
                                } else if (isUpcoming) {
                                    Text(
                                        text = "Upcoming",
                                        fontFamily = BodyFontFamily,
                                        color = PixelBlue,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = item.subjectTitle,
                                fontFamily = DisplayFontFamily,
                                fontSize = 16.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkBlack
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AccessTime,
                                    contentDescription = null,
                                    tint = PixelBlue,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = item.timeSlot,
                                    fontFamily = MonoFontFamily,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = InkBlack
                                )

                                Spacer(modifier = Modifier.width(14.dp))

                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MutedGray,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = item.instructor,
                                    fontFamily = BodyFontFamily,
                                    fontSize = 12.5.sp,
                                    color = SlateGray,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(TonalMist, RoundedCornerShape(16.dp))
                                    .padding(horizontal = 12.dp, vertical = 9.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOn,
                                        contentDescription = null,
                                        tint = PixelBlue,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = item.roomLabel,
                                        fontFamily = BodyFontFamily,
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = InkBlack,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Surface(
                                    color = PixelBlueTint,
                                    shape = RoundedCornerShape(50),
                                    modifier = Modifier
                                        .clickable { viewModel.locatePinById(item.locationPinId) }
                                        .testTag("locate_room_${item.subjectCode}")
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Layers,
                                            contentDescription = null,
                                            tint = PixelBlue,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "Locate",
                                            fontFamily = BodyFontFamily,
                                            color = PixelBlue,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

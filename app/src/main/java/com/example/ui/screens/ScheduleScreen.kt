package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarMonth
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
            .background(VoidBlack)
    ) {
        // Header
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
                            end = Offset(size.width * 0.35f, 0f),
                            strokeWidth = 5f
                        )
                    }
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "CLASS SCHEDULE",
                            fontFamily = DisplayFontFamily,
                            fontSize = 18.sp,
                            letterSpacing = 0.8.sp,
                            fontWeight = FontWeight.Bold,
                            color = PureWhite
                        )
                        Text(
                            text = "BBSUTSD // FALL 2026 TIMETABLE",
                            fontFamily = MonoFontFamily,
                            fontSize = 10.sp,
                            color = NeonGreen
                        )
                    }

                    Surface(
                        color = if (isCurrentSaved) NeonGreen else CarbonSurface,
                        shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
                        border = BorderStroke(
                            1.dp,
                            if (isCurrentSaved) NeonGreen else SportsRed
                        ),
                        modifier = Modifier
                            .clickable {
                                viewModel.saveMySchedulePreference(selectedDept, selectedSemester, selectedSection)
                            }
                            .testTag("button_bookmark_schedule")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (isCurrentSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                                contentDescription = "Bookmark",
                                tint = if (isCurrentSaved) VoidBlack else SportsRed,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = if (isCurrentSaved) "MY TIMETABLE" else "SAVE MINE",
                                fontFamily = MonoFontFamily,
                                color = if (isCurrentSaved) VoidBlack else PureWhite,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Department Tabs
        val selectedDeptIndex = departments.indexOfFirst { it.first == selectedDept }.coerceAtLeast(0)
        ScrollableTabRow(
            selectedTabIndex = selectedDeptIndex,
            containerColor = ObsidianSurface,
            contentColor = PureWhite,
            edgePadding = 12.dp,
            divider = { HorizontalDivider(color = GraphiteBorder) },
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedDeptIndex]),
                    color = SportsRed,
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
                            color = if (isSelected) SportsRed else AshGray,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier.testTag("tab_dept_$shortCode")
                )
            }
        }

        // Semester & Section Chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "SEM:",
                fontFamily = MonoFontFamily,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = SteelGray
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
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    shape = CutCornerShape(6.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = CarbonSurface,
                        labelColor = AshGray,
                        selectedContainerColor = SportsRed,
                        selectedLabelColor = PureWhite
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selectedSemester == sem,
                        borderColor = GraphiteBorder,
                        selectedBorderColor = SportsRed
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
                            "SEC $sec",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    shape = CutCornerShape(6.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        containerColor = CarbonSurface,
                        labelColor = AshGray,
                        selectedContainerColor = NeonGreen,
                        selectedLabelColor = VoidBlack
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = selectedSection == sec,
                        borderColor = GraphiteBorder,
                        selectedBorderColor = NeonGreen
                    ),
                    modifier = Modifier.testTag("chip_sec_$sec")
                )
            }
        }

        // Day Selector Strip
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            daysOfWeek.forEach { day ->
                val isSelected = selectedDay.equals(day, ignoreCase = true)
                Surface(
                    color = if (isSelected) SportsRed else ObsidianSurface,
                    shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
                    border = BorderStroke(1.dp, if (isSelected) SportsRed else GraphiteBorder),
                    modifier = Modifier
                        .clickable {
                            viewModel.setScheduleFilter(selectedDept, selectedSemester, selectedSection, day)
                        }
                        .testTag("day_tab_$day")
                ) {
                    Text(
                        text = day.take(3).uppercase(),
                        fontFamily = DisplayFontFamily,
                        color = if (isSelected) PureWhite else AshGray,
                        fontSize = 12.sp,
                        letterSpacing = 0.7.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

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
                        tint = SportsRed.copy(alpha = 0.6f),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "NO SESSIONS ON ${selectedDay.uppercase()}",
                        fontFamily = DisplayFontFamily,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = PureWhite
                    )
                    Text(
                        text = "Use this slot for Central Library or workshop hours.",
                        fontSize = 12.sp,
                        color = AshGray,
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
                            containerColor = if (isOngoing) NeonGreenTint else ObsidianSurface
                        ),
                        shape = CutCornerShape(topEnd = 14.dp, bottomStart = 14.dp),
                        border = BorderStroke(
                            if (isOngoing) 1.5.dp else 1.dp,
                            if (isOngoing) NeonGreen else GraphiteBorder
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("class_card_${item.subjectCode}")
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Surface(
                                        color = if (item.isLab) NeonGreenTint else SportsRedTint,
                                        shape = CutCornerShape(4.dp),
                                        border = BorderStroke(
                                            1.dp,
                                            if (item.isLab) NeonGreen.copy(alpha = 0.6f) else SportsRed.copy(alpha = 0.6f)
                                        )
                                    ) {
                                        Text(
                                            text = item.subjectCode,
                                            fontFamily = MonoFontFamily,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            color = if (item.isLab) NeonGreen else SportsRed,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                    if (item.isLab) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            color = SportsRedTint,
                                            shape = CutCornerShape(4.dp),
                                            border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.6f))
                                        ) {
                                            Text(
                                                text = "LAB",
                                                fontFamily = MonoFontFamily,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 9.5.sp,
                                                color = SportsRed,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                                            )
                                        }
                                    }
                                }

                                if (isOngoing) {
                                    Surface(
                                        color = NeonGreen,
                                        shape = CutCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = "LIVE NOW",
                                            fontFamily = MonoFontFamily,
                                            color = VoidBlack,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }
                                } else if (isUpcoming) {
                                    Text(
                                        text = "UPCOMING",
                                        fontFamily = MonoFontFamily,
                                        color = AshGray,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Text(
                                text = item.subjectTitle,
                                fontFamily = DisplayFontFamily,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AccessTime,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = item.timeSlot,
                                    fontFamily = MonoFontFamily,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PureWhite
                                )

                                Spacer(modifier = Modifier.width(14.dp))

                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = AshGray,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = item.instructor,
                                    fontSize = 12.sp,
                                    color = AshGray,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CarbonSurface, CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp))
                                    .border(1.dp, GraphiteBorder, CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp))
                                    .padding(horizontal = 10.dp, vertical = 7.dp),
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
                                        tint = SportsRed,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = item.roomLabel,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = PureWhite,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Surface(
                                    color = SportsRed,
                                    shape = CutCornerShape(4.dp),
                                    modifier = Modifier
                                        .clickable { viewModel.locatePinById(item.locationPinId) }
                                        .testTag("locate_room_${item.subjectCode}")
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Layers,
                                            contentDescription = null,
                                            tint = PureWhite,
                                            modifier = Modifier.size(12.dp)
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
                item { Spacer(modifier = Modifier.height(16.dp)) }
            }
        }
    }
}

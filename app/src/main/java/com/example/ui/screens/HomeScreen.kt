package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
import com.example.ui.theme.AshGray
import com.example.ui.theme.BodyFontFamily
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
fun HomeScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val nextClass by viewModel.nextClassItem.collectAsState()
    val savedDept by viewModel.repository.savedDept.collectAsState()
    val savedSem by viewModel.repository.savedSemester.collectAsState()
    val savedSec by viewModel.repository.savedSection.collectAsState()
    val notices by viewModel.repository.notices.collectAsState()
    val userLocation by viewModel.locationHelper.currentLocation.collectAsState()

    var searchQuery by remember { mutableStateOf("") }
    var searchResults by remember { mutableStateOf<List<CampusPin>>(emptyList()) }
    var expandedGuideIndex by remember { mutableStateOf<Int?>(null) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(VoidBlack)
    ) {
        // 1. Minimalist Punk Hero Command Header
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(
                            colors = listOf(VoidBlack, Color(0xFF140609), ObsidianSurface)
                        )
                    )
                    .drawBehind {
                        // Razor sports-red racing slash on top & bottom edge
                        drawLine(
                            color = SportsRed,
                            start = Offset(0f, 0f),
                            end = Offset(size.width * 0.42f, 0f),
                            strokeWidth = 6f
                        )
                        drawLine(
                            color = GraphiteBorder,
                            start = Offset(0f, size.height),
                            end = Offset(size.width, size.height),
                            strokeWidth = 2f
                        )
                    }
                    .padding(horizontal = 18.dp, vertical = 20.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Surface(
                                color = SportsRedTint,
                                shape = CutCornerShape(4.dp),
                                border = BorderStroke(1.dp, SportsRed)
                            ) {
                                Text(
                                    text = "BBSUTSD // KHAIRPUR MIRS",
                                    fontFamily = MonoFontFamily,
                                    color = SportsRed,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = "WELCOME, ENGINEER",
                                fontFamily = DisplayFontFamily,
                                fontSize = 25.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.8.sp,
                                color = PureWhite
                            )
                            Text(
                                text = "Campus navigation, floor plans, live GPS & 5-Point buses",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                color = AshGray,
                                modifier = Modifier.padding(top = 3.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        // Angular Punk Crest
                        Surface(
                            shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                            color = CarbonSurface,
                            border = BorderStroke(1.5.dp, NeonGreen),
                            modifier = Modifier.size(52.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.School,
                                    contentDescription = "BBSUTSD Crest",
                                    tint = NeonGreen,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Minimalist Razor-Cut Instant Search Bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = {
                            searchQuery = it
                            searchResults = if (it.trim().isNotEmpty()) {
                                viewModel.repository.searchPins(it)
                            } else {
                                emptyList()
                            }
                        },
                        placeholder = {
                            Text(
                                "Search VC office, labs, workshops, bus point...",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.5.sp,
                                color = SteelGray,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = SportsRed)
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = {
                                    searchQuery = ""
                                    searchResults = emptyList()
                                }) {
                                    Icon(Icons.Default.Close, contentDescription = "Clear", tint = PureWhite)
                                }
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CarbonSurface,
                            unfocusedContainerColor = ObsidianSurface,
                            focusedTextColor = PureWhite,
                            unfocusedTextColor = PureWhite,
                            focusedBorderColor = SportsRed,
                            unfocusedBorderColor = GraphiteBorder,
                            cursorColor = NeonGreen
                        ),
                        shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("home_instant_search_input")
                    )

                    // Live Neon Green GPS Telemetry Strip
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        color = NeonGreenTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.55f)),
                        modifier = Modifier.clickable { viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.GpsFixed,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "GPS // ${userLocation?.label ?: "SCANNING SATELLITES..."}",
                                    fontFamily = MonoFontFamily,
                                    fontSize = 10.5.sp,
                                    color = PureWhite,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            Text(
                                text = "OPEN MAP →",
                                fontFamily = MonoFontFamily,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = NeonGreen
                            )
                        }
                    }
                }
            }
        }

        // Search Results Dropdown
        if (searchQuery.isNotEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = "RESULTS (${searchResults.size})",
                        fontFamily = MonoFontFamily,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonGreen
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (searchResults.isEmpty()) {
                        Text(
                            text = "No campus pin matches '$searchQuery'. Try searching department, office, or lab.",
                            fontSize = 12.sp,
                            color = AshGray
                        )
                    }
                }
            }

            items(searchResults) { pin ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                    shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                    border = BorderStroke(1.dp, GraphiteBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                        .clickable { viewModel.selectPin(pin) }
                        .testTag("search_result_${pin.id}")
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = SportsRedTint,
                            shape = CutCornerShape(4.dp),
                            border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.6f))
                        ) {
                            Text(
                                text = pin.roomNumber,
                                fontFamily = MonoFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp,
                                color = SportsRed,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = pin.name,
                                fontFamily = DisplayFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                color = PureWhite
                            )
                            Text(
                                text = "${pin.building.shortName} • ${pin.floor.displayName}",
                                fontSize = 11.sp,
                                color = AshGray
                            )
                        }
                        IconButton(onClick = { viewModel.locatePinIndoor(pin) }) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = "View Floor Plan",
                                tint = NeonGreen
                            )
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(14.dp)) }
        }

        if (searchQuery.isEmpty()) {
            // 2. Next Class Schedule Module
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(16.dp)
                                    .background(SportsRed)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "NEXT SESSION",
                                fontFamily = DisplayFontFamily,
                                fontSize = 14.sp,
                                letterSpacing = 1.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                        }

                        Surface(
                            color = CarbonSurface,
                            shape = CutCornerShape(4.dp),
                            border = BorderStroke(1.dp, GraphiteBorder)
                        ) {
                            Text(
                                text = "$savedDept • S$savedSem-$savedSec",
                                fontFamily = MonoFontFamily,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = NeonGreen,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (nextClass != null) {
                        val cls = nextClass!!
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                            shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
                            border = BorderStroke(1.dp, GraphiteBorder),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("home_next_class_card")
                        ) {
                            Column(
                                modifier = Modifier
                                    .drawBehind {
                                        drawLine(
                                            color = SportsRed,
                                            start = Offset(0f, 0f),
                                            end = Offset(0f, size.height),
                                            strokeWidth = 7f
                                        )
                                    }
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        color = if (cls.isLab) NeonGreenTint else SportsRedTint,
                                        shape = CutCornerShape(4.dp),
                                        border = BorderStroke(
                                            1.dp,
                                            if (cls.isLab) NeonGreen.copy(alpha = 0.6f) else SportsRed.copy(alpha = 0.6f)
                                        )
                                    ) {
                                        Text(
                                            text = "${cls.subjectCode}${if (cls.isLab) " // LAB" else ""}",
                                            fontFamily = MonoFontFamily,
                                            color = if (cls.isLab) NeonGreen else SportsRed,
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.AccessTime,
                                            contentDescription = null,
                                            tint = NeonGreen,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = cls.timeSlot,
                                            fontFamily = MonoFontFamily,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = PureWhite
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(10.dp))

                                Text(
                                    text = cls.subjectTitle,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PureWhite
                                )

                                Text(
                                    text = "Instructor // ${cls.instructor}",
                                    fontSize = 12.sp,
                                    color = AshGray,
                                    modifier = Modifier.padding(top = 3.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(CarbonSurface, CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp))
                                        .border(1.dp, GraphiteBorder, CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp))
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
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
                                            tint = NeonGreen,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = cls.roomLabel,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = PureWhite,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Button(
                                        onClick = { viewModel.locatePinById(cls.locationPinId) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = SportsRed,
                                            contentColor = PureWhite
                                        ),
                                        shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
                                        modifier = Modifier
                                            .height(38.dp)
                                            .testTag("home_locate_next_class")
                                    ) {
                                        Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = "ROUTE",
                                            fontFamily = DisplayFontFamily,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                            shape = CutCornerShape(topEnd = 14.dp, bottomStart = 14.dp),
                            border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.45f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(26.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "ALL SESSIONS CLEARED",
                                        fontFamily = DisplayFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.5.sp,
                                        color = PureWhite
                                    )
                                    Text(
                                        text = "Head to Central Library or check engineering workshops.",
                                        fontSize = 11.5.sp,
                                        color = AshGray
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. Quick Campus Navigation 2x2 Minimal Grid
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .width(4.dp)
                                .height(16.dp)
                                .background(NeonGreen)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "QUICK LAUNCH",
                            fontFamily = DisplayFontFamily,
                            fontSize = 14.sp,
                            letterSpacing = 1.sp,
                            fontWeight = FontWeight.Bold,
                            color = PureWhite
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        NavigationQuickCard(
                            code = "01",
                            title = "OLD BUILDING",
                            subtitle = "VC, Exam, Registrar & Finance",
                            icon = Icons.Default.Apartment,
                            accentColor = SportsRed,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_old_building")
                        ) {
                            viewModel.setIndoorBuilding(Building.OLD_BUILDING)
                            viewModel.navigateToScreen(AppScreen.INDOOR_MAP)
                        }

                        NavigationQuickCard(
                            code = "02",
                            title = "NEW COMPLEX",
                            subtitle = "Labs, Library & Auditorium",
                            icon = Icons.Default.Layers,
                            accentColor = NeonGreen,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_new_building")
                        ) {
                            viewModel.setIndoorBuilding(Building.NEW_BUILDING)
                            viewModel.navigateToScreen(AppScreen.INDOOR_MAP)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        NavigationQuickCard(
                            code = "03",
                            title = "CAMPUS GPS",
                            subtitle = "Complexes, pins & live radar",
                            icon = Icons.Default.NearMe,
                            accentColor = NeonGreen,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_campus_gps")
                        ) {
                            viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP)
                        }

                        NavigationQuickCard(
                            code = "04",
                            title = "BUS POINTS",
                            subtitle = "Point 1–5 cities & timings",
                            icon = Icons.Default.DirectionsBus,
                            accentColor = SportsRed,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_bus_schedule")
                        ) {
                            viewModel.openBusTimings()
                        }
                    }
                }
            }

            // 4. Freshmen 101 Survival Guide
            item {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.HelpOutline,
                            contentDescription = null,
                            tint = NeonGreen,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "FRESHMEN 101",
                            fontFamily = DisplayFontFamily,
                            fontSize = 14.sp,
                            letterSpacing = 1.sp,
                            fontWeight = FontWeight.Bold,
                            color = PureWhite
                        )
                    }
                    Text(
                        text = "Essential onboarding steps at BBSUTSD",
                        fontSize = 11.5.sp,
                        color = AshGray,
                        modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                    )

                    val guides = listOf(
                        Triple(
                            "01 // DOCUMENT VERIFICATION",
                            "Directorate of Admissions (Old Bldg OB-G05)",
                            "Submit your original Matric & Inter mark sheets, Domicile/PRC certificates, and paid challan copy to receive your official registration slip."
                        ),
                        Triple(
                            "02 // STUDENT SMART ID",
                            "Student One-Window Reception (New Bldg NB-G01)",
                            "Get your photo and biometric profile registered. Your Student Smart Card is required for campus gate security, exam halls, and computer labs."
                        ),
                        Triple(
                            "03 // LIBRARY BARCODE",
                            "Central Digital Library (New Bldg 1st Floor)",
                            "Submit 1 passport photo and student ID to activate your digital library borrowing barcode and IEEE / HEC research repository account."
                        ),
                        Triple(
                            "04 // POINT BUS PASS (1–5)",
                            "Transport Office (Next to Boys Hostel)",
                            "Commuting via Point 1–5 (Gambat/Hingorja, Pir Jo Goth, Sukkur, Thari Mirwah, Chondko)? Deposit transport challan at Finance section and collect your Bus Pass."
                        ),
                        Triple(
                            "05 // 75% ATTENDANCE RULE",
                            "PEC & HEC Mandatory Compliance",
                            "BBSUTSD strictly requires 75% attendance in theory and lab sessions. Falling short makes you ineligible for Semester Final Examinations."
                        )
                    )

                    guides.forEachIndexed { index, (title, loc, details) ->
                        val isExpanded = expandedGuideIndex == index
                        Card(
                            colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                            shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                            border = BorderStroke(
                                1.dp,
                                if (isExpanded) NeonGreen.copy(alpha = 0.65f) else GraphiteBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { expandedGuideIndex = if (isExpanded) null else index }
                                .testTag("freshman_guide_item_$index")
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = title,
                                            fontFamily = MonoFontFamily,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.5.sp,
                                            color = if (isExpanded) NeonGreen else PureWhite
                                        )
                                        Text(
                                            text = loc,
                                            fontSize = 11.sp,
                                            color = AshGray,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                    }
                                    Icon(
                                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        tint = if (isExpanded) NeonGreen else AshGray
                                    )
                                }

                                AnimatedVisibility(visible = isExpanded) {
                                    Text(
                                        text = details,
                                        fontSize = 12.sp,
                                        lineHeight = 18.sp,
                                        color = PureWhite.copy(alpha = 0.88f),
                                        modifier = Modifier.padding(top = 10.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 5. Notice Board
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = null,
                                tint = SportsRed,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "LIVE BULLETINS",
                                fontFamily = DisplayFontFamily,
                                fontSize = 14.sp,
                                letterSpacing = 1.sp,
                                fontWeight = FontWeight.Bold,
                                color = PureWhite
                            )
                        }

                        Text(
                            text = "VIEW ALL →",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonGreen,
                            modifier = Modifier
                                .clickable { viewModel.navigateToScreen(AppScreen.RESOURCES) }
                                .padding(4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    notices.take(2).forEach { notice ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (notice.isHighPriority) SportsRedTint else ObsidianSurface
                            ),
                            shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                            border = BorderStroke(
                                1.dp,
                                if (notice.isHighPriority) SportsRed.copy(alpha = 0.7f) else GraphiteBorder
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { viewModel.navigateToScreen(AppScreen.RESOURCES) }
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (notice.isHighPriority) "URGENT // ${notice.category.uppercase()}" else notice.category.uppercase(),
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (notice.isHighPriority) SportsRed else NeonGreen
                                    )
                                    Text(
                                        text = notice.date,
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.sp,
                                        color = AshGray
                                    )
                                }
                                Spacer(modifier = Modifier.height(5.dp))
                                Text(
                                    text = notice.title,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PureWhite
                                )
                            }
                        }
                    }
                }
            }

            item { Spacer(modifier = Modifier.height(24.dp)) }
        }
    }
}

@Composable
private fun NavigationQuickCard(
    code: String,
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
        shape = CutCornerShape(topEnd = 14.dp, bottomStart = 14.dp),
        border = BorderStroke(1.dp, GraphiteBorder),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = accentColor.copy(alpha = 0.14f),
                    shape = CutCornerShape(6.dp),
                    border = BorderStroke(1.dp, accentColor.copy(alpha = 0.55f)),
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(19.dp)
                        )
                    }
                }
                Text(
                    text = code,
                    fontFamily = MonoFontFamily,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = SteelGray
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                fontFamily = DisplayFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 13.5.sp,
                letterSpacing = 0.4.sp,
                color = PureWhite
            )
            Text(
                text = subtitle,
                fontSize = 10.5.sp,
                color = AshGray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}

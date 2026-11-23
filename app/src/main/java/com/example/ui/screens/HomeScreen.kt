package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
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
import androidx.compose.ui.draw.clip
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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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

    val formattedDate = remember {
        SimpleDateFormat("EEEE, MMM d", Locale.getDefault()).format(Date())
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(PorcelainCanvas),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // 1. Pixel "At a Glance" Header + Search Pill + Tonal GPS Chip
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "$formattedDate  •  BBS-UTECH Khairpur",
                            fontFamily = BodyFontFamily,
                            color = PixelBlue,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Good to see you, Engineer",
                            fontFamily = DisplayFontFamily,
                            fontSize = 24.sp,
                            lineHeight = 30.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkBlack
                        )
                        Text(
                            text = "Navigate buildings, indoor floors, timetables & 5-Point buses",
                            fontFamily = BodyFontFamily,
                            fontSize = 13.sp,
                            color = SlateGray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = PixelBlueContainer,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.School,
                                contentDescription = "BBS-UTECH Campus",
                                tint = OnPixelBlueContainer,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Pixel Full-Pill Universal Search Bar
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
                            fontSize = 13.5.sp,
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
                        focusedContainerColor = PureSurface,
                        unfocusedContainerColor = PureSurface,
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

                // Tonal GPS At-a-Glance Pill
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = CampusEmeraldTint,
                    shape = RoundedCornerShape(50),
                    border = BorderStroke(1.dp, CampusEmeraldBorder),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP) }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(CampusEmerald)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = Icons.Default.GpsFixed,
                                contentDescription = null,
                                tint = CampusEmeraldDark,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = userLocation?.label ?: "GPS ready • BBS-UTECH Campus",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = InkBlack,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Open Map",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = CampusEmeraldDark
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                                contentDescription = null,
                                tint = CampusEmeraldDark,
                                modifier = Modifier.size(14.dp)
                            )
                        }
                    }
                }
            }
        }

        // Search Results
        if (searchQuery.isNotEmpty()) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "${searchResults.size} matching places",
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = PixelBlue
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (searchResults.isEmpty()) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureSurface),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(1.dp, MistOutline),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "No campus place matches \"$searchQuery\". Try searching a department, office, lab, or bus point.",
                                fontFamily = BodyFontFamily,
                                fontSize = 13.sp,
                                color = SlateGray,
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
            }

            items(searchResults) { pin ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = PureSurface),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, MistOutline),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                        .clickable { viewModel.selectPin(pin) }
                        .testTag("search_result_${pin.id}")
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            color = PixelBlueTint,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = pin.roomNumber,
                                fontFamily = MonoFontFamily,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 11.sp,
                                color = PixelBlue,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = pin.name,
                                fontFamily = DisplayFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = InkBlack
                            )
                            Text(
                                text = "${pin.building.shortName} • ${pin.floor.displayName}",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                color = SlateGray
                            )
                        }
                        IconButton(
                            onClick = { viewModel.locatePinIndoor(pin) },
                            modifier = Modifier.minimumInteractiveComponentSize()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Layers,
                                contentDescription = "View Floor Plan",
                                tint = PixelBlue
                            )
                        }
                    }
                }
            }
        }

        if (searchQuery.isEmpty()) {
            // 2. Next Session At-a-Glance Card
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Up Next",
                            fontFamily = DisplayFontFamily,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkBlack
                        )

                        Surface(
                            color = TonalMist,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = "$savedDept • S$savedSem-$savedSec",
                                fontFamily = MonoFontFamily,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = SlateGray,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (nextClass != null) {
                        val cls = nextClass!!
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureSurface),
                            shape = RoundedCornerShape(24.dp),
                            border = BorderStroke(1.dp, MistOutline),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("home_next_class_card")
                        ) {
                            Column(modifier = Modifier.padding(18.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Surface(
                                        color = if (cls.isLab) CampusEmeraldTint else PixelBlueContainer,
                                        shape = RoundedCornerShape(50)
                                    ) {
                                        Text(
                                            text = "${cls.subjectCode}${if (cls.isLab) " • Lab" else ""}",
                                            fontFamily = MonoFontFamily,
                                            color = if (cls.isLab) CampusEmeraldDark else OnPixelBlueContainer,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                        )
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.AccessTime,
                                            contentDescription = null,
                                            tint = PixelBlue,
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = cls.timeSlot,
                                            fontFamily = MonoFontFamily,
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = InkBlack
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Text(
                                    text = cls.subjectTitle,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkBlack
                                )

                                Text(
                                    text = cls.instructor,
                                    fontFamily = BodyFontFamily,
                                    fontSize = 13.sp,
                                    color = SlateGray,
                                    modifier = Modifier.padding(top = 3.dp)
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(TonalMist, RoundedCornerShape(18.dp))
                                        .padding(horizontal = 14.dp, vertical = 10.dp),
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
                                            modifier = Modifier.size(17.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = cls.roomLabel,
                                            fontFamily = BodyFontFamily,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = InkBlack,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Button(
                                        onClick = { viewModel.locatePinById(cls.locationPinId) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = PixelBlue,
                                            contentColor = PureWhite
                                        ),
                                        shape = RoundedCornerShape(50),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp),
                                        modifier = Modifier
                                            .height(40.dp)
                                            .testTag("home_locate_next_class")
                                    ) {
                                        Icon(Icons.Default.NearMe, contentDescription = null, modifier = Modifier.size(15.dp))
                                        Spacer(modifier = Modifier.width(5.dp))
                                        Text(
                                            text = "Route",
                                            fontFamily = BodyFontFamily,
                                            fontSize = 12.5.sp,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureSurface),
                            shape = RoundedCornerShape(24.dp),
                            border = BorderStroke(1.dp, CampusEmeraldBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(
                                    color = CampusEmeraldTint,
                                    shape = CircleShape,
                                    modifier = Modifier.size(40.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = CampusEmeraldDark,
                                            modifier = Modifier.size(22.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "All sessions cleared",
                                        fontFamily = DisplayFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = InkBlack
                                    )
                                    Text(
                                        text = "Visit the Central Library or engineering workshops.",
                                        fontFamily = BodyFontFamily,
                                        fontSize = 12.5.sp,
                                        color = SlateGray
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. Quick Campus Navigation 2x2 Grid
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
                    Text(
                        text = "Quick Access",
                        fontFamily = DisplayFontFamily,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = InkBlack
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        NavigationQuickCard(
                            title = "Old Building",
                            subtitle = "VC, Exam, Registrar & Finance",
                            icon = Icons.Default.Apartment,
                            iconBg = CampusCrimsonTint,
                            iconTint = CampusCrimson,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_old_building")
                        ) {
                            viewModel.setIndoorBuilding(Building.OLD_BUILDING)
                            viewModel.navigateToScreen(AppScreen.INDOOR_MAP)
                        }

                        NavigationQuickCard(
                            title = "New Complex",
                            subtitle = "Labs, Library & Auditorium",
                            icon = Icons.Default.Layers,
                            iconBg = CampusEmeraldTint,
                            iconTint = CampusEmeraldDark,
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
                            title = "Campus Map",
                            subtitle = "Walkways & turn directions",
                            icon = Icons.Default.NearMe,
                            iconBg = PixelBlueContainer,
                            iconTint = OnPixelBlueContainer,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_campus_gps")
                        ) {
                            viewModel.navigateToScreen(AppScreen.OUTDOOR_MAP)
                        }

                        NavigationQuickCard(
                            title = "Bus Points",
                            subtitle = "Point 1–5 cities & timings",
                            icon = Icons.Default.DirectionsBus,
                            iconBg = PixelBlueTint,
                            iconTint = PixelBlue,
                            modifier = Modifier
                                .weight(1f)
                                .testTag("shortcut_bus_schedule")
                        ) {
                            viewModel.openBusTimings()
                        }
                    }
                }
            }

            // 4. Freshmen 101 Guide
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.HelpOutline,
                            contentDescription = null,
                            tint = PixelBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Freshmen 101",
                            fontFamily = DisplayFontFamily,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = InkBlack
                        )
                    }
                    Text(
                        text = "Essential onboarding steps at BBS-UTECH",
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        color = SlateGray,
                        modifier = Modifier.padding(top = 2.dp, bottom = 10.dp)
                    )

                    val guides = listOf(
                        Triple(
                            "1. Document Verification",
                            "Directorate of Admissions (Old Bldg OB-G05)",
                            "Submit your original Matric & Inter mark sheets, Domicile/PRC certificates, and paid challan copy to receive your official registration slip."
                        ),
                        Triple(
                            "2. Student Smart ID",
                            "Student One-Window Reception (New Bldg NB-G01)",
                            "Get your photo and biometric profile registered. Your Student Smart Card is required for campus gate security, exam halls, and computer labs."
                        ),
                        Triple(
                            "3. Library Barcode",
                            "Central Digital Library (New Bldg 1st Floor)",
                            "Submit 1 passport photo and student ID to activate your digital library borrowing barcode and IEEE / HEC research repository account."
                        ),
                        Triple(
                            "4. Point Bus Pass (1–5)",
                            "Transport Office (Next to Boys Hostel)",
                            "Commuting via Point 1–5 (Gambat/Hingorja, Pir Jo Goth, Sukkur, Thari Mirwah, Chondko)? Deposit transport challan at Finance section and collect your Bus Pass."
                        ),
                        Triple(
                            "5. 75% Attendance Policy",
                            "PEC & HEC Mandatory Compliance",
                            "BBS-UTECH strictly requires 75% attendance in theory and lab sessions. Falling short makes you ineligible for Semester Final Examinations."
                        )
                    )

                    guides.forEachIndexed { index, (title, loc, details) ->
                        val isExpanded = expandedGuideIndex == index
                        Card(
                            colors = CardDefaults.cardColors(containerColor = PureSurface),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(
                                1.dp,
                                if (isExpanded) PixelBlue else MistOutline
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
                                            fontFamily = DisplayFontFamily,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp,
                                            color = if (isExpanded) PixelBlue else InkBlack
                                        )
                                        Text(
                                            text = loc,
                                            fontFamily = BodyFontFamily,
                                            fontSize = 12.sp,
                                            color = SlateGray,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                    }
                                    Icon(
                                        imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                        contentDescription = null,
                                        tint = if (isExpanded) PixelBlue else MutedGray
                                    )
                                }

                                AnimatedVisibility(visible = isExpanded) {
                                    Text(
                                        text = details,
                                        fontFamily = BodyFontFamily,
                                        fontSize = 12.5.sp,
                                        lineHeight = 19.sp,
                                        color = SlateGray,
                                        modifier = Modifier.padding(top = 10.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 5. Campus Notices Preview
            item {
                Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = null,
                                tint = CampusCrimson,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Campus Notices",
                                fontFamily = DisplayFontFamily,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = InkBlack
                            )
                        }

                        Surface(
                            color = PixelBlueTint,
                            shape = RoundedCornerShape(50),
                            modifier = Modifier
                                .clickable { viewModel.navigateToScreen(AppScreen.RESOURCES) }
                        ) {
                            Text(
                                text = "View All",
                                fontFamily = BodyFontFamily,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = PixelBlue,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    notices.take(2).forEach { notice ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = if (notice.isHighPriority) CampusCrimsonTint else PureSurface
                            ),
                            shape = RoundedCornerShape(20.dp),
                            border = BorderStroke(
                                1.dp,
                                if (notice.isHighPriority) CampusCrimson.copy(alpha = 0.35f) else MistOutline
                            ),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clickable { viewModel.navigateToScreen(AppScreen.RESOURCES) }
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = if (notice.isHighPriority) "Priority • ${notice.category}" else notice.category,
                                        fontFamily = BodyFontFamily,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (notice.isHighPriority) CampusCrimson else PixelBlue
                                    )
                                    Text(
                                        text = notice.date,
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.5.sp,
                                        color = MutedGray
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = notice.title,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = InkBlack
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NavigationQuickCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = PureSurface),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, MistOutline),
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Surface(
                color = iconBg,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.size(40.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            Text(
                text = title,
                fontFamily = DisplayFontFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 14.5.sp,
                color = InkBlack
            )
            Text(
                text = subtitle,
                fontFamily = BodyFontFamily,
                fontSize = 11.5.sp,
                color = SlateGray,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}

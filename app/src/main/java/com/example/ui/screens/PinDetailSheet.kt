package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Building
import com.example.data.model.CampusPin
import com.example.data.model.FloorLevel
import com.example.data.model.UserLocation
import com.example.data.repository.CampusRepository
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
import com.example.ui.theme.VoidBlack

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PinDetailSheet(
    pin: CampusPin,
    userLocation: UserLocation?,
    repository: CampusRepository,
    onDismiss: () -> Unit,
    onNavigateIndoor: (CampusPin) -> Unit,
    onNavigateOutdoor: (CampusPin) -> Unit,
    onOpenBusTimings: (() -> Unit)? = null
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val distanceMeters = if (userLocation != null) {
        repository.calculateDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            pin.latitude,
            pin.longitude
        ).toInt()
    } else null

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = ObsidianSurface,
        contentColor = PureWhite,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        modifier = Modifier.testTag("pin_detail_bottom_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 6.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header badges + Close
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = SportsRedTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, SportsRed)
                    ) {
                        Text(
                            text = pin.building.shortName.uppercase(),
                            fontFamily = MonoFontFamily,
                            color = SportsRed,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = NeonGreenTint,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.7f))
                    ) {
                        Text(
                            text = if (pin.floor == FloorLevel.OUTDOOR) "GROUNDS" else pin.floor.code,
                            fontFamily = MonoFontFamily,
                            color = NeonGreen,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = CarbonSurface,
                        shape = CutCornerShape(4.dp),
                        border = BorderStroke(1.dp, GraphiteBorder)
                    ) {
                        Text(
                            text = pin.roomNumber,
                            fontFamily = MonoFontFamily,
                            color = PureWhite,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier.testTag("close_detail_sheet_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = AshGray
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = pin.name,
                fontFamily = DisplayFontFamily,
                fontSize = 21.sp,
                fontWeight = FontWeight.Bold,
                color = PureWhite
            )

            Text(
                text = pin.subTitle,
                fontSize = 13.sp,
                color = AshGray,
                modifier = Modifier.padding(top = 3.dp)
            )

            if (distanceMeters != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = NeonGreenTint),
                    shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                    border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.6f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.NearMe,
                            contentDescription = null,
                            tint = NeonGreen,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            val distText = if (distanceMeters < 1000) "$distanceMeters m away" else String.format("%.1f km away", distanceMeters / 1000f)
                            val walkTime = "${maxOf(1, (distanceMeters / 75.0).toInt())} min walk"
                            Text(
                                text = "$distText • $walkTime",
                                fontFamily = MonoFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = NeonGreen
                            )
                            Text(
                                text = "From your ${if (userLocation?.isSimulated == true) "simulated" else "live GPS"} position",
                                fontSize = 11.sp,
                                color = PureWhite.copy(alpha = 0.85f)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = GraphiteBorder)
            Spacer(modifier = Modifier.height(12.dp))

            InfoRow(
                icon = Icons.Default.Person,
                label = "IN-CHARGE // OFFICER",
                value = pin.inCharge
            )

            InfoRow(
                icon = Icons.Default.AccessTime,
                label = "OFFICE HOURS",
                value = pin.timings
            )

            InfoRow(
                icon = Icons.Default.Phone,
                label = "CONTACT & EXT",
                value = pin.contact
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "DETAILS",
                fontFamily = MonoFontFamily,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = SportsRed
            )
            Text(
                text = pin.description,
                fontSize = 13.sp,
                lineHeight = 19.sp,
                color = AshGray,
                modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
            )

            Card(
                colors = CardDefaults.cardColors(containerColor = CarbonSurface),
                shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                border = BorderStroke(1.dp, GraphiteBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsWalk,
                            contentDescription = null,
                            tint = NeonGreen,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "INDOOR ROUTE",
                            fontFamily = MonoFontFamily,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeonGreen
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = pin.indoorGuide,
                        fontSize = 12.5.sp,
                        lineHeight = 18.sp,
                        color = PureWhite.copy(alpha = 0.9f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            if ((pin.id == "campus_transport_office" || pin.id == "campus_transport") && onOpenBusTimings != null) {
                Button(
                    onClick = {
                        onDismiss()
                        onOpenBusTimings()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = NeonGreen,
                        contentColor = VoidBlack
                    ),
                    shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("sheet_open_bus_timings_button")
                ) {
                    Icon(Icons.Default.DirectionsBus, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "VIEW POINT 1–5 BUS TIMINGS",
                        fontFamily = DisplayFontFamily,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (pin.building != Building.CAMPUS_GROUNDS && pin.floor != FloorLevel.OUTDOOR) {
                    Button(
                        onClick = {
                            onDismiss()
                            onNavigateIndoor(pin)
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SportsRed,
                            contentColor = PureWhite
                        ),
                        shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("action_indoor_plan")
                    ) {
                        Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "INDOOR PLAN",
                            fontFamily = DisplayFontFamily,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                OutlinedButton(
                    onClick = {
                        onDismiss()
                        onNavigateOutdoor(pin)
                    },
                    border = BorderStroke(1.5.dp, PureWhite),
                    shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("action_outdoor_compass")
                ) {
                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = NeonGreen, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "OUTDOOR GPS",
                        fontFamily = DisplayFontFamily,
                        color = PureWhite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = SportsRed,
            modifier = Modifier
                .size(18.dp)
                .padding(top = 2.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                fontFamily = MonoFontFamily,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = AshGray
            )
            Text(
                text = value,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = PureWhite
            )
        }
    }
}

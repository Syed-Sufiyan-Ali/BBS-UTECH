package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Explore
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
import androidx.compose.material3.minimumInteractiveComponentSize
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
import com.example.ui.theme.BodyFontFamily
import com.example.ui.theme.CampusCrimson
import com.example.ui.theme.CampusCrimsonTint
import com.example.ui.theme.CampusEmeraldBorder
import com.example.ui.theme.CampusEmeraldDark
import com.example.ui.theme.CampusEmeraldTint
import com.example.ui.theme.DisplayFontFamily
import com.example.ui.theme.HazelnutBorder
import com.example.ui.theme.InkBlack
import com.example.ui.theme.MistOutline
import com.example.ui.theme.MonoFontFamily
import com.example.ui.theme.MutedGray
import com.example.ui.theme.OnPixelBlueContainer
import com.example.ui.theme.PixelBlue
import com.example.ui.theme.PixelBlueContainer
import com.example.ui.theme.PorcelainCanvas
import com.example.ui.theme.PureSurface
import com.example.ui.theme.PureWhite
import com.example.ui.theme.RoastedWalnut
import com.example.ui.theme.SlateGray
import com.example.ui.theme.TonalMist
import com.example.ui.theme.nuttyButtonElevation

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PinDetailSheet(
    pin: CampusPin,
    userLocation: UserLocation?,
    repository: CampusRepository,
    onDismiss: () -> Unit,
    onNavigateOutdoor: (CampusPin) -> Unit,
    onOpenBusTimings: (() -> Unit)? = null
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val originLat = userLocation?.latitude ?: 27.510977
    val originLng = userLocation?.longitude ?: 68.743880
    val distanceMeters = repository.calculateDistanceMeters(
        originLat,
        originLng,
        pin.latitude,
        pin.longitude
    ).toInt()
    val bearingDeg = repository.calculateBearing(
        originLat,
        originLng,
        pin.latitude,
        pin.longitude
    )
    val directionLabel = repository.formatCompassDirection(bearingDeg)
    val areaSummary = repository.getCampusAreaSummary(pin)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = PorcelainCanvas,
        contentColor = InkBlack,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Surface(
                        color = if (pin.building == Building.OLD_BUILDING) CampusCrimsonTint else PixelBlueContainer,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = pin.building.shortName,
                            fontFamily = BodyFontFamily,
                            color = if (pin.building == Building.OLD_BUILDING) CampusCrimson else OnPixelBlueContainer,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }
                    Surface(
                        color = CampusEmeraldTint,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = if (pin.floor == FloorLevel.OUTDOOR) "Grounds" else pin.floor.code,
                            fontFamily = MonoFontFamily,
                            color = CampusEmeraldDark,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }
                    Surface(
                        color = TonalMist,
                        shape = RoundedCornerShape(50)
                    ) {
                        Text(
                            text = pin.roomNumber,
                            fontFamily = MonoFontFamily,
                            color = SlateGray,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }
                }

                IconButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .minimumInteractiveComponentSize()
                        .testTag("close_detail_sheet_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = SlateGray
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = pin.name,
                fontFamily = DisplayFontFamily,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = InkBlack
            )

            Text(
                text = pin.subTitle,
                fontFamily = BodyFontFamily,
                fontSize = 13.5.sp,
                color = SlateGray,
                modifier = Modifier.padding(top = 3.dp)
            )

            Spacer(modifier = Modifier.height(14.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = CampusEmeraldTint),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, CampusEmeraldBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = PureWhite,
                            shape = CircleShape,
                            modifier = Modifier.size(34.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.NearMe,
                                    contentDescription = null,
                                    tint = CampusEmeraldDark,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            val distText = if (distanceMeters < 1000) "$distanceMeters m away" else String.format("%.1f km away", distanceMeters / 1000f)
                            val walkTime = "${maxOf(1, (distanceMeters / 75.0).toInt())} min walk"
                            Text(
                                text = "$distText • $walkTime",
                                fontFamily = DisplayFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                color = CampusEmeraldDark
                            )
                            Text(
                                text = if (userLocation != null && !userLocation.isSimulated) {
                                    "From your live GPS location"
                                } else {
                                    "From ${userLocation?.label ?: "Main Gates (Old & New Buildings)"}"
                                },
                                fontFamily = BodyFontFamily,
                                fontSize = 11.5.sp,
                                color = InkBlack.copy(alpha = 0.78f)
                            )
                        }
                    }

                    HorizontalDivider(color = CampusEmeraldBorder.copy(alpha = 0.65f))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Explore,
                            contentDescription = null,
                            tint = CampusEmeraldDark,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = "Direction: $directionLabel",
                            fontFamily = BodyFontFamily,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp,
                            color = CampusEmeraldDark
                        )
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Layers,
                            contentDescription = null,
                            tint = CampusEmeraldDark,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = "Area: $areaSummary",
                            fontFamily = BodyFontFamily,
                            fontWeight = FontWeight.Medium,
                            fontSize = 11.5.sp,
                            color = InkBlack.copy(alpha = 0.85f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = MistOutline)
            Spacer(modifier = Modifier.height(12.dp))

            InfoRow(
                icon = Icons.Default.Person,
                label = "In-Charge / Officer",
                value = pin.inCharge
            )

            InfoRow(
                icon = Icons.Default.AccessTime,
                label = "Office Hours",
                value = pin.timings
            )

            InfoRow(
                icon = Icons.Default.Phone,
                label = "Contact & Extension",
                value = pin.contact
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "About this location",
                fontFamily = DisplayFontFamily,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = InkBlack
            )
            Text(
                text = pin.description,
                fontFamily = BodyFontFamily,
                fontSize = 13.sp,
                lineHeight = 20.sp,
                color = SlateGray,
                modifier = Modifier.padding(top = 4.dp, bottom = 14.dp)
            )

            Card(
                colors = CardDefaults.cardColors(containerColor = PureSurface),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, HazelnutBorder),
                elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.DirectionsWalk,
                            contentDescription = null,
                            tint = PixelBlue,
                            modifier = Modifier.size(17.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Indoor Walkthrough",
                            fontFamily = DisplayFontFamily,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = PixelBlue
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = pin.indoorGuide,
                        fontFamily = BodyFontFamily,
                        fontSize = 12.5.sp,
                        lineHeight = 19.sp,
                        color = InkBlack
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
                        containerColor = CampusEmeraldTint,
                        contentColor = CampusEmeraldDark
                    ),
                    elevation = nuttyButtonElevation(),
                    shape = RoundedCornerShape(50),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("sheet_open_bus_timings_button")
                ) {
                    Icon(Icons.Default.DirectionsBus, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "View Bus & Coaster Timings (7 Routes)",
                        fontFamily = BodyFontFamily,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
            }

            Button(
                onClick = {
                    onDismiss()
                    onNavigateOutdoor(pin)
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = PixelBlue,
                    contentColor = PureWhite
                ),
                elevation = nuttyButtonElevation(),
                shape = RoundedCornerShape(50),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 24.dp)
                    .height(48.dp)
                    .testTag("action_outdoor_compass")
            ) {
                Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Directions on Campus Map",
                    fontFamily = BodyFontFamily,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.SemiBold
                )
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
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            color = TonalMist,
            shape = CircleShape,
            modifier = Modifier.size(34.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = PixelBlue,
                    modifier = Modifier.size(17.dp)
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = label,
                fontFamily = BodyFontFamily,
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = MutedGray
            )
            Text(
                text = value,
                fontFamily = BodyFontFamily,
                fontSize = 13.5.sp,
                fontWeight = FontWeight.SemiBold,
                color = InkBlack
            )
        }
    }
}

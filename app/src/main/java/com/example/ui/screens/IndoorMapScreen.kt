package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CompassCalibration
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Building
import com.example.data.model.CampusPin
import com.example.data.model.FloorLevel
import com.example.data.model.PinCategory
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
import com.example.ui.theme.VoidBlack

@Composable
fun IndoorMapScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val currentBuilding by viewModel.indoorBuilding.collectAsState()
    val currentFloor by viewModel.indoorFloor.collectAsState()
    val floorPins by viewModel.indoorFloorPins.collectAsState()
    val selectedIndoorPin by viewModel.selectedIndoorPin.collectAsState()
    val showRoute by viewModel.showIndoorRoute.collectAsState()

    var scale by remember { mutableFloatStateOf(1.0f) }
    var offsetX by remember { mutableFloatStateOf(0.0f) }
    var offsetY by remember { mutableFloatStateOf(0.0f) }

    val transformState = rememberTransformableState { zoomChange, offsetChange, _ ->
        scale = (scale * zoomChange).coerceIn(0.7f, 3.0f)
        offsetX += offsetChange.x
        offsetY += offsetChange.y
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VoidBlack)
    ) {
        // Building Selector Tabs
        val buildings = listOf(Building.OLD_BUILDING, Building.NEW_BUILDING)
        val selectedBuildingIndex = buildings.indexOf(currentBuilding).coerceAtLeast(0)

        TabRow(
            selectedTabIndex = selectedBuildingIndex,
            containerColor = VoidBlack,
            contentColor = PureWhite,
            divider = { HorizontalDivider(color = GraphiteBorder) },
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedBuildingIndex]),
                    color = SportsRed,
                    height = 3.dp
                )
            },
            modifier = Modifier.testTag("indoor_building_tab_row")
        ) {
            buildings.forEachIndexed { index, bld ->
                val isSelected = selectedBuildingIndex == index
                Tab(
                    selected = isSelected,
                    onClick = {
                        viewModel.setIndoorBuilding(bld)
                        scale = 1.0f
                        offsetX = 0f
                        offsetY = 0f
                    },
                    text = {
                        Text(
                            text = if (bld == Building.OLD_BUILDING) "OLD BUILDING" else "NEW COMPLEX",
                            fontFamily = DisplayFontFamily,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.8.sp,
                            color = if (isSelected) SportsRed else AshGray,
                            fontSize = 13.sp
                        )
                    },
                    modifier = Modifier.testTag("tab_building_${bld.name.lowercase()}")
                )
            }
        }

        // Floor Level Selector + Route Toggle
        val floors = listOf(FloorLevel.GROUND, FloorLevel.FIRST, FloorLevel.SECOND)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "LVL:",
                fontFamily = MonoFontFamily,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = AshGray
            )

            floors.forEach { floor ->
                val isSelected = currentFloor == floor
                FilterChip(
                    selected = isSelected,
                    onClick = {
                        viewModel.setIndoorFloor(floor)
                        scale = 1.0f
                        offsetX = 0f
                        offsetY = 0f
                    },
                    label = {
                        Text(
                            text = "${floor.code} • ${floor.displayName.substringBefore(" ").uppercase()}",
                            fontFamily = MonoFontFamily,
                            fontSize = 10.5.sp,
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
                        selected = isSelected,
                        borderColor = GraphiteBorder,
                        selectedBorderColor = SportsRed
                    ),
                    modifier = Modifier.testTag("chip_floor_${floor.code.lowercase()}")
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            Surface(
                color = if (showRoute) NeonGreenTint else ObsidianSurface,
                shape = CutCornerShape(6.dp),
                border = BorderStroke(1.dp, if (showRoute) NeonGreen else GraphiteBorder),
                modifier = Modifier.clickable { viewModel.toggleIndoorRoute() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 7.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Route,
                        contentDescription = "Toggle Route",
                        tint = if (showRoute) NeonGreen else AshGray,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (showRoute) "PATH" else "OFF",
                        fontFamily = MonoFontFamily,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (showRoute) NeonGreen else AshGray
                    )
                }
            }
        }

        // Guidance Banner for Selected Room
        if (selectedIndoorPin != null) {
            val pin = selectedIndoorPin!!
            Card(
                colors = CardDefaults.cardColors(containerColor = ObsidianSurface),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.7f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 4.dp)
                    .testTag("indoor_selected_pin_banner")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsWalk,
                        contentDescription = null,
                        tint = NeonGreen,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = pin.roomNumber,
                                fontFamily = MonoFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = SportsRed
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = pin.name,
                                fontFamily = DisplayFontFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                color = PureWhite,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = pin.indoorGuide,
                            fontSize = 11.sp,
                            color = AshGray,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    IconButton(
                        onClick = { viewModel.selectPin(pin) },
                        modifier = Modifier.minimumInteractiveComponentSize()
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Details",
                            tint = NeonGreen
                        )
                    }
                }
            }
        }

        // Tactical Obsidian Blueprint Canvas
        BoxWithConstraints(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 6.dp)
                .clip(CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp))
                .background(Color(0xFF07080B))
                .border(1.dp, GraphiteBorder, CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp))
        ) {
            val canvasW = constraints.maxWidth.toFloat()
            val canvasH = constraints.maxHeight.toFloat()

            fun normToScreen(nx: Float, ny: Float): Offset {
                val cx = canvasW * 0.5f
                val cy = canvasH * 0.5f
                val basePx = canvasW * 0.05f + nx * (canvasW * 0.90f)
                val basePy = canvasH * 0.05f + ny * (canvasH * 0.90f)
                val scaledX = (basePx - cx) * scale + cx + offsetX
                val scaledY = (basePy - cy) * scale + cy + offsetY
                return Offset(scaledX, scaledY)
            }

            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .transformable(transformState)
                    .pointerInput(Unit) {
                        detectTapGestures { tapOffset ->
                            var closest: CampusPin? = null
                            var minD = Float.MAX_VALUE

                            floorPins.forEach { pin ->
                                val pPos = normToScreen(pin.indoorX, pin.indoorY)
                                val d = (pPos - tapOffset).getDistance()
                                if (d < 44f * scale && d < minD) {
                                    minD = d
                                    closest = pin
                                }
                            }

                            if (closest != null) {
                                viewModel.selectIndoorPin(closest)
                            }
                        }
                    }
                    .testTag("indoor_blueprint_canvas")
            ) {
                drawBlueprintLayout(
                    building = currentBuilding,
                    floor = currentFloor,
                    scale = scale,
                    normToScreen = ::normToScreen
                )

                // Neon Green Indoor Route Path
                if (showRoute && selectedIndoorPin != null) {
                    val targetPin = selectedIndoorPin!!
                    val entrancePos = normToScreen(0.50f, 0.90f)
                    val targetPos = normToScreen(targetPin.indoorX, targetPin.indoorY)

                    val corridorY = normToScreen(0.50f, 0.50f).y
                    val intermediateTurn = Offset(entrancePos.x, corridorY)
                    val roomDoorTurn = Offset(targetPos.x, corridorY)

                    val routePath = Path().apply {
                        moveTo(entrancePos.x, entrancePos.y)
                        lineTo(intermediateTurn.x, intermediateTurn.y)
                        lineTo(roomDoorTurn.x, roomDoorTurn.y)
                        lineTo(targetPos.x, targetPos.y)
                    }

                    drawPath(
                        path = routePath,
                        color = NeonGreen.copy(alpha = 0.28f),
                        style = Stroke(width = 11f * scale, cap = StrokeCap.Round, join = StrokeJoin.Round)
                    )

                    drawPath(
                        path = routePath,
                        color = NeonGreen,
                        style = Stroke(
                            width = 4f * scale,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f * scale, 8f * scale), 0f)
                        )
                    )

                    drawCircle(color = NeonGreen, radius = 8f * scale, center = entrancePos)
                    drawCircle(color = VoidBlack, radius = 3.5f * scale, center = entrancePos)
                }

                // Floor Pins
                floorPins.forEach { pin ->
                    val pos = normToScreen(pin.indoorX, pin.indoorY)
                    val isSelected = selectedIndoorPin?.id == pin.id

                    val pinColor = when (pin.category) {
                        PinCategory.ADMIN -> SportsRed
                        PinCategory.ACADEMIC -> Color(0xFFF8FAFC)
                        PinCategory.LAB -> NeonGreen
                        PinCategory.LIBRARY -> NeonGreen
                        PinCategory.STUDENT_SERVICE -> Color(0xFFFF6B76)
                        else -> SportsRed
                    }

                    if (isSelected) {
                        drawCircle(
                            color = NeonGreen.copy(alpha = 0.38f),
                            radius = 27f * scale,
                            center = pos
                        )
                        drawCircle(
                            color = SportsRed.copy(alpha = 0.5f),
                            radius = 20f * scale,
                            center = pos
                        )
                    }

                    drawCircle(color = Color.Black.copy(alpha = 0.65f), radius = 15f * scale, center = Offset(pos.x, pos.y + 2f * scale))
                    drawCircle(color = PureWhite, radius = 13f * scale, center = pos)
                    drawCircle(color = pinColor, radius = 10f * scale, center = pos)
                    drawCircle(color = VoidBlack, radius = 3.5f * scale, center = pos)
                }
            }

            // Top-Left Blueprint Watermark
            Surface(
                color = VoidBlack.copy(alpha = 0.9f),
                shape = CutCornerShape(6.dp),
                border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.7f)),
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(12.dp)
            ) {
                Text(
                    text = "${currentBuilding.shortName.uppercase()} // ${currentFloor.displayName.uppercase()}",
                    fontFamily = MonoFontFamily,
                    color = PureWhite,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp)
                )
            }

            // Zoom Controls
            Column(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                BlueprintZoomButton(
                    icon = Icons.Default.ZoomIn,
                    desc = "Zoom In",
                    accent = PureWhite
                ) { scale = (scale * 1.25f).coerceAtMost(3.0f) }

                BlueprintZoomButton(
                    icon = Icons.Default.ZoomOut,
                    desc = "Zoom Out",
                    accent = PureWhite
                ) { scale = (scale * 0.8f).coerceAtLeast(0.7f) }

                BlueprintZoomButton(
                    icon = Icons.Default.CompassCalibration,
                    desc = "Reset View",
                    accent = NeonGreen
                ) {
                    scale = 1.0f
                    offsetX = 0f
                    offsetY = 0f
                }
            }
        }

        // Floor Room Picker Carousel
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 8.dp)
        ) {
            Text(
                text = "FLOOR DIRECTORY (${floorPins.size})",
                fontFamily = MonoFontFamily,
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                color = AshGray
            )

            Spacer(modifier = Modifier.height(6.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(floorPins) { pin ->
                    val isSelected = selectedIndoorPin?.id == pin.id
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) SportsRedTint else ObsidianSurface
                        ),
                        shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) SportsRed else GraphiteBorder
                        ),
                        modifier = Modifier
                            .clickable { viewModel.selectIndoorPin(pin) }
                            .testTag("pin_chip_${pin.roomNumber}")
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = if (isSelected) SportsRed else CarbonSurface,
                                shape = CutCornerShape(4.dp)
                            ) {
                                Text(
                                    text = pin.roomNumber,
                                    fontFamily = MonoFontFamily,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) PureWhite else NeonGreen,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = pin.name,
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = PureWhite,
                                    maxLines = 1
                                )
                                Text(
                                    text = pin.subTitle,
                                    fontSize = 10.sp,
                                    color = AshGray,
                                    maxLines = 1
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
private fun BlueprintZoomButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    desc: String,
    accent: Color,
    onClick: () -> Unit
) {
    Surface(
        color = VoidBlack.copy(alpha = 0.92f),
        shape = CircleShape,
        border = BorderStroke(1.dp, GraphiteBorder),
        modifier = Modifier.size(48.dp)
    ) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.fillMaxSize()
        ) {
            Icon(icon, contentDescription = desc, tint = accent, modifier = Modifier.size(20.dp))
        }
    }
}

private fun DrawScope.drawBlueprintLayout(
    building: Building,
    floor: FloorLevel,
    scale: Float,
    normToScreen: (Float, Float) -> Offset
) {
    val shellStroke = Color(0xFFFF1E2D).copy(alpha = 0.78f) // Sports Red perimeter
    val wallColor = Color(0xFF323746) // Graphite inner dividers
    val wallFill = Color(0xFF0E1015) // Matte carbon room floor
    val corridorColor = Color(0xFF171A22) // Spine corridor
    val strokeW = 2.5f * scale

    val pTL = normToScreen(0.12f, 0.12f)
    val pBR = normToScreen(0.88f, 0.88f)
    val shellSize = Size(maxOf(1f, pBR.x - pTL.x), maxOf(1f, pBR.y - pTL.y))

    drawRoundRect(
        color = wallFill,
        topLeft = pTL,
        size = shellSize,
        cornerRadius = CornerRadius(10f * scale, 10f * scale)
    )
    drawRoundRect(
        color = shellStroke,
        topLeft = pTL,
        size = shellSize,
        cornerRadius = CornerRadius(10f * scale, 10f * scale),
        style = Stroke(width = strokeW * 1.4f)
    )

    // Corridors
    val hCorridorTL = normToScreen(0.12f, 0.44f)
    val hCorridorBR = normToScreen(0.88f, 0.56f)
    drawRect(
        color = corridorColor,
        topLeft = hCorridorTL,
        size = Size(maxOf(1f, hCorridorBR.x - hCorridorTL.x), maxOf(1f, hCorridorBR.y - hCorridorTL.y))
    )

    val vCorridorTL = normToScreen(0.44f, 0.12f)
    val vCorridorBR = normToScreen(0.56f, 0.88f)
    drawRect(
        color = corridorColor,
        topLeft = vCorridorTL,
        size = Size(maxOf(1f, vCorridorBR.x - vCorridorTL.x), maxOf(1f, vCorridorBR.y - vCorridorTL.y))
    )

    // Central Staircase & Core (Sports Red Frame)
    val stairsTL = normToScreen(0.45f, 0.70f)
    val stairsBR = normToScreen(0.55f, 0.82f)
    drawRoundRect(
        color = Color(0xFF26080D),
        topLeft = stairsTL,
        size = Size(maxOf(1f, stairsBR.x - stairsTL.x), maxOf(1f, stairsBR.y - stairsTL.y)),
        cornerRadius = CornerRadius(4f * scale, 4f * scale)
    )
    drawRoundRect(
        color = Color(0xFFFF1E2D),
        topLeft = stairsTL,
        size = Size(maxOf(1f, stairsBR.x - stairsTL.x), maxOf(1f, stairsBR.y - stairsTL.y)),
        cornerRadius = CornerRadius(4f * scale, 4f * scale),
        style = Stroke(width = 2f * scale)
    )

    // Main Entrance Porch (Neon Green)
    val entryTL = normToScreen(0.42f, 0.88f)
    val entryBR = normToScreen(0.58f, 0.94f)
    drawRect(
        color = Color(0xFF39FF14),
        topLeft = entryTL,
        size = Size(maxOf(1f, entryBR.x - entryTL.x), maxOf(1f, entryBR.y - entryTL.y))
    )

    // Room Dividers
    drawLine(wallColor, normToScreen(0.28f, 0.12f), normToScreen(0.28f, 0.44f), strokeWidth = strokeW)
    drawLine(wallColor, normToScreen(0.12f, 0.44f), normToScreen(0.44f, 0.44f), strokeWidth = strokeW)

    drawLine(wallColor, normToScreen(0.72f, 0.12f), normToScreen(0.72f, 0.44f), strokeWidth = strokeW)
    drawLine(wallColor, normToScreen(0.56f, 0.44f), normToScreen(0.88f, 0.44f), strokeWidth = strokeW)

    drawLine(wallColor, normToScreen(0.28f, 0.56f), normToScreen(0.28f, 0.88f), strokeWidth = strokeW)
    drawLine(wallColor, normToScreen(0.12f, 0.56f), normToScreen(0.44f, 0.56f), strokeWidth = strokeW)

    drawLine(wallColor, normToScreen(0.72f, 0.56f), normToScreen(0.72f, 0.88f), strokeWidth = strokeW)
    drawLine(wallColor, normToScreen(0.56f, 0.56f), normToScreen(0.88f, 0.56f), strokeWidth = strokeW)
}

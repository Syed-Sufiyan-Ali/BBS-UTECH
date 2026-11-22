package com.example.ui.screens

import android.Manifest
import android.annotation.SuppressLint
import android.view.ViewGroup
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.CutCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.LocationOff
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.TurnLeft
import androidx.compose.material.icons.filled.TurnRight
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material.icons.filled.ZoomOut
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.BuildConfig
import com.example.data.model.Building
import com.example.data.model.CampusPin
import com.example.data.model.FloorLevel
import com.example.data.model.PinCategory
import com.example.data.repository.CampusRepository
import com.example.ui.MainViewModel
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
import kotlinx.coroutines.delay
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.max
import kotlin.math.roundToInt

private enum class MapFilterTab(val key: String, val label: String) {
    ALL("ALL", "ALL PINS"),
    OFFICES("OFFICES", "VC & OFFICES"),
    LABS_WORKSHOPS("LABS_WORKSHOPS", "LABS & SHOPS"),
    TRANSPORT("TRANSPORT", "POINT & BUSES"),
    AMENITIES("AMENITIES", "LIBRARY & FOOD")
}

private data class AndroidRouteStep(
    val action: String,
    val instruction: String,
    val streetName: String,
    val distanceMeters: Int
)

private data class AndroidCalculatedRoute(
    val totalDistanceMeters: Int,
    val estimatedMinutes: Int,
    val steps: List<AndroidRouteStep>
)

private fun parseRouteJson(jsonStr: String): AndroidCalculatedRoute? {
    if (jsonStr.isBlank()) return null
    return try {
        val obj = JSONObject(jsonStr)
        val arr = obj.optJSONArray("steps") ?: return null
        val list = buildList {
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                add(
                    AndroidRouteStep(
                        action = item.optString("action", "STRAIGHT"),
                        instruction = item.optString("instruction", ""),
                        streetName = item.optString("streetName", ""),
                        distanceMeters = item.optInt("distanceMeters", 0)
                    )
                )
            }
        }
        AndroidCalculatedRoute(
            totalDistanceMeters = obj.optInt("totalDistanceMeters", 0),
            estimatedMinutes = obj.optInt("estimatedMinutes", 1),
            steps = list
        )
    } catch (_: Exception) {
        null
    }
}

private class CampusBoundaryBridge(
    private val onBoundaryStatusCallback: (Boolean, Int) -> Unit,
    private val onOsmLoadedCallback: (Boolean, Int, Int) -> Unit,
    private val onOutsideAlertCallback: (Int) -> Unit,
    private val onPinSelectedCallback: (String) -> Unit,
    private val onMapEngineReadyCallback: (String) -> Unit,
    private val onRouteCalculatedCallback: (String) -> Unit
) {
    @JavascriptInterface
    fun onBoundaryStatusChanged(isInside: Boolean, distanceMeters: Int) {
        onBoundaryStatusCallback(isInside, distanceMeters)
    }

    @JavascriptInterface
    fun onOsmDataLoaded(hasBoundaryPolygon: Boolean, roadCount: Int, buildingCount: Int) {
        onOsmLoadedCallback(hasBoundaryPolygon, roadCount, buildingCount)
    }

    @JavascriptInterface
    fun onOutsideCampusAlert(distanceMeters: Int) {
        onOutsideAlertCallback(distanceMeters)
    }

    @JavascriptInterface
    fun onPinSelected(pinId: String) {
        onPinSelectedCallback(pinId)
    }

    @JavascriptInterface
    fun onMapEngineReady(engine: String) {
        onMapEngineReadyCallback(engine)
    }

    @JavascriptInterface
    fun onRouteCalculated(routeJson: String) {
        onRouteCalculatedCallback(routeJson)
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun OutdoorMapScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val allPins by viewModel.repository.allPins.collectAsState()
    val navTargetPin by viewModel.navTargetPin.collectAsState()
    val userLocation by viewModel.locationHelper.currentLocation.collectAsState()
    val hasPermission by viewModel.locationHelper.hasLocationPermission.collectAsState()
    val isGpsActive by viewModel.locationHelper.isGpsActive.collectAsState()

    var isSatelliteView by remember { mutableStateOf(true) }
    var isMapLoaded by remember { mutableStateOf(false) }
    var isEngineReady by remember { mutableStateOf(false) }
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var hasAutoRequestedPermission by rememberSaveable { mutableStateOf(false) }

    var isInsideBoundary by remember { mutableStateOf<Boolean?>(null) }
    var distanceFromBoundaryMeters by remember { mutableIntStateOf(0) }
    var osmRoadCount by remember { mutableIntStateOf(0) }
    var showOutsideBannerNotice by remember { mutableStateOf(false) }

    var selectedFilter by remember { mutableStateOf(MapFilterTab.ALL) }
    var searchText by remember { mutableStateOf("") }
    var focusedMapPin by remember { mutableStateOf<CampusPin?>(null) }
    var calculatedRoute by remember { mutableStateOf<AndroidCalculatedRoute?>(null) }
    var activeRouteStepIdx by remember { mutableIntStateOf(0) }

    val pinsJsonPayload = remember(allPins) {
        JSONArray().apply {
            allPins.forEach { pin ->
                put(
                    JSONObject().apply {
                        put("id", pin.id)
                        put("label", pin.mapLabel.ifBlank { pin.name })
                        put("name", pin.name)
                        put("subTitle", pin.subTitle)
                        put("category", pin.category.name)
                        put("lat", pin.latitude)
                        put("lng", pin.longitude)
                        put("tags", pin.tags.joinToString(" "))
                    }
                )
            }
        }.toString()
    }

    val searchSuggestions = remember(allPins, searchText) {
        val q = searchText.trim().lowercase()
        if (q.isEmpty()) emptyList()
        else allPins.filter { pin ->
            pin.mapLabel.lowercase().contains(q) ||
                pin.name.lowercase().contains(q) ||
                pin.subTitle.lowercase().contains(q) ||
                pin.roomNumber.lowercase().contains(q) ||
                pin.tags.any { it.lowercase().contains(q) }
        }.take(6)
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants.values.any { it }
        if (granted) {
            viewModel.locationHelper.startLocationUpdates()
            webViewInstance?.evaluateJavascript("recenterOnUser();", null)
        } else {
            viewModel.locationHelper.checkHasPermission()
        }
    }

    LaunchedEffect(hasPermission) {
        if (hasPermission) {
            viewModel.locationHelper.startLocationUpdates()
        } else if (!hasAutoRequestedPermission) {
            hasAutoRequestedPermission = true
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    LaunchedEffect(isMapLoaded, isEngineReady, pinsJsonPayload) {
        if (isMapLoaded || isEngineReady) {
            webViewInstance?.evaluateJavascript(
                "setLandmarkPins(${JSONObject.quote(pinsJsonPayload)});",
                null
            )
            webViewInstance?.evaluateJavascript(
                "filterLandmarkPins(${JSONObject.quote(selectedFilter.key)}, ${JSONObject.quote(searchText)});",
                null
            )
        }
    }

    LaunchedEffect(selectedFilter, searchText, isMapLoaded, isEngineReady) {
        if (isMapLoaded || isEngineReady) {
            webViewInstance?.evaluateJavascript(
                "filterLandmarkPins(${JSONObject.quote(selectedFilter.key)}, ${JSONObject.quote(searchText)});",
                null
            )
        }
    }

    LaunchedEffect(navTargetPin, isMapLoaded, isEngineReady) {
        val target = navTargetPin
        if (target != null && (isMapLoaded || isEngineReady)) {
            focusedMapPin = target
            selectedFilter = MapFilterTab.ALL
            searchText = ""
            webViewInstance?.evaluateJavascript(
                "focusLandmarkPin(${JSONObject.quote(target.id)});",
                null
            )
            viewModel.setNavTarget(null)
        }
    }

    LaunchedEffect(userLocation, isMapLoaded, isEngineReady) {
        userLocation?.let { loc ->
            val centerDist = viewModel.repository.calculateDistanceMeters(
                loc.latitude,
                loc.longitude,
                CampusRepository.BBSUTSD_LAT,
                CampusRepository.BBSUTSD_LNG
            )
            val approxInside = centerDist <= CampusRepository.CAMPUS_RADIUS_METERS
            if (isInsideBoundary == null) {
                isInsideBoundary = approxInside
                distanceFromBoundaryMeters =
                    if (approxInside) 0 else (centerDist - CampusRepository.CAMPUS_RADIUS_METERS).roundToInt()
            }

            if (isMapLoaded || isEngineReady) {
                val acc = loc.accuracyMeters ?: 15f
                webViewInstance?.evaluateJavascript(
                    "updateUserLocation(${loc.latitude}, ${loc.longitude}, $acc);",
                    null
                )
            }
        }
    }

    LaunchedEffect(showOutsideBannerNotice) {
        if (showOutsideBannerNotice) {
            delay(3500)
            showOutsideBannerNotice = false
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            webViewInstance?.stopLoading()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(VoidBlack)
    ) {
        // 1. Real Interactive Satellite & Campus Map WebView
        AndroidView(
            modifier = Modifier
                .fillMaxSize()
                .testTag("google_campus_map_view"),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        setGeolocationEnabled(false)
                        loadWithOverviewMode = true
                        useWideViewPort = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                        allowFileAccess = true
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }

                    webChromeClient = object : WebChromeClient() {
                        override fun onGeolocationPermissionsShowPrompt(
                            origin: String?,
                            callback: GeolocationPermissions.Callback?
                        ) {
                            callback?.invoke(origin, false, false)
                        }
                    }

                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            isMapLoaded = true
                            webViewInstance = this@apply
                            evaluateJavascript(
                                "setLandmarkPins(${JSONObject.quote(pinsJsonPayload)});",
                                null
                            )
                            userLocation?.let { loc ->
                                val acc = loc.accuracyMeters ?: 15f
                                evaluateJavascript(
                                    "updateUserLocation(${loc.latitude}, ${loc.longitude}, $acc);",
                                    null
                                )
                            }
                        }
                    }

                    addJavascriptInterface(
                        CampusBoundaryBridge(
                            onBoundaryStatusCallback = { inside, distMeters ->
                                post {
                                    isInsideBoundary = inside
                                    distanceFromBoundaryMeters = distMeters
                                }
                            },
                            onOsmLoadedCallback = { _, roadCount, _ ->
                                post { osmRoadCount = roadCount }
                            },
                            onOutsideAlertCallback = { distMeters ->
                                post {
                                    isInsideBoundary = false
                                    distanceFromBoundaryMeters = distMeters
                                    showOutsideBannerNotice = true
                                }
                            },
                            onPinSelectedCallback = { pinId ->
                                post {
                                    focusedMapPin = if (pinId.isBlank()) null
                                    else viewModel.repository.getPinById(pinId)
                                    activeRouteStepIdx = 0
                                    if (pinId.isBlank()) calculatedRoute = null
                                }
                            },
                            onMapEngineReadyCallback = { _ ->
                                post { isEngineReady = true }
                            },
                            onRouteCalculatedCallback = { routeJson ->
                                post {
                                    calculatedRoute = parseRouteJson(routeJson)
                                    activeRouteStepIdx = 0
                                }
                            }
                        ),
                        "AndroidBridge"
                    )

                    val apiKey = try {
                        val field = BuildConfig::class.java.getField("MAPS_API_KEY")
                        (field.get(null) as? String)?.takeIf { it.isNotBlank() && it != "MY_MAPS_API_KEY" } ?: ""
                    } catch (_: Exception) {
                        ""
                    }

                    loadUrl("file:///android_asset/google_campus_map.html?apiKey=$apiKey")
                    webViewInstance = this
                }
            },
            update = { view -> webViewInstance = view }
        )

        // 2. Top Punk Tactical HUD + Search + GPS Boundary + Category Filters
        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(10.dp, CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp)),
                shape = CutCornerShape(topEnd = 16.dp, bottomStart = 16.dp),
                color = VoidBlack.copy(alpha = 0.93f),
                border = BorderStroke(1.dp, GraphiteBorder)
            ) {
                Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "BBSUTSD // CAMPUS RADAR",
                                fontFamily = DisplayFontFamily,
                                color = PureWhite,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.7.sp,
                                fontSize = 15.sp
                            )
                            Text(
                                text = "27.5108° N • 68.7416° E • KHAIRPUR",
                                fontFamily = MonoFontFamily,
                                color = SportsRed,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Surface(
                            shape = CutCornerShape(4.dp),
                            color = if (isGpsActive && userLocation != null) NeonGreenTint else CarbonSurface,
                            border = BorderStroke(
                                1.dp,
                                when {
                                    !hasPermission -> SportsRed
                                    isGpsActive && userLocation != null -> NeonGreen
                                    else -> GraphiteBorder
                                }
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when {
                                                !hasPermission -> SportsRed
                                                userLocation != null -> NeonGreen
                                                else -> AshGray
                                            }
                                        )
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = when {
                                        !hasPermission -> "GPS OFF"
                                        userLocation != null -> "GPS LIVE"
                                        else -> "SCANNING"
                                    },
                                    fontFamily = MonoFontFamily,
                                    color = if (userLocation != null) NeonGreen else PureWhite,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Minimalist Search Input
                    Surface(
                        shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                        color = CarbonSurface,
                        border = BorderStroke(1.dp, GraphiteBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search Landmarks",
                                tint = SportsRed,
                                modifier = Modifier.size(17.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(modifier = Modifier.weight(1f)) {
                                if (searchText.isEmpty()) {
                                    Text(
                                        text = "Find VC Office, Labs, Workshops, Point Parking...",
                                        fontFamily = BodyFontFamily,
                                        color = SteelGray,
                                        fontSize = 12.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                BasicTextField(
                                    value = searchText,
                                    onValueChange = { searchText = it },
                                    singleLine = true,
                                    textStyle = TextStyle(
                                        fontFamily = BodyFontFamily,
                                        color = PureWhite,
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    cursorBrush = SolidColor(NeonGreen),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .testTag("map_landmark_search_input")
                                )
                            }
                            if (searchText.isNotEmpty()) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Clear Search",
                                    tint = AshGray,
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clickable { searchText = "" }
                                        .testTag("clear_map_search_button")
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Boundary Detection Status Strip
                    when {
                        !hasPermission -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(CutCornerShape(6.dp))
                                    .background(SportsRedTint)
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.LocationOff,
                                        contentDescription = null,
                                        tint = SportsRed,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Enable GPS for live tracking",
                                        color = PureWhite,
                                        fontSize = 11.sp
                                    )
                                }
                                Button(
                                    onClick = {
                                        permissionLauncher.launch(
                                            arrayOf(
                                                Manifest.permission.ACCESS_FINE_LOCATION,
                                                Manifest.permission.ACCESS_COARSE_LOCATION
                                            )
                                        )
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = SportsRed,
                                        contentColor = PureWhite
                                    ),
                                    shape = CutCornerShape(4.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.testTag("enable_gps_button")
                                ) {
                                    Text(
                                        text = "ENABLE",
                                        fontFamily = MonoFontFamily,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        userLocation == null -> {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(CutCornerShape(6.dp))
                                    .background(CarbonSurface)
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MyLocation,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "LOCKING ON LIVE GPS SIGNAL...",
                                    fontFamily = MonoFontFamily,
                                    color = AshGray,
                                    fontSize = 10.sp
                                )
                            }
                        }

                        isInsideBoundary == false -> {
                            val formattedDist = if (distanceFromBoundaryMeters >= 1000) {
                                String.format("%.2f km", distanceFromBoundaryMeters / 1000.0)
                            } else {
                                "$distanceFromBoundaryMeters m"
                            }
                            Surface(
                                color = SportsRedTint,
                                shape = CutCornerShape(6.dp),
                                border = BorderStroke(1.dp, SportsRed.copy(alpha = 0.7f)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("outside_boundary_indicator")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.WarningAmber,
                                        contentDescription = "Outside University Boundary",
                                        tint = SportsRed,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "OUTSIDE CAMPUS BOUNDS • $formattedDist AWAY",
                                        fontFamily = MonoFontFamily,
                                        color = PureWhite,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }

                        else -> {
                            val accText = userLocation?.accuracyMeters?.let { " (±${it.roundToInt()}M)" } ?: ""
                            Surface(
                                color = NeonGreenTint,
                                shape = CutCornerShape(6.dp),
                                border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.6f)),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .testTag("inside_boundary_indicator")
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.GpsFixed,
                                        contentDescription = "Inside University Boundary",
                                        tint = NeonGreen,
                                        modifier = Modifier.size(15.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "INSIDE BBSUTSD CAMPUS$accText",
                                        fontFamily = MonoFontFamily,
                                        color = NeonGreen,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 10.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Category Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                MapFilterTab.values().forEach { tab ->
                    val isSelected = selectedFilter == tab
                    Surface(
                        modifier = Modifier
                            .clip(CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp))
                            .clickable { selectedFilter = tab }
                            .testTag("map_filter_${tab.key.lowercase()}"),
                        shape = CutCornerShape(topEnd = 8.dp, bottomStart = 8.dp),
                        color = if (isSelected) SportsRed else VoidBlack.copy(alpha = 0.92f),
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) SportsRed else GraphiteBorder
                        )
                    ) {
                        Text(
                            text = tab.label,
                            fontFamily = MonoFontFamily,
                            color = if (isSelected) PureWhite else AshGray,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                        )
                    }
                }
            }

            // Quick Search Dropdown
            if (searchSuggestions.isNotEmpty()) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 210.dp)
                        .shadow(10.dp, CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp)),
                    shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                    color = VoidBlack.copy(alpha = 0.97f),
                    border = BorderStroke(1.dp, SportsRed)
                ) {
                    LazyColumn {
                        items(searchSuggestions, key = { it.id }) { pin ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        focusedMapPin = pin
                                        searchText = ""
                                        selectedFilter = MapFilterTab.ALL
                                        webViewInstance?.evaluateJavascript(
                                            "focusLandmarkPin(${JSONObject.quote(pin.id)});",
                                            null
                                        )
                                    }
                                    .padding(horizontal = 14.dp, vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = pin.mapLabel.ifBlank { pin.name },
                                        fontFamily = DisplayFontFamily,
                                        color = PureWhite,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${pin.name} • ${pin.building.shortName}",
                                        color = AshGray,
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            HorizontalDivider(color = GraphiteBorder)
                        }
                    }
                }
            }

            AnimatedVisibility(
                visible = showOutsideBannerNotice,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Surface(
                    shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                    color = VoidBlack.copy(alpha = 0.96f),
                    border = BorderStroke(1.dp, SportsRed)
                ) {
                    Text(
                        text = "GPS outside BBSUTSD perimeter — map stays locked on campus.",
                        color = PureWhite,
                        fontSize = 11.5.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
        }

        // 3. Right-Edge Floating Tactical Map Controls (48.dp)
        Column(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 12.dp, top = 48.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier
                    .minimumInteractiveComponentSize()
                    .size(48.dp)
                    .clip(CircleShape)
                    .shadow(8.dp, CircleShape)
                    .clickable {
                        isSatelliteView = !isSatelliteView
                        val mode = if (isSatelliteView) "satellite" else "roadmap"
                        webViewInstance?.evaluateJavascript("setMapTypeMode('$mode');", null)
                    }
                    .testTag("toggle_satellite_button"),
                shape = CircleShape,
                color = if (isSatelliteView) NeonGreen else VoidBlack,
                border = BorderStroke(1.5.dp, if (isSatelliteView) NeonGreen else SportsRed)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (isSatelliteView) Icons.Default.Layers else Icons.Default.Map,
                        contentDescription = "Switch Satellite or Map View",
                        tint = if (isSatelliteView) VoidBlack else PureWhite,
                        modifier = Modifier.size(21.dp)
                    )
                }
            }

            MapCircleControl(
                icon = Icons.Default.ZoomIn,
                description = "Zoom In",
                tint = PureWhite,
                borderColor = GraphiteBorder,
                bgColor = VoidBlack.copy(alpha = 0.94f),
                testTag = "zoom_in_button"
            ) { webViewInstance?.evaluateJavascript("zoomInMap();", null) }

            MapCircleControl(
                icon = Icons.Default.ZoomOut,
                description = "Zoom Out",
                tint = PureWhite,
                borderColor = GraphiteBorder,
                bgColor = VoidBlack.copy(alpha = 0.94f),
                testTag = "zoom_out_button"
            ) { webViewInstance?.evaluateJavascript("zoomOutMap();", null) }

            MapCircleControl(
                icon = if (isGpsActive && userLocation != null) Icons.Default.GpsFixed else Icons.Default.MyLocation,
                description = "My Current GPS Location",
                tint = if (isGpsActive && userLocation != null) VoidBlack else PureWhite,
                borderColor = if (isGpsActive && userLocation != null) NeonGreen else SportsRed,
                bgColor = if (isGpsActive && userLocation != null) NeonGreen else VoidBlack.copy(alpha = 0.94f),
                testTag = "my_location_button"
            ) {
                if (!hasPermission) {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        )
                    )
                } else {
                    viewModel.locationHelper.startLocationUpdates()
                    webViewInstance?.evaluateJavascript("recenterOnUser();", null)
                }
            }

            MapCircleControl(
                icon = Icons.Default.CenterFocusStrong,
                description = "Center on BBSUTSD Campus Boundary",
                tint = SportsRed,
                borderColor = SportsRed,
                bgColor = VoidBlack.copy(alpha = 0.94f),
                testTag = "campus_center_button"
            ) { webViewInstance?.evaluateJavascript("recenterCampus();", null) }
        }

        // 4. Bottom Selected Landmark HUD Card OR Compact Legend Strip
        val activePin = focusedMapPin
        if (activePin != null) {
            val pinColor = when (activePin.category) {
                PinCategory.ADMIN -> SportsRed
                PinCategory.STUDENT_SERVICE -> NeonGreen
                PinCategory.LAB -> PureWhite
                PinCategory.LIBRARY -> Color(0xFFFF4D5A)
                PinCategory.AMENITY -> Color(0xFFA3E635)
                PinCategory.TRANSPORT_GATE -> NeonGreen
                PinCategory.ACADEMIC -> AshGray
            }
            val distMeters = userLocation?.let { loc ->
                viewModel.repository.calculateDistanceMeters(
                    loc.latitude,
                    loc.longitude,
                    activePin.latitude,
                    activePin.longitude
                ).roundToInt()
            }

            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 12.dp)
                    .shadow(12.dp, CutCornerShape(topEnd = 18.dp, bottomStart = 18.dp))
                    .testTag("selected_landmark_card"),
                shape = CutCornerShape(topEnd = 18.dp, bottomStart = 18.dp),
                color = VoidBlack.copy(alpha = 0.96f),
                border = BorderStroke(1.5.dp, pinColor.copy(alpha = 0.85f))
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(
                                    color = CarbonSurface,
                                    shape = CutCornerShape(4.dp),
                                    border = BorderStroke(1.dp, pinColor)
                                ) {
                                    Text(
                                        text = "${activePin.building.shortName.uppercase()} • ${activePin.roomNumber}",
                                        fontFamily = MonoFontFamily,
                                        color = pinColor,
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                                    )
                                }
                                if (distMeters != null) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    val distStr = if (distMeters >= 1000) {
                                        String.format("%.2f km", distMeters / 1000.0)
                                    } else {
                                        "$distMeters m"
                                    }
                                    val walkMins = max(1, (distMeters / 75.0).roundToInt())
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.DirectionsWalk,
                                            contentDescription = null,
                                            tint = NeonGreen,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(3.dp))
                                        Text(
                                            text = "$distStr ($walkMins MIN)",
                                            fontFamily = MonoFontFamily,
                                            color = NeonGreen,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = activePin.name,
                                fontFamily = DisplayFontFamily,
                                color = PureWhite,
                                fontSize = 15.5.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = "${activePin.subTitle} • ${activePin.inCharge}",
                                color = AshGray,
                                fontSize = 11.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(
                            onClick = {
                                focusedMapPin = null
                                webViewInstance?.evaluateJavascript("clearSelectedPin();", null)
                            },
                            modifier = Modifier.testTag("dismiss_selected_pin_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Landmark Card",
                                tint = AshGray
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    val route = calculatedRoute
                    if (route != null && route.steps.isNotEmpty()) {
                        val safeIdx = activeRouteStepIdx.coerceIn(0, route.steps.lastIndex)
                        val curStep = route.steps[safeIdx]
                        Surface(
                            color = NeonGreenTint,
                            shape = CutCornerShape(8.dp),
                            border = BorderStroke(1.dp, NeonGreen.copy(alpha = 0.7f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 10.dp)
                                .testTag("route_tutorial_bar")
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val stepIcon = when {
                                    curStep.action.contains("LEFT") -> Icons.Default.TurnLeft
                                    curStep.action.contains("RIGHT") -> Icons.Default.TurnRight
                                    else -> Icons.Default.Navigation
                                }
                                Icon(
                                    imageVector = stepIcon,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "STEP ${safeIdx + 1}/${route.steps.size} • ${route.totalDistanceMeters}m (${route.estimatedMinutes} MIN)",
                                        fontFamily = MonoFontFamily,
                                        color = NeonGreen,
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = curStep.instruction,
                                        color = PureWhite,
                                        fontSize = 11.5.sp,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        val prev = (safeIdx - 1).coerceAtLeast(0)
                                        activeRouteStepIdx = prev
                                        webViewInstance?.evaluateJavascript("highlightRouteStep($prev);", null)
                                    },
                                    enabled = safeIdx > 0,
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ChevronLeft,
                                        contentDescription = "Previous step",
                                        tint = if (safeIdx > 0) PureWhite else SteelGray
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        val next = (safeIdx + 1).coerceAtMost(route.steps.lastIndex)
                                        activeRouteStepIdx = next
                                        webViewInstance?.evaluateJavascript("highlightRouteStep($next);", null)
                                    },
                                    enabled = safeIdx < route.steps.lastIndex,
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ChevronRight,
                                        contentDescription = "Next step",
                                        tint = if (safeIdx < route.steps.lastIndex) PureWhite else SteelGray
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val isTransportPin = activePin.id == "campus_transport_office" || activePin.id == "campus_transport"
                        if (isTransportPin) {
                            Button(
                                onClick = { viewModel.openBusTimings() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = NeonGreen,
                                    contentColor = VoidBlack
                                ),
                                shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .testTag("landmark_bus_timings_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.DirectionsBus,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = "POINT BUSES",
                                    fontFamily = DisplayFontFamily,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Button(
                            onClick = { viewModel.selectPin(activePin) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = SportsRed,
                                contentColor = PureWhite
                            ),
                            shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .testTag("landmark_details_button")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Text(
                                text = "DETAILS",
                                fontFamily = DisplayFontFamily,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (activePin.building != Building.CAMPUS_GROUNDS && activePin.floor != FloorLevel.OUTDOOR) {
                            OutlinedButton(
                                onClick = { viewModel.locatePinIndoor(activePin) },
                                border = BorderStroke(1.5.dp, PureWhite),
                                shape = CutCornerShape(topEnd = 10.dp, bottomStart = 10.dp),
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                                    .testTag("landmark_floor_plan_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Layers,
                                    contentDescription = null,
                                    tint = NeonGreen,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = "FLOOR",
                                    fontFamily = DisplayFontFamily,
                                    color = PureWhite,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        } else {
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 12.dp, vertical = 14.dp)
                    .shadow(8.dp, CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp)),
                shape = CutCornerShape(topEnd = 12.dp, bottomStart = 12.dp),
                color = VoidBlack.copy(alpha = 0.94f),
                border = BorderStroke(1.dp, GraphiteBorder)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    LegendChip(color = SportsRed, label = "OLD")
                    LegendChip(color = NeonGreen, label = "NEW")
                    LegendChip(color = PureWhite, label = "ROAD")
                    LegendChip(color = NeonGreen, label = "GPS")
                }
            }
        }
    }
}

@Composable
private fun MapCircleControl(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    description: String,
    tint: Color,
    borderColor: Color,
    bgColor: Color,
    testTag: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .minimumInteractiveComponentSize()
            .size(48.dp)
            .clip(CircleShape)
            .shadow(8.dp, CircleShape)
            .clickable(onClick = onClick)
            .testTag(testTag),
        shape = CircleShape,
        color = bgColor,
        border = BorderStroke(1.5.dp, borderColor)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = icon,
                contentDescription = description,
                tint = tint,
                modifier = Modifier.size(21.dp)
            )
        }
    }
}

@Composable
private fun LegendChip(
    color: Color,
    label: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(5.dp))
        Text(
            text = label,
            fontFamily = MonoFontFamily,
            color = PureWhite,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

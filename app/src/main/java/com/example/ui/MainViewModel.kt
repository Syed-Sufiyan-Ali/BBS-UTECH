package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.AcademicResource
import com.example.data.model.Building
import com.example.data.model.CampusNotice
import com.example.data.model.CampusPin
import com.example.data.model.ClassScheduleItem
import com.example.data.model.FacultyMember
import com.example.data.model.FloorLevel
import com.example.data.model.PinCategory
import com.example.data.model.UserLocation
import com.example.data.repository.CampusRepository
import com.example.location.LocationHelper
import com.example.ui.navigation.AppScreen
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import java.util.Calendar

class MainViewModel(
    val repository: CampusRepository,
    val locationHelper: LocationHelper
) : ViewModel() {

    private val _currentScreen = MutableStateFlow(AppScreen.HOME)
    val currentScreen: StateFlow<AppScreen> = _currentScreen.asStateFlow()

    // Search and filter state
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow<PinCategory?>(null)
    val selectedCategory: StateFlow<PinCategory?> = _selectedCategory.asStateFlow()

    // Selected pin for detail sheet (bottom sheet / modal)
    private val _selectedPin = MutableStateFlow<CampusPin?>(null)
    val selectedPin: StateFlow<CampusPin?> = _selectedPin.asStateFlow()

    // Indoor navigation state
    private val _indoorBuilding = MutableStateFlow(Building.OLD_BUILDING)
    val indoorBuilding: StateFlow<Building> = _indoorBuilding.asStateFlow()

    private val _indoorFloor = MutableStateFlow(FloorLevel.GROUND)
    val indoorFloor: StateFlow<FloorLevel> = _indoorFloor.asStateFlow()

    private val _selectedIndoorPin = MutableStateFlow<CampusPin?>(null)
    val selectedIndoorPin: StateFlow<CampusPin?> = _selectedIndoorPin.asStateFlow()

    private val _showIndoorRoute = MutableStateFlow(true)
    val showIndoorRoute: StateFlow<Boolean> = _showIndoorRoute.asStateFlow()

    // Target pin for outdoor radar / compass guidance
    private val _navTargetPin = MutableStateFlow<CampusPin?>(null)
    val navTargetPin: StateFlow<CampusPin?> = _navTargetPin.asStateFlow()

    // Resources sub-tab & 5-Point Bus Schedule filter state
    // Tabs: 0 = Academic Hub, 1 = Point Buses (1-5), 2 = Faculty Directory, 3 = Notice Board
    private val _resourcesTabIndex = MutableStateFlow(0)
    val resourcesTabIndex: StateFlow<Int> = _resourcesTabIndex.asStateFlow()

    private val _selectedBusPointNumber = MutableStateFlow<Int?>(null)
    val selectedBusPointNumber: StateFlow<Int?> = _selectedBusPointNumber.asStateFlow()

    // Schedule Filters
    private val _selectedDept = MutableStateFlow(repository.savedDept.value)
    val selectedDept: StateFlow<String> = _selectedDept.asStateFlow()

    private val _selectedSemester = MutableStateFlow(repository.savedSemester.value)
    val selectedSemester: StateFlow<Int> = _selectedSemester.asStateFlow()

    private val _selectedSection = MutableStateFlow(repository.savedSection.value)
    val selectedSection: StateFlow<String> = _selectedSection.asStateFlow()

    private val _selectedDay = MutableStateFlow(getTodayDayName())
    val selectedDay: StateFlow<String> = _selectedDay.asStateFlow()

    // Filtered pins flow for map/search
    val filteredPins: StateFlow<List<CampusPin>> = combine(
        repository.allPins,
        _searchQuery,
        _selectedCategory
    ) { pins, query, category ->
        var result = pins
        if (category != null) {
            result = result.filter { it.category == category }
        }
        if (query.isNotBlank()) {
            val q = query.trim().lowercase()
            result = result.filter { pin ->
                pin.name.lowercase().contains(q) ||
                pin.subTitle.lowercase().contains(q) ||
                pin.roomNumber.lowercase().contains(q) ||
                pin.inCharge.lowercase().contains(q) ||
                pin.building.displayName.lowercase().contains(q) ||
                pin.tags.any { it.lowercase().contains(q) }
            }
        }
        result
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), repository.allPins.value)

    // Indoor pins for the active building and floor
    val indoorFloorPins: StateFlow<List<CampusPin>> = combine(
        repository.allPins,
        _indoorBuilding,
        _indoorFloor
    ) { pins, building, floor ->
        pins.filter { it.building == building && it.floor == floor }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Filtered classes
    val filteredClasses: StateFlow<List<ClassScheduleItem>> = combine(
        repository.schedules,
        _selectedDept,
        _selectedSemester,
        _selectedSection,
        _selectedDay
    ) { items, dept, sem, sec, day ->
        items.filter {
            (it.department == dept || it.deptCode == dept) &&
            it.semester == sem &&
            it.section.equals(sec, ignoreCase = true) &&
            it.dayName.equals(day, ignoreCase = true)
        }.sortedBy { it.startMinutes }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Next class for student on Home screen
    val nextClassItem: StateFlow<ClassScheduleItem?> = combine(
        repository.schedules,
        repository.savedDept,
        repository.savedSemester,
        repository.savedSection
    ) { items, dept, sem, sec ->
        val today = getTodayDayName()
        val calendar = Calendar.getInstance()
        val currentMinutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val todayClasses = items.filter {
            (it.department == dept || it.deptCode == dept) &&
            it.semester == sem &&
            it.section.equals(sec, ignoreCase = true) &&
            it.dayName.equals(today, ignoreCase = true)
        }.sortedBy { it.startMinutes }

        // Find upcoming or ongoing
        todayClasses.find { it.endMinutes >= currentMinutes } ?: todayClasses.firstOrNull()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    fun navigateToScreen(screen: AppScreen) {
        _currentScreen.value = screen
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setCategory(category: PinCategory?) {
        _selectedCategory.value = category
    }

    fun selectPin(pin: CampusPin?) {
        _selectedPin.value = pin
    }

    fun setIndoorBuilding(building: Building) {
        _indoorBuilding.value = building
        // Default to Ground floor when switching buildings
        _indoorFloor.value = FloorLevel.GROUND
        _selectedIndoorPin.value = null
    }

    fun setIndoorFloor(floor: FloorLevel) {
        _indoorFloor.value = floor
        _selectedIndoorPin.value = null
    }

    fun selectIndoorPin(pin: CampusPin?) {
        _selectedIndoorPin.value = pin
    }

    fun toggleIndoorRoute() {
        _showIndoorRoute.value = !_showIndoorRoute.value
    }

    fun setNavTarget(pin: CampusPin?) {
        _navTargetPin.value = pin
    }

    fun setScheduleFilter(dept: String, semester: Int, section: String, day: String) {
        _selectedDept.value = dept
        _selectedSemester.value = semester
        _selectedSection.value = section
        _selectedDay.value = day
    }

    fun saveMySchedulePreference(dept: String, semester: Int, section: String) {
        repository.updateSavedSchedule(dept, semester, section)
        _selectedDept.value = dept
        _selectedSemester.value = semester
        _selectedSection.value = section
    }

    // Direct routing shortcuts
    fun locatePinIndoor(pin: CampusPin) {
        if (pin.building == Building.CAMPUS_GROUNDS || pin.floor == FloorLevel.OUTDOOR) {
            // Outdoor pin, open Outdoor Map
            _navTargetPin.value = pin
            _selectedPin.value = null
            _currentScreen.value = AppScreen.OUTDOOR_MAP
        } else {
            // Indoor pin, open Indoor Map and focus
            _indoorBuilding.value = pin.building
            _indoorFloor.value = pin.floor
            _selectedIndoorPin.value = pin
            _selectedPin.value = null
            _currentScreen.value = AppScreen.INDOOR_MAP
        }
    }

    fun locatePinOutdoor(pin: CampusPin) {
        _navTargetPin.value = pin
        _selectedPin.value = null
        _currentScreen.value = AppScreen.OUTDOOR_MAP
    }

    fun locatePinById(pinId: String) {
        val pin = repository.getPinById(pinId)
        if (pin != null) {
            locatePinIndoor(pin)
        }
    }

    fun setResourcesTab(index: Int) {
        _resourcesTabIndex.value = index.coerceIn(0, 3)
    }

    fun setSelectedBusPoint(pointNumber: Int?) {
        _selectedBusPointNumber.value = pointNumber
    }

    fun openBusTimings(pointNumber: Int? = null) {
        _selectedPin.value = null
        _selectedBusPointNumber.value = pointNumber
        _resourcesTabIndex.value = 1
        _currentScreen.value = AppScreen.RESOURCES
    }

    private fun getTodayDayName(): String {
        return when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> "Monday"
            Calendar.TUESDAY -> "Tuesday"
            Calendar.WEDNESDAY -> "Wednesday"
            Calendar.THURSDAY -> "Thursday"
            Calendar.FRIDAY -> "Friday"
            Calendar.SATURDAY -> "Monday" // fallback for weekend viewing
            Calendar.SUNDAY -> "Monday"
            else -> "Monday"
        }
    }
}

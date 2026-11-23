package com.example.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.CampusPin
import com.example.data.model.ClassScheduleItem
import com.example.data.model.PinCategory
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

    // Target pin for outdoor campus GPS guidance
    private val _navTargetPin = MutableStateFlow<CampusPin?>(null)
    val navTargetPin: StateFlow<CampusPin?> = _navTargetPin.asStateFlow()

    // 7-Route Bus & Coaster filter state
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

    fun locatePinOutdoor(pin: CampusPin) {
        _navTargetPin.value = pin
        _selectedPin.value = null
        _currentScreen.value = AppScreen.OUTDOOR_MAP
    }

    fun locatePinById(pinId: String) {
        val pin = repository.getPinById(pinId)
        if (pin != null) {
            locatePinOutdoor(pin)
        }
    }

    fun setSelectedBusPoint(pointNumber: Int?) {
        _selectedBusPointNumber.value = pointNumber
    }

    fun openBusTimings(pointNumber: Int? = null) {
        _selectedPin.value = null
        _selectedBusPointNumber.value = pointNumber
        _currentScreen.value = AppScreen.BUSES
    }

    private fun getTodayDayName(): String {
        return when (Calendar.getInstance().get(Calendar.DAY_OF_WEEK)) {
            Calendar.MONDAY -> "Monday"
            Calendar.TUESDAY -> "Tuesday"
            Calendar.WEDNESDAY -> "Wednesday"
            Calendar.THURSDAY -> "Thursday"
            Calendar.FRIDAY -> "Friday"
            Calendar.SATURDAY -> "Monday"
            Calendar.SUNDAY -> "Monday"
            else -> "Monday"
        }
    }
}

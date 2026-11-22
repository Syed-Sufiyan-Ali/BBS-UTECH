package com.example.data.model

enum class Building(val displayName: String, val shortName: String) {
    OLD_BUILDING("Old Academic & Admin Complex", "Old Building"),
    NEW_BUILDING("New Academic & Skill Complex", "New Building"),
    CAMPUS_GROUNDS("Campus Grounds & Amenities", "Campus Area")
}

enum class FloorLevel(val displayName: String, val code: String, val levelIndex: Int) {
    GROUND("Ground Floor", "G", 0),
    FIRST("1st Floor", "1F", 1),
    SECOND("2nd Floor", "2F", 2),
    OUTDOOR("Outdoor Ground", "EXT", -1)
}

enum class PinCategory(val label: String, val iconName: String) {
    ADMIN("Administration & Officers", "admin"),
    ACADEMIC("Departments & Lecture Halls", "academic"),
    LAB("Labs & Workshops", "lab"),
    LIBRARY("Library & Digital Center", "library"),
    STUDENT_SERVICE("Student Services & Helpdesk", "service"),
    AMENITY("Cafeteria, Mosque & Amenities", "amenity"),
    TRANSPORT_GATE("Gates & Transport Points", "gate")
}

data class CampusPin(
    val id: String,
    val name: String,
    val subTitle: String,
    val building: Building,
    val floor: FloorLevel,
    val category: PinCategory,
    val roomNumber: String,
    val latitude: Double,
    val longitude: Double,
    val indoorX: Float, // 0.0f..1.0f on floor canvas
    val indoorY: Float, // 0.0f..1.0f on floor canvas
    val inCharge: String,
    val timings: String,
    val contact: String,
    val description: String,
    val indoorGuide: String,
    val outdoorGuide: String,
    val tags: List<String> = emptyList(),
    val mapLabel: String = ""
)

data class ClassScheduleItem(
    val id: String,
    val department: String,
    val deptCode: String,
    val semester: Int,
    val section: String,
    val dayName: String, // Monday, Tuesday, Wednesday, Thursday, Friday
    val subjectCode: String,
    val subjectTitle: String,
    val timeSlot: String,
    val startMinutes: Int, // minutes from midnight
    val endMinutes: Int,
    val instructor: String,
    val locationPinId: String,
    val roomLabel: String,
    val isLab: Boolean = false
)

data class AcademicResource(
    val id: String,
    val title: String,
    val category: String, // Portals, Curriculum, Past Papers, Calendar, Transport, Freshmen Guide
    val description: String,
    val details: String,
    val externalUrl: String? = null,
    val actionText: String = "View Details",
    val tags: List<String> = emptyList()
)

data class FacultyMember(
    val id: String,
    val name: String,
    val designation: String,
    val department: String,
    val email: String,
    val phoneExt: String,
    val officePinId: String,
    val roomName: String,
    val qualification: String
)

data class CampusNotice(
    val id: String,
    val title: String,
    val date: String,
    val category: String,
    val summary: String,
    val isHighPriority: Boolean = false
)

data class UserLocation(
    val latitude: Double,
    val longitude: Double,
    val isSimulated: Boolean = false,
    val label: String = "My Current Location",
    val accuracyMeters: Float? = null
)

data class BusStopTiming(
    val stopName: String,
    val cityArea: String,
    val morningPickup: String,
    val note: String = ""
)

data class BusPointRoute(
    val pointNumber: Int,
    val busTitle: String,
    val busNumber: String,
    val corridorSummary: String,
    val citiesCovered: List<String>,
    val morningStartTime: String,
    val campusArrivalTime: String,
    val afternoonDepartureTime: String,
    val driverOrIncharge: String,
    val contactPhone: String,
    val stops: List<BusStopTiming>
)

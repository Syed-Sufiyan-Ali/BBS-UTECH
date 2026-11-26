package com.example.data.repository

import com.example.data.model.AcademicResource
import com.example.data.model.Building
import com.example.data.model.BusPointRoute
import com.example.data.model.BusStopTiming
import com.example.data.model.CampusNotice
import com.example.data.model.CampusPin
import com.example.data.model.ClassScheduleItem
import com.example.data.model.FacultyMember
import com.example.data.model.FloorLevel
import com.example.data.model.PinCategory
import com.example.data.model.UserLocation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

class CampusRepository {

    // Verified center coordinates of BBSUTSD (27°30'39"N 68°44'30"E, near Civil Hospital / Hami Road, Khairpur Mirs)
    companion object {
        const val BBSUTSD_LAT = 27.5108
        const val BBSUTSD_LNG = 68.7416
        const val CAMPUS_RADIUS_METERS = 360.0 // Full campus grounds span

        val PRESET_USER_LOCATIONS = listOf(
            UserLocation(27.510977, 68.743880, true, "Main Gates (Old & New Buildings)")
        )
    }

    private val _allPins = MutableStateFlow<List<CampusPin>>(generateCampusPins())
    val allPins: StateFlow<List<CampusPin>> = _allPins.asStateFlow()

    private val _schedules = MutableStateFlow<List<ClassScheduleItem>>(generateScheduleItems())
    val schedules: StateFlow<List<ClassScheduleItem>> = _schedules.asStateFlow()

    private val _resources = MutableStateFlow<List<AcademicResource>>(generateAcademicResources())
    val resources: StateFlow<List<AcademicResource>> = _resources.asStateFlow()

    private val _faculty = MutableStateFlow<List<FacultyMember>>(generateFacultyDirectory())
    val faculty: StateFlow<List<FacultyMember>> = _faculty.asStateFlow()

    private val _notices = MutableStateFlow<List<CampusNotice>>(generateNotices())
    val notices: StateFlow<List<CampusNotice>> = _notices.asStateFlow()

    private val _busPointRoutes = MutableStateFlow<List<BusPointRoute>>(generateBusPointRoutes())
    val busPointRoutes: StateFlow<List<BusPointRoute>> = _busPointRoutes.asStateFlow()

    // Saved student preference for quick timetable view
    private val _savedDept = MutableStateFlow("Computer Systems Engineering")
    val savedDept: StateFlow<String> = _savedDept.asStateFlow()

    private val _savedSemester = MutableStateFlow(1)
    val savedSemester: StateFlow<Int> = _savedSemester.asStateFlow()

    private val _savedSection = MutableStateFlow("A")
    val savedSection: StateFlow<String> = _savedSection.asStateFlow()

    fun updateSavedSchedule(dept: String, semester: Int, section: String) {
        _savedDept.value = dept
        _savedSemester.value = semester
        _savedSection.value = section
    }

    fun getPinById(id: String): CampusPin? {
        return _allPins.value.find { it.id == id }
    }

    fun getPinsForBuildingAndFloor(building: Building, floor: FloorLevel): List<CampusPin> {
        return _allPins.value.filter { it.building == building && it.floor == floor }
    }

    fun searchPins(query: String): List<CampusPin> {
        val q = query.trim().lowercase()
        if (q.isEmpty()) return _allPins.value
        return _allPins.value.filter { pin ->
            pin.name.lowercase().contains(q) ||
            pin.mapLabel.lowercase().contains(q) ||
            pin.subTitle.lowercase().contains(q) ||
            pin.roomNumber.lowercase().contains(q) ||
            pin.inCharge.lowercase().contains(q) ||
            pin.building.displayName.lowercase().contains(q) ||
            pin.tags.any { it.lowercase().contains(q) }
        }
    }

    // Haversine distance in meters
    fun calculateDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371000.0 // meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return earthRadius * c
    }

    // Compass bearing in degrees (0..360)
    fun calculateBearing(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Float {
        val phi1 = Math.toRadians(lat1)
        val phi2 = Math.toRadians(lat2)
        val deltaLambda = Math.toRadians(lon2 - lon1)
        val y = sin(deltaLambda) * cos(phi2)
        val x = cos(phi1) * sin(phi2) - sin(phi1) * cos(phi2) * cos(deltaLambda)
        val bearing = Math.toDegrees(atan2(y, x))
        return ((bearing + 360) % 360).toFloat()
    }

    private fun generateCampusPins(): List<CampusPin> {
        return listOf(
            CampusPin(
                id = "new_1_smart_class",
                name = "Smart Class Room (CR-101 to CR-106)",
                subTitle = "Smart Academic Classrooms",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.ACADEMIC,
                roomNumber = "NB-110",
                latitude = 27.512277,
                longitude = 68.742401,
                indoorX = 0.75f,
                indoorY = 0.65f,
                inCharge = "Academic Coordinator",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Multimedia-equipped smart lecture rooms for Computing, AI, and Technology classes.",
                indoorGuide = "Located along the North-East academic walkway.",
                outdoorGuide = "North-East wing near Workshops & Hostels junction (27.512277, 68.742401).",
                tags = listOf("smart", "smart class", "smart classroom", "classroom", "cr101", "lecture"),
                mapLabel = "Smart Class Room"
            ),
            CampusPin(
                id = "campus_cafeteria",
                name = "BBSUTSD Central Cafeteria",
                subTitle = "Student Cafeteria, Meals, Tea & Snacks",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.AMENITY,
                roomNumber = "CANTEEN",
                latitude = 27.513138,
                longitude = 68.741641,
                indoorX = 0.45f,
                indoorY = 0.75f,
                inCharge = "Canteen Administration",
                timings = "08:00 AM - 05:00 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "BBSUTSD Central Cafeteria serving hot meals, Karak chai, cold drinks, and snacks for students and staff.",
                indoorGuide = "Central Cafeteria complex (GP7R+7M2) on the northern campus grounds.",
                outdoorGuide = "Northern campus cafeteria grounds near the Workshop & Hostel access road (27.513138, 68.741641).",
                tags = listOf("canteen", "cafeteria", "central cafeteria", "food", "chai", "tea", "lunch"),
                mapLabel = "Central Cafeteria"
            ),
            CampusPin(
                id = "campus_transport",
                name = "Student Point Parking & Points Stop",
                subTitle = "University Buses, Coasters, HiAces & Points Stop",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.TRANSPORT_GATE,
                roomNumber = "POINT-PARKING",
                latitude = 27.511694,
                longitude = 68.742806,
                indoorX = 0.92f,
                indoorY = 0.25f,
                inCharge = "Transport Incharge",
                timings = "Morning Arrival: 08:00 AM | Departure: 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Main boarding & parking terminal (Points Stop) for university student point buses, coasters, HiAces, and campus ambulance serving surrounding towns.",
                indoorGuide = "Located at the verified Points Stop bay (27°30'42.1\"N 68°44'34.1\"E / 27.511694, 68.742806).",
                outdoorGuide = "Campus Points Stop terminal at 27.511694, 68.742806.",
                tags = listOf("points stop", "point stops", "point stop", "parking", "point", "student point parking", "bus", "coaster", "hiace", "bus stop"),
                mapLabel = "Points Stop"
            ),
            CampusPin(
                id = "hod_prof_saleem",
                name = "Dr. Saleem HOD Office — Prof. Muhammad Saleem",
                subTitle = "Head of Department Office (Dr. Muhammad Saleem)",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.ADMIN,
                roomNumber = "HOD-SALEEM",
                latitude = 27.510900,
                longitude = 68.744500,
                indoorX = 0.90f,
                indoorY = 0.28f,
                inCharge = "Dr. Prof. Muhammad Saleem (HOD)",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Office of Head of Department Dr. Muhammad Saleem at BBSUTSD Khairpur Mirs.",
                indoorGuide = "Located at Dr. Saleem HOD Office wing (27.510900, 68.744500).",
                outdoorGuide = "East Campus HOD office at 27.510900, 68.744500.",
                tags = listOf("hod", "dr saleem", "prof muhammad saleem", "muhammad saleem", "saleem", "prof saleem", "hod saleem", "office"),
                mapLabel = "Dr. Saleem HOD Office"
            ),
            CampusPin(
                id = "central_library",
                name = "BBSUTSD Central Library",
                subTitle = "Central & Digital Reference Library",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LIBRARY,
                roomNumber = "CENTRAL-LIB",
                latitude = 27.512831,
                longitude = 68.742349,
                indoorX = 0.52f,
                indoorY = 0.45f,
                inCharge = "Chief Librarian",
                timings = "08:30 AM - 08:30 PM (Mon - Fri)",
                contact = "library@bbsutsd.edu.pk",
                description = "BBSUTSD Central Library providing textbooks, engineering journals, HEC digital library terminals, past paper archives, and quiet study halls.",
                indoorGuide = "Central Library main reading hall and circulation desk (27.512831, 68.742349).",
                outdoorGuide = "North Campus wing near Central Cafeteria and Smart Classrooms (27.512831, 68.742349).",
                tags = listOf("library", "central library", "digital library", "books", "reading", "study hall", "past papers"),
                mapLabel = "Central Library"
            ),
            CampusPin(
                id = "new_building_mosque",
                name = "New Building Mosque",
                subTitle = "Campus Masjid & Wudu Facility",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.AMENITY,
                roomNumber = "MASJID-NB",
                latitude = 27.510500,
                longitude = 68.744800,
                indoorX = 0.85f,
                indoorY = 0.20f,
                inCharge = "Campus Masjid Committee",
                timings = "Open for All 5 Daily Prayers & Jummah",
                contact = "info@bbsutsd.edu.pk",
                description = "New Building Mosque serving students, faculty, and staff for daily congregational prayers and Friday Jummah.",
                indoorGuide = "Prayer hall and ablution (wudu) courtyard at 27.510500, 68.744800.",
                outdoorGuide = "East Campus New Building Mosque grounds (27.510500, 68.744800).",
                tags = listOf("mosque", "masjid", "new building mosque", "namaz", "prayer", "jummah", "wudu"),
                mapLabel = "New Building Mosque"
            ),
            CampusPin(
                id = "gate_main",
                name = "Main Gates (Old & New Buildings)",
                subTitle = "Main Campus Entrance Gates — Both Buildings",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.TRANSPORT_GATE,
                roomNumber = "MAIN-GATE",
                latitude = 27.510977,
                longitude = 68.743880,
                indoorX = 0.50f,
                indoorY = 0.08f,
                inCharge = "Campus Security Office",
                timings = "24/7 Campus Security Entry",
                contact = "security@bbsutsd.edu.pk",
                description = "Main campus gates serving both the Old Building and New Building complexes via Sohu Kanaserah / Hami Road.",
                indoorGuide = "Main security checkpoint and entrance road for both campus buildings (27.510977, 68.743880).",
                outdoorGuide = "Main Campus Gates on Sohu Kanaserah Rd (27.510977, 68.743880).",
                tags = listOf("main gate", "main gates", "gate", "gates", "entrance", "both buildings", "old building gate", "new building gate", "security"),
                mapLabel = "Main Gates"
            ),
            CampusPin(
                id = "electronics_lab",
                name = "Electronics Lab",
                subTitle = "Electronics & Instrumentation Laboratory (Below Computer Lab 1)",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LAB,
                roomNumber = "ELEC-LAB",
                latitude = 27.510800,
                longitude = 68.744700,
                indoorX = 0.78f,
                indoorY = 0.34f,
                inCharge = "Electrical & Electronics Lab Staff",
                timings = "08:30 AM - 04:00 PM (Mon - Fri)",
                contact = "ee@bbsutsd.edu.pk",
                description = "Electronics Lab equipped with oscilloscopes, function generators, digital trainers, and circuit analysis workbenches directly beneath Computer Lab 1.",
                indoorGuide = "New Building Electronics Lab directly below 2nd Floor Computer Lab 1 (27.510800, 68.744700).",
                outdoorGuide = "New Building wing near Dr. Saleem HOD Office and Mosque (27.510800, 68.744700).",
                tags = listOf("electronics", "electronics lab", "lab", "circuits", "oscilloscope", "ee lab", "instrumentation"),
                mapLabel = "Electronics Lab"
            ),
            CampusPin(
                id = "computer_lab_1",
                name = "Computer Lab 1 (2nd Floor)",
                subTitle = "2nd Floor — Right Above Electronics Lab",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.LAB,
                roomNumber = "CS-LAB-1 (2F)",
                latitude = 27.510800,
                longitude = 68.744700,
                indoorX = 0.78f,
                indoorY = 0.34f,
                inCharge = "CS / IT Lab Administrator",
                timings = "08:30 AM - 04:30 PM (Mon - Fri)",
                contact = "cs@bbsutsd.edu.pk",
                description = "Computer Lab 1 located on the 2nd floor directly above the Electronics Lab, equipped with high-speed workstations for programming, databases, and engineering software.",
                indoorGuide = "2nd Floor — walk up the stairs directly above the Electronics Lab (27.510800, 68.744700).",
                outdoorGuide = "New Building 2nd Floor wing right above the Electronics Lab (27.510800, 68.744700).",
                tags = listOf("computer lab", "computer lab 1", "cs lab", "cs lab 1", "lab", "second floor", "2nd floor", "computing"),
                mapLabel = "Computer Lab 1 (2F)"
            ),
            CampusPin(
                id = "campus_atm",
                name = "Campus ATM",
                subTitle = "24/7 Automated Teller Machine (Near Central Cafeteria)",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.AMENITY,
                roomNumber = "ATM",
                latitude = 27.513132,
                longitude = 68.741812,
                indoorX = 0.34f,
                indoorY = 0.84f,
                inCharge = "Campus Banking Kiosk",
                timings = "Open 24 Hours",
                contact = "info@bbsutsd.edu.pk",
                description = "On-campus 24/7 ATM booth located next to BBSUTSD Central Cafeteria for student and staff cash withdrawals and banking.",
                indoorGuide = "Outdoor ATM kiosk directly east of Central Cafeteria (27.513132, 68.741812).",
                outdoorGuide = "North Campus beside BBSUTSD Central Cafeteria (27.513132, 68.741812).",
                tags = listOf("atm", "bank", "cash", "banking", "withdraw", "machine", "kiosk"),
                mapLabel = "ATM"
            )
        )
    }

    private fun generateScheduleItems(): List<ClassScheduleItem> {
        return listOf(
            // --- CSE Semester 1 Section A ---
            ClassScheduleItem(
                id = "sch_cse_1_mon_1",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "CS-101",
                subjectTitle = "Programming Fundamentals",
                timeSlot = "08:30 AM - 10:00 AM",
                startMinutes = 510,
                endMinutes = 600,
                instructor = "Engr. Faheem Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 1 (2nd Floor)"
            ),
            ClassScheduleItem(
                id = "sch_cse_1_mon_2",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "CS-101L",
                subjectTitle = "Programming Fundamentals Lab",
                timeSlot = "10:15 AM - 01:15 PM",
                startMinutes = 615,
                endMinutes = 795,
                instructor = "Lab Engr. Mujeeb-ur-Rehman",
                locationPinId = "",
                roomLabel = "New Bldg - CS Lab 1 (Ground Floor)",
                isLab = true
            ),
            ClassScheduleItem(
                id = "sch_cse_1_mon_3",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "MATH-101",
                subjectTitle = "Calculus & Analytical Geometry",
                timeSlot = "02:00 PM - 03:30 PM",
                startMinutes = 840,
                endMinutes = 930,
                instructor = "Dr. Mukhtiar Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 1 (2nd Floor)"
            ),

            // Tuesday
            ClassScheduleItem(
                id = "sch_cse_1_tue_1",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Tuesday",
                subjectCode = "PHY-102",
                subjectTitle = "Applied Physics",
                timeSlot = "08:30 AM - 10:00 AM",
                startMinutes = 510,
                endMinutes = 600,
                instructor = "Prof. Zafar Ali",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 1 (2nd Floor)"
            ),
            ClassScheduleItem(
                id = "sch_cse_1_tue_2",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Tuesday",
                subjectCode = "ENG-101",
                subjectTitle = "Functional English",
                timeSlot = "10:30 AM - 12:00 PM",
                startMinutes = 630,
                endMinutes = 720,
                instructor = "Ms. Hina Baloch",
                locationPinId = "new_1_smart_class",
                roomLabel = "New Bldg - Smart Room CR-101"
            ),
            ClassScheduleItem(
                id = "sch_cse_1_tue_3",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Tuesday",
                subjectCode = "ME-103",
                subjectTitle = "Basic Engineering Drawing",
                timeSlot = "01:30 PM - 03:30 PM",
                startMinutes = 810,
                endMinutes = 930,
                instructor = "Lab Engr. Sajjad Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - Mechanical & Drawing Lab (1F)",
                isLab = true
            ),

            // Wednesday
            ClassScheduleItem(
                id = "sch_cse_1_wed_1",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Wednesday",
                subjectCode = "CS-101",
                subjectTitle = "Programming Fundamentals",
                timeSlot = "09:00 AM - 10:30 AM",
                startMinutes = 540,
                endMinutes = 630,
                instructor = "Engr. Faheem Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 1 (2nd Floor)"
            ),
            ClassScheduleItem(
                id = "sch_cse_1_wed_2",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Wednesday",
                subjectCode = "IS-101",
                subjectTitle = "Islamic Studies / Professional Ethics",
                timeSlot = "11:00 AM - 12:30 PM",
                startMinutes = 660,
                endMinutes = 750,
                instructor = "Mr. Ghulam Mustafa",
                locationPinId = "",
                roomLabel = "Old Bldg - Seminar Hall (Ground Floor)"
            ),

            // Thursday
            ClassScheduleItem(
                id = "sch_cse_1_thu_1",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Thursday",
                subjectCode = "PHY-102L",
                subjectTitle = "Applied Physics Lab",
                timeSlot = "08:30 AM - 11:30 AM",
                startMinutes = 510,
                endMinutes = 690,
                instructor = "Dr. Saeed Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - Applied Science Lab (2F)",
                isLab = true
            ),
            ClassScheduleItem(
                id = "sch_cse_1_thu_2",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Thursday",
                subjectCode = "MATH-101",
                subjectTitle = "Calculus Tutorial",
                timeSlot = "12:00 PM - 01:30 PM",
                startMinutes = 720,
                endMinutes = 810,
                instructor = "Dr. Mukhtiar Ahmed",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 1 (2nd Floor)"
            ),

            // Friday
            ClassScheduleItem(
                id = "sch_cse_1_fri_1",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Friday",
                subjectCode = "CS-102",
                subjectTitle = "Information & Communication Technologies (ICT)",
                timeSlot = "08:30 AM - 10:00 AM",
                startMinutes = 510,
                endMinutes = 600,
                instructor = "Engr. Shahida Parveen",
                locationPinId = "",
                roomLabel = "New Bldg - CS Lab 1 & 2 (Ground Floor)"
            ),
            ClassScheduleItem(
                id = "sch_cse_1_fri_2",
                department = "Computer Systems Engineering",
                deptCode = "CSE",
                semester = 1,
                section = "A",
                dayName = "Friday",
                subjectCode = "LIB-100",
                subjectTitle = "Digital Research & Library Orientation",
                timeSlot = "10:15 AM - 11:45 AM",
                startMinutes = 615,
                endMinutes = 705,
                instructor = "Mr. Abdul Rasheed Chandio",
                locationPinId = "",
                roomLabel = "New Bldg - Central Library (1st Floor)"
            ),

            // --- Electrical Engineering Semester 1 ---
            ClassScheduleItem(
                id = "sch_ee_1_mon_1",
                department = "Electrical Engineering",
                deptCode = "EE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "EE-101",
                subjectTitle = "Linear Circuit Analysis",
                timeSlot = "08:30 AM - 10:00 AM",
                startMinutes = 510,
                endMinutes = 600,
                instructor = "Dr. Engr. Ali Asghar Memon",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 2 (2nd Floor)"
            ),
            ClassScheduleItem(
                id = "sch_ee_1_mon_2",
                department = "Electrical Engineering",
                deptCode = "EE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "EE-101L",
                subjectTitle = "Linear Circuit Analysis Lab",
                timeSlot = "10:15 AM - 01:15 PM",
                startMinutes = 615,
                endMinutes = 795,
                instructor = "Lab Engr. Tanveer Hussain",
                locationPinId = "",
                roomLabel = "Old Bldg - Electrical Lab (1st Floor)",
                isLab = true
            ),

            // --- Civil Engineering Semester 1 ---
            ClassScheduleItem(
                id = "sch_ce_1_mon_1",
                department = "Civil Engineering",
                deptCode = "CE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "CE-101",
                subjectTitle = "Engineering Surveying - I",
                timeSlot = "08:30 AM - 10:00 AM",
                startMinutes = 510,
                endMinutes = 600,
                instructor = "Engr. Tariq Hussain",
                locationPinId = "new_1_smart_class",
                roomLabel = "New Bldg - Smart Room CR-102"
            ),
            ClassScheduleItem(
                id = "sch_ce_1_mon_2",
                department = "Civil Engineering",
                deptCode = "CE",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "CE-101L",
                subjectTitle = "Surveying Field Practical",
                timeSlot = "10:30 AM - 01:30 PM",
                startMinutes = 630,
                endMinutes = 810,
                instructor = "Lab Engr. Kamran Soomro",
                locationPinId = "",
                roomLabel = "Campus Ground & Survey Station",
                isLab = true
            ),

            // --- Mechanical Engineering Semester 1 ---
            ClassScheduleItem(
                id = "sch_me_1_mon_1",
                department = "Mechanical Engineering",
                deptCode = "ME",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "ME-101",
                subjectTitle = "Engineering Mechanics (Statics)",
                timeSlot = "09:00 AM - 10:30 AM",
                startMinutes = 540,
                endMinutes = 630,
                instructor = "Engr. Zulfiqar Ali Soomro",
                locationPinId = "",
                roomLabel = "Old Bldg - LT 2 (2nd Floor)"
            ),
            ClassScheduleItem(
                id = "sch_me_1_mon_2",
                department = "Mechanical Engineering",
                deptCode = "ME",
                semester = 1,
                section = "A",
                dayName = "Monday",
                subjectCode = "WS-101",
                subjectTitle = "Workshop Practice (Machining & Welding)",
                timeSlot = "11:00 AM - 02:00 PM",
                startMinutes = 660,
                endMinutes = 840,
                instructor = "Workshop Incharge Maqsood Ahmed",
                locationPinId = "",
                roomLabel = "Central Workshop Complex",
                isLab = true
            )
        )
    }

    private fun generateAcademicResources(): List<AcademicResource> {
        return listOf(
            AcademicResource(
                id = "res_cms_portal",
                title = "BBSUTSD Student CMS & LMS Portal",
                category = "Portals",
                description = "Official portal for course registration, online attendance tracking, semester grades, and LMS lecture handouts.",
                details = "Access your official student portal at http://cms.bbsutsd.edu.pk or lms.bbsutsd.edu.pk. Your username is your 7-digit Roll Number (e.g., 24CS01). Default temporary passwords can be reset via the Campus IT Cell (Old Building, Room OB-208).",
                externalUrl = "http://cms.bbsutsd.edu.pk",
                actionText = "Open CMS Portal",
                tags = listOf("cms", "lms", "portal", "attendance", "grades", "registration")
            ),
            AcademicResource(
                id = "res_freshman_guide",
                title = "Freshman Onboarding & Campus Survival Guide",
                category = "Freshmen Guide",
                description = "Step-by-step checklist for new admissions: Document verification, Student ID Card, Bus pass, and Library card.",
                details = """
                    Welcome to BBSUTSD Khairpur Mirs! Complete these 5 essential steps in your first week:
                    1. Document Verification: Submit your original HSC/Matric marks certificates and Domicile/PRC at Directorate of Admissions (Old Building Ground Floor, Room OB-G05).
                    2. Student ID Card: Get your photo captured at the Student One-Window Reception (New Building, Room NB-G01). Your card is mandatory for gate entry and lab access.
                    3. Library Membership: Visit Central Library (New Building 1st Floor) with 1 passport size photograph and paid fee receipt to activate your library borrowing barcode.
                    4. Transport & Point Bus Card: If commuting from Sukkur, Rohri, Ranipur, or Gambat, deposit point fee at Accounts Section (Old Bldg OB-G04) and collect your Bus Pass from Transport Terminal.
                    5. Academic Attendance Rule: BBSUTSD strictly enforces the 75% minimum attendance rule by PEC / HEC. Falling below 75% bars you from appearing in Semester Final Examinations.
                """.trimIndent(),
                actionText = "Read Checklist",
                tags = listOf("freshman", "guide", "id card", "rules", "new student", "attendance")
            ),
            AcademicResource(
                id = "res_exam_rules",
                title = "Semester Examination Rules & Date Sheets",
                category = "Examinations",
                description = "Official examination guidelines, CGPA calculation formula, probation policies, and re-sit exam criteria.",
                details = """
                    Grading & Exam Policy:
                    - Mid-Term Exams carry 30% weightage, Quizzes/Assignments/Labs carry 20%, and Final Terminal Exam carries 50%.
                    - Passing standard in each theory and practical component is 50%.
                    - GPA / CGPA Scale: Grade A (80%+ / 4.0), Grade B (70-79% / 3.0-3.9), Grade C (60-69% / 2.0-2.9), Grade D (50-59% / 1.0-1.9).
                    - Academic Probation: A student maintaining a CGPA below 2.00 will be placed on 1st Academic Warning. If not improved over consecutive semesters, probation terms apply.
                    - For official transcripts or result inquiries, visit Controller of Examinations (Old Building Ground Floor, Room OB-G03).
                """.trimIndent(),
                actionText = "View Exam Rules",
                tags = listOf("exam", "gpa", "cgpa", "rules", "probation", "date sheet", "marks")
            ),
            AcademicResource(
                id = "res_academic_cal",
                title = "Academic Calendar 2026 - 2027",
                category = "Academic Calendar",
                description = "Semester schedule, mid-term weeks, final examination periods, gazetted national holidays, and sports gala.",
                details = """
                    Key Dates for Current Academic Year:
                    - Fall Semester Commencement: September 15
                    - Course Add / Drop Deadline: September 30
                    - Mid-Term Examinations: November 10 – November 18
                    - Student Sports & Cultural Week: December 05 – December 10
                    - Final Semester Terminal Exams: January 15 – January 28
                    - Semester Break: January 29 – February 10
                    - Spring Semester Commencement: February 15
                    - Gazetted Holidays: Eid Milad-un-Nabi, Quaid-e-Azam Day (Dec 25), Kashmir Day (Feb 5), Pakistan Day (March 23).
                """.trimIndent(),
                actionText = "View Schedule",
                tags = listOf("calendar", "dates", "midterm", "final", "holiday", "sports")
            ),
            AcademicResource(
                id = "res_bus_schedule",
                title = "University Point Bus Routes & Timings (7 Fleet Routes)",
                category = "Transport",
                description = "Daily morning pickup & return routes covering Kotri Kabir, Hingorja, Ahmed Pur, Sukkur, Rohri, Chondko, Sobhodero, Thari Mirwah & Khairpur City.",
                details = """
                    Daily University Bus Fleet (Arrival: 08:25 AM • Return: 03:30 PM):
                    • Bus No:01 (GSF-317): Kotri Kabir (06:40 AM) -> Hingorja (07:00 AM) -> Ranipur -> Gambat -> Campus
                    • Bus No:02 (GSF-321): Ahmed Pur (06:50 AM) -> Pir Goth (07:25 AM) -> Muet Campus -> Civil Hospital -> Campus
                    • Bus No:03 (GSF-319): Sukkur Bus Stand (06:30 AM) -> Rohri City -> Babrlo -> Thehri -> Campus
                    • Bus No:04 (GSF-320): Chondko (06:40 AM) -> Sorah Chowk -> Kot Banglo -> Sugar Mill -> Campus
                    • Bus No:05 (GSF-318): Sobhodero (06:50 AM) -> Ranipur -> Kumb -> Kot Digi -> Mithri -> Campus
                    • Bus No:HINO (GS-9526): Thari Mirwah (06:30 AM) -> Pir Budharo -> Kumb -> Mithri -> Campus
                    • Coaster (GSF-325): Sim Nali (07:40 AM) -> Gharhi Pull -> Civic Center -> Luqman -> Campus
                """.trimIndent(),
                actionText = "View Routes",
                tags = listOf("bus", "transport", "point", "route", "sukkur", "gambat", "ranipur", "chondko", "timings")
            ),
            AcademicResource(
                id = "res_past_papers",
                title = "Digital Past Papers & Course Outlines",
                category = "Curriculum & Papers",
                description = "Mid-term and Final examination past papers archive from 2020-2025 across all engineering and technology departments.",
                details = """
                    Past Exam Papers Archive:
                    - Computer Systems / Software Engineering (Programming, Data Structures, OOP, Database, AI, Computer Networks)
                    - Electrical Engineering (Circuit Analysis, Electronic Devices, Digital Logic, Signals & Systems, Power Transmission)
                    - Civil Engineering (Surveying, Fluid Mechanics, Strength of Materials, Structural Analysis, Concrete Tech)
                    - Mechanical Engineering (Thermodynamics, Engineering Mechanics, CAD/CAM, Manufacturing Processes)
                    - Petroleum Technology (Drilling Engineering, Well Logging, Reservoir Engineering)
                    Hard-bound copies and scanning stations are also accessible in the Central Library Reference Section.
                """.trimIndent(),
                actionText = "Access Library Archive",
                tags = listOf("past papers", "exam papers", "course outline", "syllabus", "notes")
            )
        )
    }

    private fun generateFacultyDirectory(): List<FacultyMember> {
        return listOf(
            FacultyMember(
                id = "fac_1",
                name = "Dr. Engr. Ali Asghar Memon",
                designation = "Associate Professor & Chairman",
                department = "Electrical Engineering",
                email = "a.asghar@bbsutsd.edu.pk",
                phoneExt = "Ext. 205",
                officePinId = "",
                roomName = "Old Building - Room OB-105 (1st Floor)",
                qualification = "Ph.D. Power Electronics (UK)"
            ),
            FacultyMember(
                id = "fac_2",
                name = "Prof. Engr. Tariq Hussain",
                designation = "Professor & Chairman",
                department = "Civil Engineering",
                email = "tariq.civil@bbsutsd.edu.pk",
                phoneExt = "Ext. 201",
                officePinId = "",
                roomName = "Old Building - Room OB-101 (1st Floor)",
                qualification = "M.S. Structural Engineering"
            ),
            FacultyMember(
                id = "fac_3",
                name = "Engr. Faheem Ahmed Baloch",
                designation = "Assistant Professor",
                department = "Computer Systems Engineering",
                email = "faheem.baloch@bbsutsd.edu.pk",
                phoneExt = "Ext. 408",
                officePinId = "",
                roomName = "New Building - CS Lab 1 (Ground Floor)",
                qualification = "M.E. Computer Systems (MUET)"
            ),
            FacultyMember(
                id = "fac_4",
                name = "Dr. Mukhtiar Ahmed",
                designation = "Head of Department (Basic Sciences)",
                department = "Basic Sciences & Humanities",
                email = "mukhtiar.math@bbsutsd.edu.pk",
                phoneExt = "Ext. 301",
                officePinId = "",
                roomName = "Old Building - Room OB-201 (2nd Floor)",
                qualification = "Ph.D. Applied Mathematics"
            ),
            FacultyMember(
                id = "fac_5",
                name = "Dr. Engr. Jahanzeb Khan",
                designation = "Associate Professor & Chairman",
                department = "Artificial Intelligence",
                email = "chairman.ai@bbsutsd.edu.pk",
                phoneExt = "Ext. 508",
                officePinId = "",
                roomName = "New Building - AI Lab (Ground Floor)",
                qualification = "Ph.D. Artificial Intelligence"
            ),
            FacultyMember(
                id = "fac_6",
                name = "Engr. Zulfiqar Ali Soomro",
                designation = "Assistant Professor & Chairman",
                department = "Mechanical Engineering",
                email = "zulfiqar.mech@bbsutsd.edu.pk",
                phoneExt = "Ext. 210",
                officePinId = "",
                roomName = "Old Building - Room OB-109 (1st Floor)",
                qualification = "M.E. Manufacturing Engineering"
            ),
            FacultyMember(
                id = "fac_7",
                name = "Dr. Syed Muhammad Raza Shah",
                designation = "Registrar",
                department = "Central Administration",
                email = "registrar@bbsutsd.edu.pk",
                phoneExt = "Ext. 105",
                officePinId = "",
                roomName = "Old Building - Room OB-G02 (Ground Floor)",
                qualification = "Ph.D. Educational Administration"
            ),
            FacultyMember(
                id = "fac_8",
                name = "Engr. Abdul Hameed Memon",
                designation = "Controller of Examinations",
                department = "Examination Branch",
                email = "controller.exam@bbsutsd.edu.pk",
                phoneExt = "Ext. 110",
                officePinId = "",
                roomName = "Old Building - Room OB-G03 (Ground Floor)",
                qualification = "M.E. Engineering Management"
            ),
            FacultyMember(
                id = "fac_9",
                name = "Dr. Prof. Muhammad Saleem",
                designation = "Head of Department (HOD)",
                department = "Academic Administration & Technology",
                email = "info@bbsutsd.edu.pk",
                phoneExt = "Ext. 312",
                officePinId = "hod_prof_saleem",
                roomName = "Dr. Saleem HOD Office (27.510900, 68.744500)",
                qualification = "Professor & HOD"
            )
        )
    }

    private fun generateNotices(): List<CampusNotice> {
        return listOf(
            CampusNotice(
                id = "not_1",
                title = "Fall Semester Mid-Term Examination Date Sheet Announced",
                date = "November 05, 2026",
                category = "Examinations",
                summary = "The official Mid-Term date sheet for all 1st, 3rd, 5th, and 7th semester batches is now posted. Examinations begin on November 15. Admit cards mandatory.",
                isHighPriority = true
            ),
            CampusNotice(
                id = "not_2",
                title = "HEC Need-Based Scholarship 2026-27 Applications Open",
                date = "November 02, 2026",
                category = "Scholarships",
                summary = "Eligible undergraduate engineering students can collect scholarship forms from the Directorate of Finance (Old Building, Room OB-G04). Deadline: November 25.",
                isHighPriority = true
            ),
            CampusNotice(
                id = "not_3",
                title = "New Digital Library Timings for Mid-Term Prep",
                date = "October 28, 2026",
                category = "Library",
                summary = "Central Digital Library (New Building 1st Floor) will remain open extended hours till 08:30 PM on weekdays to facilitate study sessions.",
                isHighPriority = false
            ),
            CampusNotice(
                id = "not_4",
                title = "Sukkur & Rohri Route Point Bus Timing Adjustment",
                date = "October 20, 2026",
                category = "Transport",
                summary = "Due to road maintenance on National Highway, Route 1 bus will depart Sukkur 10 minutes earlier at 07:15 AM to ensure arrival before 08:15 AM classes.",
                isHighPriority = false
            )
        )
    }

    private fun generateBusPointRoutes(): List<BusPointRoute> {
        return listOf(
            BusPointRoute(
                pointNumber = 1,
                busTitle = "Bus No. 01 — Kotri Kabir / Hingorja to BBSUTSD",
                busNumber = "Bus No:01 (GSF-317)",
                corridorSummary = "Kotri Kabir • Hingorja • Shah G Machine • Gadiji • Ranipur Bypass • Gambat Bypass • Khuhra • Tando Masti • Shah Hussain • Luqman Phatak",
                citiesCovered = listOf("Kotri Kabir", "Hingorja", "Gadiji", "Ranipur", "Gambat", "Khuhra", "Tando Masti", "Khairpur"),
                morningStartTime = "06:40 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Umair Ali Dasti (Driver)",
                contactPhone = "0304-3482840",
                stops = listOf(
                    BusStopTiming("Kotri Kabir", "Kotri Kabir", "06:40 AM", "S.No 1 • Origin"),
                    BusStopTiming("Hingorja", "Hingorja", "07:00 AM"),
                    BusStopTiming("Shah G Machine", "Hingorja Rd", "07:05 AM"),
                    BusStopTiming("Gadiji", "Gadiji", "07:08 AM"),
                    BusStopTiming("Ranipur Bypass", "Ranipur", "07:20 AM"),
                    BusStopTiming("Gambat Bypass", "Gambat", "07:30 AM"),
                    BusStopTiming("Khuhra Bypass", "Khuhra", "07:33 AM"),
                    BusStopTiming("Tando Masti Bypass", "Tando Masti", "07:45 AM"),
                    BusStopTiming("Shah Hussain Bypass", "Khairpur", "08:00 AM"),
                    BusStopTiming("Luqman Phatak", "Khairpur City", "08:10 AM"),
                    BusStopTiming("Chandia Mor", "Khairpur City", "08:15 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival")
                )
            ),
            BusPointRoute(
                pointNumber = 2,
                busTitle = "Bus No. 02 — Ahmed Pur / Khairpur City to BBSUTSD",
                busNumber = "Bus No:02 (GSF-321)",
                corridorSummary = "Ahmed Pur • Dhang • Larik Stop • Pir Goth • Wada Machi • Faizaabad • Maryam Cannon • Muet Campus • Luqman Phatak • Civil Hospital",
                citiesCovered = listOf("Ahmed Pur", "Pir Goth", "Wada Machi", "Faizaabad", "Muet Campus", "Khairpur City"),
                morningStartTime = "06:50 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Abdullah Maitlo (Driver)",
                contactPhone = "0300-9319700",
                stops = listOf(
                    BusStopTiming("Ahmed Pur", "Ahmed Pur", "06:50 AM", "S.No 1 • Origin"),
                    BusStopTiming("Dhang", "Ahmed Pur", "06:55 AM"),
                    BusStopTiming("Larik Stop", "Ahmed Pur", "06:57 AM"),
                    BusStopTiming("Kanhar Mor", "Pir Goth Rd", "07:05 AM"),
                    BusStopTiming("Nako", "Pir Goth Rd", "07:10 AM"),
                    BusStopTiming("Ansari CNG Pump", "Pir Goth Rd", "07:15 AM"),
                    BusStopTiming("Pir Goth (Zahid Hotel)", "Pir Goth", "07:25 AM"),
                    BusStopTiming("Rahooja Stop", "Pir Goth Rd", "07:30 AM"),
                    BusStopTiming("Wada Machi", "Wada Machi", "07:32 AM"),
                    BusStopTiming("Mang Taghar", "Kingri Rd", "07:35 AM"),
                    BusStopTiming("Daud Goth", "Khairpur", "07:40 AM"),
                    BusStopTiming("Faizaabad", "Khairpur", "07:50 AM"),
                    BusStopTiming("Maryam Cannon", "Khairpur", "07:55 AM"),
                    BusStopTiming("National Bank (Main Branch)", "Khairpur City", "08:00 AM"),
                    BusStopTiming("Gharhi Pull", "Khairpur City", "08:05 AM"),
                    BusStopTiming("Muet Campus", "Khairpur City", "08:10 AM"),
                    BusStopTiming("Luqman Phatak", "Khairpur City", "08:15 AM"),
                    BusStopTiming("Civil Hospital", "Khairpur City", "08:20 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival (Dated: 20-10-2026)")
                )
            ),
            BusPointRoute(
                pointNumber = 3,
                busTitle = "Bus No. 03 — Sukkur & Rohri to BBSUTSD",
                busNumber = "Bus No:03 (GSF-319)",
                corridorSummary = "Main Bus Stand Sukkur • IBA Gate • Ayoub Gate • Zero Point • Rohri City • Babrlo • Ubhri • Thehri • Panjhati • Bilawal Parak",
                citiesCovered = listOf("Sukkur", "Rohri", "Babrlo", "Thehri", "Panjhati", "Khairpur"),
                morningStartTime = "06:30 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Altaf Hussain (Driver)",
                contactPhone = "0304-3482840",
                stops = listOf(
                    BusStopTiming("Main Bus Stand Sukkur", "Sukkur", "06:30 AM", "S.No 1 • Origin"),
                    BusStopTiming("IBA Gate", "Sukkur", "06:35 AM"),
                    BusStopTiming("Society Road", "Sukkur", "06:40 AM"),
                    BusStopTiming("Shikarpur Phatak", "Sukkur", "06:45 AM"),
                    BusStopTiming("Ayoub Gate", "Sukkur", "06:50 AM"),
                    BusStopTiming("Shalimar", "Sukkur", "06:55 AM"),
                    BusStopTiming("Hockey Ground", "Sukkur", "07:03 AM"),
                    BusStopTiming("Zero Point", "Sukkur", "07:05 AM"),
                    BusStopTiming("City Point", "Sukkur", "07:10 AM"),
                    BusStopTiming("Beri Chock (Rohri)", "Rohri", "07:20 AM"),
                    BusStopTiming("Rohri City", "Rohri", "07:25 AM"),
                    BusStopTiming("Babrlo (Toll Plaza)", "Babrlo", "07:35 AM"),
                    BusStopTiming("Babrlo Bypass", "Babrlo", "07:40 AM"),
                    BusStopTiming("Ubhri", "Thehri Rd", "07:45 AM"),
                    BusStopTiming("Karamabad", "Thehri Rd", "07:50 AM"),
                    BusStopTiming("Thehri Bypass", "Thehri", "07:55 AM"),
                    BusStopTiming("Thehri Phatak", "Thehri", "08:05 AM"),
                    BusStopTiming("Maryam Cannon", "Khairpur", "08:08 AM"),
                    BusStopTiming("Panjhati", "Khairpur", "08:10 AM"),
                    BusStopTiming("Bilawal Parak", "Khairpur City", "08:15 AM"),
                    BusStopTiming("Chandia Mor", "Khairpur City", "08:20 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival")
                )
            ),
            BusPointRoute(
                pointNumber = 4,
                busTitle = "Bus No. 04 — Chondko to BBSUTSD",
                busNumber = "Bus No:04 (GSF-320)",
                corridorSummary = "Chondko • Sorah Chowk • Kot Banglo • Kot Digi (Sugar Mill Chowk) • Jumani Village • Sugar Mill • Naroo Dhoro • Janwari Goth",
                citiesCovered = listOf("Chondko", "Sorah", "Kot Banglo", "Kot Digi", "Sugar Mill", "Khairpur"),
                morningStartTime = "06:40 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Ghulam Qadir (Driver)",
                contactPhone = "0304-3482840",
                stops = listOf(
                    BusStopTiming("Chondko", "Chondko", "06:40 AM", "S.No 1 • Origin"),
                    BusStopTiming("Sorah Chowk", "Sorah", "07:20 AM"),
                    BusStopTiming("Kot Banglo", "Kot Diji", "07:35 AM"),
                    BusStopTiming("Kot Digi (Sugar Mill Chowk)", "Kot Diji", "07:45 AM"),
                    BusStopTiming("Jumani Village", "Kot Diji Rd", "07:50 AM"),
                    BusStopTiming("Sugar Mill (Gate)", "Khairpur", "08:00 AM"),
                    BusStopTiming("Sugar Mill (Chowk)", "Khairpur", "08:05 AM"),
                    BusStopTiming("Naroo Dhoro", "Khairpur", "08:10 AM"),
                    BusStopTiming("Sohu Kinasra", "Khairpur", "08:15 AM"),
                    BusStopTiming("Bakhar Kinasra", "Khairpur", "08:20 AM"),
                    BusStopTiming("Janwari Goth", "Khairpur", "08:22 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival")
                )
            ),
            BusPointRoute(
                pointNumber = 5,
                busTitle = "Bus No. 05 — Sobhodero / Kumb to BBSUTSD",
                busNumber = "Bus No:05 (GSF-318)",
                corridorSummary = "Sobhodero • Ranipur • Rajpar Village • Jhanda Shakh • Kumb • Arab Solangi • Kot Digi • Kot Banglo • Mithri • Wapda Gate • Burghri Pul",
                citiesCovered = listOf("Sobhodero", "Ranipur", "Kumb", "Kot Digi", "Kot Banglo", "Mithri", "Khairpur"),
                morningStartTime = "06:50 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Abdul Ghani (Driver)",
                contactPhone = "0304-3482840",
                stops = listOf(
                    BusStopTiming("Sobhodero", "Sobhodero", "06:50 AM", "S.No 1 • Origin"),
                    BusStopTiming("Ranipur", "Ranipur", "07:10 AM"),
                    BusStopTiming("Rajpar Village", "Ranipur Rd", "07:13 AM"),
                    BusStopTiming("Jhanda Shakh", "Kumb Rd", "07:15 AM"),
                    BusStopTiming("Kumb", "Kumb", "07:20 AM"),
                    BusStopTiming("Arab Solangi", "Kot Diji Rd", "07:25 AM"),
                    BusStopTiming("Kot Digi", "Kot Diji", "07:35 AM"),
                    BusStopTiming("Kot Banglo", "Kot Diji", "07:40 AM"),
                    BusStopTiming("Mithri", "Khairpur Rd", "07:55 AM"),
                    BusStopTiming("Wapda Gate", "Khairpur", "08:10 AM"),
                    BusStopTiming("Burghri Pul", "Khairpur", "08:15 AM"),
                    BusStopTiming("Chandia Mor", "Khairpur City", "08:20 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival")
                )
            ),
            BusPointRoute(
                pointNumber = 6,
                busTitle = "HINO Bus — Thari Mirwah to BBSUTSD",
                busNumber = "Bus No:HINO (GS-9526)",
                corridorSummary = "Thari Mirwah • Hindyari • Bagh Bachrah • Sui Gas • Pir Budharo • Nangreja • Jhango Stop • Kumb • Kot Banglo • Mithri • Wapda Gate",
                citiesCovered = listOf("Thari Mirwah", "Bagh Bachrah", "Pir Budharo", "Kumb", "Kot Banglo", "Mithri", "Khairpur"),
                morningStartTime = "06:30 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Yasir Hussain (Driver)",
                contactPhone = "0304-3482840",
                stops = listOf(
                    BusStopTiming("Thari Mirwah", "Thari Mirwah", "06:30 AM", "S.No 1 • Origin"),
                    BusStopTiming("Hindyari", "Thari Mirwah Rd", "06:35 AM"),
                    BusStopTiming("Bagh Bachrah", "Thari Mirwah Rd", "06:45 AM"),
                    BusStopTiming("Sui Gas", "Mirwah Rd", "06:50 AM"),
                    BusStopTiming("Pir Budharo", "Mirwah Rd", "07:00 AM"),
                    BusStopTiming("Nangreja", "Kumb Rd", "07:05 AM"),
                    BusStopTiming("Jhango Stop", "Kumb Rd", "07:15 AM"),
                    BusStopTiming("Kumb", "Kumb", "07:25 AM"),
                    BusStopTiming("Arab Solangi", "Kot Diji Rd", "07:30 AM"),
                    BusStopTiming("Kot Banglo", "Kot Diji", "07:45 AM"),
                    BusStopTiming("Mithri", "Khairpur Rd", "07:55 AM"),
                    BusStopTiming("Wapda Gate", "Khairpur", "08:10 AM"),
                    BusStopTiming("Burghri Pul", "Khairpur", "08:15 AM"),
                    BusStopTiming("Chandia Mor", "Khairpur City", "08:20 AM"),
                    BusStopTiming("University (BBSUTSD, KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival")
                )
            ),
            BusPointRoute(
                pointNumber = 7,
                busTitle = "Coaster — Khairpur City to BBS-UTECH",
                busNumber = "COASTER (GSF-325)",
                corridorSummary = "Sim Nali (Luqman) • Sarkhi Mor • Gharhi Pull • Faiz Mehl • National Bank • Civic Center • Khaki Shah Pull • Nim Mor • Civil Hospital",
                citiesCovered = listOf("Sim Nali", "Gharhi Pull", "Faiz Mehl", "Civic Center", "Luqman", "Khairpur City"),
                morningStartTime = "07:40 AM",
                campusArrivalTime = "08:25 AM",
                afternoonDepartureTime = "03:30 PM",
                driverOrIncharge = "Mir Muhammad Maitlo (Driver)",
                contactPhone = "0301-3974440",
                stops = listOf(
                    BusStopTiming("Sim Nali (Luqman)", "Khairpur City", "07:40 AM", "S.No 1 • Origin"),
                    BusStopTiming("Sarkhi Mor", "Khairpur City", "07:45 AM"),
                    BusStopTiming("Gharhi Pull", "Khairpur City", "07:55 AM"),
                    BusStopTiming("Faiz Mehl", "Khairpur City", "07:57 AM"),
                    BusStopTiming("National Bank", "Khairpur City", "08:00 AM"),
                    BusStopTiming("Civic Center", "Khairpur City", "08:05 AM"),
                    BusStopTiming("Khaki Shah Pull", "Khairpur City", "08:10 AM"),
                    BusStopTiming("Nim Mor", "Khairpur City", "08:12 AM"),
                    BusStopTiming("Luqman Phtak", "Khairpur City", "08:15 AM"),
                    BusStopTiming("Civil Hospital", "Khairpur City", "08:18 AM"),
                    BusStopTiming("Chandia Mor", "Khairpur City", "08:20 AM"),
                    BusStopTiming("University (BBS-UTECH KHP)", "BBSUTSD Khairpur", "08:25 AM", "Final Campus Arrival (Dated: 05-08-2026)")
                )
            )
        )
    }
}

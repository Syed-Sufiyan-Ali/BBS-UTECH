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
            UserLocation(27.5097, 68.7405, true, "Main Entrance Gate (Hami Road)"),
            UserLocation(27.5111, 68.7409, true, "VC Office & Admin Complex"),
            UserLocation(27.5104, 68.7422, true, "Academic Complex & Central Library"),
            UserLocation(27.5119, 68.7428, true, "Boys Hostel & Transport Office"),
            UserLocation(27.513138, 68.741641, true, "BBSUTSD Central Cafeteria")
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
            // ================= OLD BUILDING / ADMIN BLOCK - GROUND FLOOR =================
            CampusPin(
                id = "old_g_vc",
                name = "Vice Chancellor Secretariat (VC Office)",
                subTitle = "Executive Office of the Vice Chancellor",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ADMIN,
                roomNumber = "OB-G01",
                latitude = 27.51125,
                longitude = 68.74085,
                indoorX = 0.22f,
                indoorY = 0.25f,
                inCharge = "Prof. (Meritorious) Dr. Rasool Bux Mahar (Vice Chancellor)",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "+92-243-9280168 | vc@bbsutsd.edu.pk",
                description = "Executive secretariat of The Benazir Bhutto Shaheed University of Technology & Skill Development (BBSUTSD). Oversees university governance and academic affairs.",
                indoorGuide = "Enter Old Admin Block main porch, take the left hallway of the central foyer to VC Secretariat (OB-G01).",
                outdoorGuide = "Admin Block Ground Floor, West Wing.",
                tags = listOf("vc", "vs", "vice chancellor", "executive", "admin", "secretariat"),
                mapLabel = "VC Office"
            ),
            CampusPin(
                id = "old_g_registrar",
                name = "Registrar Office",
                subTitle = "University Administration & Official Records",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ADMIN,
                roomNumber = "OB-G02",
                latitude = 27.51122,
                longitude = 68.74105,
                indoorX = 0.35f,
                indoorY = 0.25f,
                inCharge = "Office of the Registrar, BBSUTSD",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "+92-243-9280168 | registrar@bbsutsd.edu.pk",
                description = "Handles official university notifications, statutory bodies, NOCs, academic verification, and university administration.",
                indoorGuide = "From Old Admin Block entrance, head down the left corridor. Room OB-G02 is next to the VC Secretariat.",
                outdoorGuide = "Admin Block Ground Floor.",
                tags = listOf("registrar", "admin", "letters", "noc", "official"),
                mapLabel = "Registrar Office"
            ),
            CampusPin(
                id = "old_g_exam",
                name = "Controller of Examinations (Exam Branch)",
                subTitle = "Results, Transcripts, Degrees & Roll Slips",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ADMIN,
                roomNumber = "OB-G03",
                latitude = 27.51118,
                longitude = 68.74122,
                indoorX = 0.50f,
                indoorY = 0.25f,
                inCharge = "Controller of Examinations",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "exam@bbsutsd.edu.pk",
                description = "Manages semester examination schedules, date sheets, marks certificates, official transcripts, and degree verification.",
                indoorGuide = "Enter Old Building central foyer; the Examinations Branch window is straight ahead.",
                outdoorGuide = "Admin Block Ground Floor Center.",
                tags = listOf("exam", "result", "transcript", "degree", "marksheet", "controller"),
                mapLabel = "Examinations Office"
            ),
            CampusPin(
                id = "old_g_finance",
                name = "Directorate of Finance & Accounts",
                subTitle = "Fee Challans, Scholarships & Clearances",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ADMIN,
                roomNumber = "OB-G04",
                latitude = 27.51110,
                longitude = 68.74135,
                indoorX = 0.68f,
                indoorY = 0.25f,
                inCharge = "Directorate of Finance, BBSUTSD",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "finance@bbsutsd.edu.pk",
                description = "Manages semester tuition fee challans, scholarship disbursements, fee adjustments, and student accounts clearance.",
                indoorGuide = "Turn right from the Old Building central foyer into the East Wing corridor.",
                outdoorGuide = "Admin Block Ground Floor, East Wing.",
                tags = listOf("fee", "challan", "accounts", "finance", "scholarship"),
                mapLabel = "Finance Office"
            ),
            CampusPin(
                id = "old_g_admissions",
                name = "Directorate of Admissions",
                subTitle = "Admission Director Office & Registration",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "OB-G05",
                latitude = 27.51098,
                longitude = 68.74115,
                indoorX = 0.82f,
                indoorY = 0.25f,
                inCharge = "Dr. Ghulam Abbas (Director Admissions)",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "admissions@bbsutsd.edu.pk | admissions.bbsutsd.edu.pk",
                description = "Manages undergraduate, postgraduate, DAE, and skill short-course admissions, entry tests, merit lists, and student registration.",
                indoorGuide = "Ground Floor East Wing of Admin Block, office marked 'Directorate of Admissions'.",
                outdoorGuide = "Accessible from the Admin Block front-east entrance.",
                tags = listOf("admission", "admissions", "director admissions", "freshman", "enrollment", "merit"),
                mapLabel = "Director Admissions"
            ),
            CampusPin(
                id = "old_g_welfare",
                name = "Student Welfare & Student Affairs Office",
                subTitle = "Student Welfare, Scholarships & Support",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "OB-G06",
                latitude = 27.51092,
                longitude = 68.74090,
                indoorX = 0.35f,
                indoorY = 0.70f,
                inCharge = "Directorate of Student Affairs & Welfare",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "studentaffairs@bbsutsd.edu.pk",
                description = "Supports student welfare activities, scholarship/laptop schemes, ID cards, co-curricular societies, and student grievance resolution.",
                indoorGuide = "Ground floor South Wing of Old Building near the Seminar Hall corridor.",
                outdoorGuide = "Admin Block Ground Floor, Student Welfare Wing.",
                tags = listOf("welfare", "student welfare", "student affairs", "scholarship", "support", "grievance"),
                mapLabel = "Student Welfare Office"
            ),
            CampusPin(
                id = "old_g_seminar",
                name = "Old Building Seminar Hall",
                subTitle = "Seminars, Trainings & Academic Events",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ACADEMIC,
                roomNumber = "OB-G08",
                latitude = 27.51100,
                longitude = 68.74072,
                indoorX = 0.55f,
                indoorY = 0.70f,
                inCharge = "Seminar Committee Coordinator",
                timings = "As per Event Schedule",
                contact = "info@bbsutsd.edu.pk",
                description = "Multimedia hall for research proposal workshops, student orientations, and academic seminars.",
                indoorGuide = "Opposite the central staircase in Old Building main foyer.",
                outdoorGuide = "Old Building Ground Floor Rear Wing.",
                tags = listOf("seminar", "hall", "orientation", "event"),
                mapLabel = "Seminar Hall"
            ),

            // ================= OLD BUILDING - 1ST & 2ND FLOOR (ENGINEERING TECH DEPTS, LABS & WORKSHOPS) =================
            CampusPin(
                id = "old_1_civil",
                name = "Dept. of Civil Engineering Technology",
                subTitle = "Concrete Lab, Soil Mechanics Lab & Civil Office",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LAB,
                roomNumber = "OB-101",
                latitude = 27.51135,
                longitude = 68.74065,
                indoorX = 0.25f,
                indoorY = 0.30f,
                inCharge = "Chairman, Dept. of Civil Engineering Technology",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Houses Civil Engineering Technology classrooms alongside specialized Concrete Laboratory and Soil Mechanics Laboratory for testing & coursework.",
                indoorGuide = "1st Floor West Wing of Old Building.",
                outdoorGuide = "Old Building 1st Floor (Civil Tech Wing).",
                tags = listOf("civil", "concrete lab", "soil mechanics", "lab", "department"),
                mapLabel = "Civil Labs (Concrete & Soil)"
            ),
            CampusPin(
                id = "old_1_electrical",
                name = "Dept. of Electrical Engineering Technology & Labs",
                subTitle = "Power Systems, Machines & High Voltage Labs",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LAB,
                roomNumber = "OB-105",
                latitude = 27.51142,
                longitude = 68.74095,
                indoorX = 0.50f,
                indoorY = 0.30f,
                inCharge = "Chairman, Dept. of Electrical Engineering Technology",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Electrical Machines, Power Systems, Control, and Instrumentation laboratories serving B.E. Tech & DAE Electrical programs.",
                indoorGuide = "1st Floor Central Wing of Old Building.",
                outdoorGuide = "Old Building 1st Floor (Electrical Wing).",
                tags = listOf("electrical", "power", "machines", "lab", "department"),
                mapLabel = "Electrical Labs"
            ),
            CampusPin(
                id = "old_1_mechanical",
                name = "Dept. of Mechanical Engineering Technology & Labs",
                subTitle = "Thermodynamics, Fluids & Heat Transfer Labs",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LAB,
                roomNumber = "OB-109",
                latitude = 27.51146,
                longitude = 68.74128,
                indoorX = 0.75f,
                indoorY = 0.30f,
                inCharge = "Chairman, Dept. of Mechanical Engineering Technology",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Mechanical Engineering Technology faculty wing, Thermodynamics lab, Fluid Mechanics lab, and Applied Mechanics equipment.",
                indoorGuide = "1st Floor East Wing of Old Building (OB-109).",
                outdoorGuide = "Old Building 1st Floor (Mechanical Wing).",
                tags = listOf("mechanical", "thermo", "fluid", "lab", "department"),
                mapLabel = "Mechanical Labs"
            ),
            CampusPin(
                id = "old_1_electronics",
                name = "Dept. of Electronics Engineering Technology & Labs",
                subTitle = "Digital Electronics, Microprocessor & Communication Lab",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LAB,
                roomNumber = "OB-112",
                latitude = 27.51128,
                longitude = 68.74142,
                indoorX = 0.75f,
                indoorY = 0.70f,
                inCharge = "Chairman, Dept. of Electronics Engineering Technology",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Equipped with oscilloscopes, signal trainers, FPGA/microcontroller benches, and analog/digital electronics stations.",
                indoorGuide = "1st Floor East Rear Wing of Old Building.",
                outdoorGuide = "Old Building 1st Floor (Electronics Lab Wing).",
                tags = listOf("electronics", "digital", "microprocessor", "pcb", "lab"),
                mapLabel = "Electronics Lab"
            ),
            CampusPin(
                id = "old_2_basic_sciences",
                name = "Dept. of Basic Sciences (BSRS) & English Lab",
                subTitle = "BSRS Faculty, Applied Math & English Language Lab",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.LAB,
                roomNumber = "OB-201",
                latitude = 27.51115,
                longitude = 68.74058,
                indoorX = 0.25f,
                indoorY = 0.30f,
                inCharge = "HOD Basic Sciences & English",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Houses Basic Sciences & Related Studies (BSRS) and BS English department with communication and spoken English language lab.",
                indoorGuide = "2nd Floor West Wing of Old Building.",
                outdoorGuide = "Old Building Top Floor West.",
                tags = listOf("bsrs", "english", "language lab", "math", "basic sciences"),
                mapLabel = "BSRS & English Lab"
            ),
            CampusPin(
                id = "old_2_physics",
                name = "Dept. of Physics & Applied Physics Lab",
                subTitle = "BS Physics Optics, Laser & Solid State Lab",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.LAB,
                roomNumber = "OB-208",
                latitude = 27.51124,
                longitude = 68.74082,
                indoorX = 0.50f,
                indoorY = 0.30f,
                inCharge = "Chairman, Dept. of Physics",
                timings = "08:30 AM - 03:30 PM (Mon - Fri)",
                contact = "info@bbsutsd.edu.pk",
                description = "Dedicated BS Physics laboratory for optics, electromagnetism, electronics, and material characterization experiments.",
                indoorGuide = "2nd Floor Central Corridor of Old Building.",
                outdoorGuide = "Old Building 2nd Floor.",
                tags = listOf("physics", "bs physics", "optics", "lab"),
                mapLabel = "Physics Lab"
            ),
            CampusPin(
                id = "old_2_lt1",
                name = "Lecture Theatre 1 (LT-1)",
                subTitle = "Tiered Lecture Hall",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.ACADEMIC,
                roomNumber = "OB-210",
                latitude = 27.51104,
                longitude = 68.74060,
                indoorX = 0.35f,
                indoorY = 0.70f,
                inCharge = "Academic Timetable Cell",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Tiered engineering lecture theatre for core classes.",
                indoorGuide = "2nd Floor Rear Wing, Left.",
                outdoorGuide = "Old Building 2nd Floor.",
                tags = listOf("lt1", "lecture", "classroom"),
                mapLabel = "Lecture Theatre 1"
            ),
            CampusPin(
                id = "old_2_lt2",
                name = "Lecture Theatre 2 (LT-2)",
                subTitle = "Tiered Lecture Hall",
                building = Building.OLD_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.ACADEMIC,
                roomNumber = "OB-212",
                latitude = 27.51104,
                longitude = 68.74098,
                indoorX = 0.65f,
                indoorY = 0.70f,
                inCharge = "Academic Timetable Cell",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Tiered engineering lecture theatre for foundation courses.",
                indoorGuide = "2nd Floor Rear Wing, Right.",
                outdoorGuide = "Old Building 2nd Floor.",
                tags = listOf("lt2", "lecture", "classroom"),
                mapLabel = "Lecture Theatre 2"
            ),

            // ================= NEW BUILDING - GROUND FLOOR (CS, AI, PGS, RECEPTION) =================
            CampusPin(
                id = "new_g_reception",
                name = "Student One-Window & PGS Directorate",
                subTitle = "Reception, Postgraduate Studies (PGS) & Helpdesk",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "NB-G01",
                latitude = 27.51052,
                longitude = 68.74208,
                indoorX = 0.50f,
                indoorY = 0.18f,
                inCharge = "Directorate of PGS & Student Helpdesk",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Main reception desk of the New Academic Complex housing Student Helpdesk and Directorate of Postgraduate Studies (PGS).",
                indoorGuide = "Enter New Building glass main entrance; reception counter is in front of the lobby.",
                outdoorGuide = "New Building Ground Floor Main Entrance.",
                tags = listOf("reception", "pgs", "postgraduate", "helpdesk"),
                mapLabel = "New Complex Reception"
            ),
            CampusPin(
                id = "new_g_skill_dir",
                name = "Directorate of Skill Development & Trades",
                subTitle = "Vocational Courses, CIT, Web Dev & Short Courses",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.ADMIN,
                roomNumber = "NB-G04",
                latitude = 27.51060,
                longitude = 68.74188,
                indoorX = 0.25f,
                indoorY = 0.35f,
                inCharge = "Directorate of Skill Development",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Coordinates 6-month trade certificates, DAE skill programs, NAVTTC certifications, CIT, Graphic Designing & Web courses.",
                indoorGuide = "Ground floor West Wing of New Building.",
                outdoorGuide = "New Building Ground Floor West.",
                tags = listOf("skill", "short courses", "vocational", "dae", "cit"),
                mapLabel = "Skill Directorate"
            ),
            CampusPin(
                id = "new_g_cs_lab1",
                name = "Dept. of Computer Science Labs (CS Lab 1 & 2)",
                subTitle = "Programming, OS, Database & Networking Labs",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.LAB,
                roomNumber = "NB-G08",
                latitude = 27.51034,
                longitude = 68.74195,
                indoorX = 0.25f,
                indoorY = 0.70f,
                inCharge = "Chairman, Dept. of Computer Science",
                timings = "08:30 AM - 04:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Main Computer Science laboratories equipped for C++/Java programming, Operating Systems, Databases, Software Engineering, and Networking.",
                indoorGuide = "Ground floor West Wing of New Building, Lab 1 & Lab 2.",
                outdoorGuide = "New Building Ground Floor, South-West Lab Wing.",
                tags = listOf("computer", "cs", "computer science", "lab1", "programming", "coding", "database"),
                mapLabel = "CS Labs"
            ),
            CampusPin(
                id = "new_g_ai_lab",
                name = "Dept. of Artificial Intelligence (AI) Lab",
                subTitle = "Machine Learning, Deep Learning & Data Science Lab",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.LAB,
                roomNumber = "NB-G10",
                latitude = 27.51028,
                longitude = 68.74232,
                indoorX = 0.75f,
                indoorY = 0.70f,
                inCharge = "Chairman, Dept. of Artificial Intelligence",
                timings = "08:30 AM - 04:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "GPU-accelerated workstation lab for BS Artificial Intelligence courses, neural networks, computer vision, and NLP projects.",
                indoorGuide = "Ground floor East Wing of New Building, opposite CS Labs.",
                outdoorGuide = "New Building Ground Floor, South-East Wing.",
                tags = listOf("ai", "artificial intelligence", "machine learning", "lab", "gpu"),
                mapLabel = "AI Lab"
            ),
            CampusPin(
                id = "new_g_medical",
                name = "Campus Medical Unit & Dispensary",
                subTitle = "First Aid & Student Healthcare",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.GROUND,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "NB-G15",
                latitude = 27.51052,
                longitude = 68.74248,
                indoorX = 0.78f,
                indoorY = 0.35f,
                inCharge = "Campus Medical Officer",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Provides campus first-aid treatment, medical checkups, and emergency ambulance dispatch.",
                indoorGuide = "Ground Floor East Wing of New Building.",
                outdoorGuide = "New Building East Ground Entrance.",
                tags = listOf("medical", "doctor", "first aid", "clinic"),
                mapLabel = "Medical Unit"
            ),

            // ================= NEW BUILDING - 1ST & 2ND FLOOR (LIBRARY & ROBOTICS/AI) =================
            CampusPin(
                id = "new_1_library",
                name = "Central Library & Digital Resource Center",
                subTitle = "Books, Research Journals & Digital Library",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.FIRST,
                category = PinCategory.LIBRARY,
                roomNumber = "NB-101",
                latitude = 27.51048,
                longitude = 68.74218,
                indoorX = 0.50f,
                indoorY = 0.35f,
                inCharge = "Chief Librarian, Central Library",
                timings = "08:30 AM - 04:30 PM (Mon - Fri)",
                contact = "library@bbsutsd.edu.pk",
                description = "Central university library housing thousands of engineering, science & technology volumes, national/international journals, cataloging & digital library terminals.",
                indoorGuide = "Take the central staircase in New Building to 1st Floor; Central Library entrance is directly ahead.",
                outdoorGuide = "New Building, 1st Floor Central Block.",
                tags = listOf("library", "central library", "books", "study", "digital library", "journals"),
                mapLabel = "Central Library"
            ),
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
                id = "new_2_auditorium",
                name = "Central University Auditorium",
                subTitle = "Convocations, Conferences & Student Events",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.ACADEMIC,
                roomNumber = "NB-201",
                latitude = 27.51045,
                longitude = 68.74215,
                indoorX = 0.50f,
                indoorY = 0.40f,
                inCharge = "University Events Cell",
                timings = "Event Basis",
                contact = "info@bbsutsd.edu.pk",
                description = "Main auditorium for university convocations, seminars, and student conferences.",
                indoorGuide = "2nd Floor Central Foyer of New Building.",
                outdoorGuide = "New Building Top Floor.",
                tags = listOf("auditorium", "convocation", "event"),
                mapLabel = "Auditorium"
            ),
            CampusPin(
                id = "new_2_automation_lab",
                name = "Dept. of Robotics & AI Lab (Automation & Control)",
                subTitle = "Robotics Trainers, Embedded Control & Automation",
                building = Building.NEW_BUILDING,
                floor = FloorLevel.SECOND,
                category = PinCategory.LAB,
                roomNumber = "NB-206",
                latitude = 27.51038,
                longitude = 68.74185,
                indoorX = 0.25f,
                indoorY = 0.70f,
                inCharge = "Chairman, Dept. of Robotics & Artificial Intelligence",
                timings = "08:30 AM - 04:00 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Specialized lab for Bachelor of Engineering Technology in Robotics & AI featuring robotic arms, PLC trainers, sensors, and autonomous control kits.",
                indoorGuide = "2nd Floor West Wing of New Building (NB-206).",
                outdoorGuide = "New Building 2nd Floor West.",
                tags = listOf("robotics", "automation", "plc", "ai", "scada", "lab"),
                mapLabel = "Robotics & AI Lab"
            ),

            // ================= OUTDOOR CAMPUS LANDMARKS, WORKSHOPS, TRANSPORT & AMENITIES =================
            CampusPin(
                id = "gate_main",
                name = "Main Entrance Gate (Hami Road / Civil Hospital Rd)",
                subTitle = "University Security Checkpost",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.TRANSPORT_GATE,
                roomNumber = "GATE-01",
                latitude = 27.50965,
                longitude = 68.74050,
                indoorX = 0.10f,
                indoorY = 0.90f,
                inCharge = "Campus Security Office",
                timings = "24/7 Security",
                contact = "+92-243-9280168",
                description = "Primary university entrance facing Civil Hospital Road / Hami Road, Khairpur Mirs.",
                indoorGuide = "Outdoor main campus entry point.",
                outdoorGuide = "South-West boundary entrance on Hami Road.",
                tags = listOf("gate", "entrance", "security", "hami road"),
                mapLabel = "Main Gate"
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
                id = "campus_mosque",
                name = "Jamia Masjid BBSUTSD (Campus Mosque)",
                subTitle = "Central Prayer Hall & Wudu Area",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.AMENITY,
                roomNumber = "MASJID",
                latitude = 27.51055,
                longitude = 68.74060,
                indoorX = 0.35f,
                indoorY = 0.60f,
                inCharge = "Campus Mosque Committee",
                timings = "Open for All Daily Prayers & Jumu'ah",
                contact = "info@bbsutsd.edu.pk",
                description = "Central campus mosque serving daily congregational prayers and Friday Jumu'ah.",
                indoorGuide = "Outdoor mosque compound near the front lawn.",
                outdoorGuide = "West side lawn near Main Gate and Old Building.",
                tags = listOf("mosque", "masjid", "prayer", "namaz"),
                mapLabel = "Campus Mosque"
            ),
            CampusPin(
                id = "campus_workshops",
                name = "Central Mechanical & Auto Workshop",
                subTitle = "Machining, Welding, Foundry, Auto & Diesel / RAC",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.LAB,
                roomNumber = "WS-MECH",
                latitude = 27.51175,
                longitude = 68.74170,
                indoorX = 0.85f,
                indoorY = 0.20f,
                inCharge = "Workshop Superintendent (Mechanical Tech)",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Heavy Mechanical Engineering Technology workshop containing lathes, milling machines, welding bays, foundry, Auto & Diesel engines, and RAC bays.",
                indoorGuide = "Dedicated industrial workshop block in the northern campus zone.",
                outdoorGuide = "North of the academic blocks along the workshop access lane.",
                tags = listOf("workshop", "mechanical workshop", "welding", "machining", "auto", "diesel", "rac"),
                mapLabel = "Mechanical Workshop"
            ),
            CampusPin(
                id = "ws_civil",
                name = "Civil Engineering Workshop & Survey Yard",
                subTitle = "Masonry, Plumbing, Surveying & Material Testing",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.LAB,
                roomNumber = "WS-CIVIL",
                latitude = 27.51162,
                longitude = 68.74122,
                indoorX = 0.70f,
                indoorY = 0.15f,
                inCharge = "Civil Workshop Instructor",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Practical training yard and workshop for Civil Engineering Technology (total station surveying, carpentry, masonry, and aggregate prep).",
                indoorGuide = "Workshop Block West Bay.",
                outdoorGuide = "Adjacent to the Central Mechanical Workshop block.",
                tags = listOf("civil workshop", "survey", "masonry", "workshop"),
                mapLabel = "Civil Workshop"
            ),
            CampusPin(
                id = "ws_electrical",
                name = "Electrical & Wiring Workshop",
                subTitle = "Motor Winding, Switchgear & Power Installations",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.LAB,
                roomNumber = "WS-ELEC",
                latitude = 27.51170,
                longitude = 68.74198,
                indoorX = 0.88f,
                indoorY = 0.25f,
                inCharge = "Electrical Workshop Instructor",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Hands-on Electrical Engineering Technology workshop for industrial wiring, motor winding, transformer testing, and panel board assembly.",
                indoorGuide = "Workshop Block Central-East Bay.",
                outdoorGuide = "Located in the Workshop Complex east of Mechanical Workshop.",
                tags = listOf("electrical workshop", "wiring", "winding", "switchgear", "workshop"),
                mapLabel = "Electrical Workshop"
            ),
            CampusPin(
                id = "ws_electronics",
                name = "Electronics & PCB Fabrication Workshop",
                subTitle = "Soldering, PCB Etching & Embedded Prototyping",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.LAB,
                roomNumber = "WS-ELTR",
                latitude = 27.51152,
                longitude = 68.74220,
                indoorX = 0.90f,
                indoorY = 0.30f,
                inCharge = "Electronics Workshop Instructor",
                timings = "08:30 AM - 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Electronics Engineering Technology practical workshop for circuit assembly, PCB etching, soldering stations, and hardware troubleshooting.",
                indoorGuide = "Workshop Block East Bay.",
                outdoorGuide = "East end of the Campus Workshop Complex.",
                tags = listOf("electronics workshop", "pcb", "soldering", "workshop"),
                mapLabel = "Electronics Workshop"
            ),
            CampusPin(
                id = "hostel_boys",
                name = "Boys Hostel",
                subTitle = "On-Campus Male Student Residence",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "BOYS-HOSTEL",
                latitude = 27.51195,
                longitude = 68.74265,
                indoorX = 0.85f,
                indoorY = 0.15f,
                inCharge = "Hostel Provost & Warden",
                timings = "24/7 Student Residence",
                contact = "info@bbsutsd.edu.pk",
                description = "On-campus residential hostel for male students, situated directly beside the University Transport Office.",
                indoorGuide = "North-East residential zone of the campus.",
                outdoorGuide = "North-East perimeter next to the Transport Office.",
                tags = listOf("hostel", "boys hostel", "residence", "mess"),
                mapLabel = "Boys Hostel"
            ),
            CampusPin(
                id = "campus_transport_office",
                name = "Transport Office",
                subTitle = "Bus Cards, Route Schedules & Fleet Management",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.TRANSPORT_GATE,
                roomNumber = "TRANSPORT-OFF",
                latitude = 27.51182,
                longitude = 68.74288,
                indoorX = 0.90f,
                indoorY = 0.18f,
                inCharge = "Engr. Sameeullah Khan / Imran Ahmed Gilal",
                timings = "08:00 AM - 04:00 PM (Mon - Fri)",
                contact = "0304-3482840 | bbsutsd.edu.pk/transport",
                description = "Official Transport Office (situated next to Boys Hostel). Manages Point 1–5 bus schedules, student bus cards, and commuter routes covering Hingorja/Gambat, Pir Jo Goth, Sukkur/Rohri, Thari Mirwah, and Chondko/Khairpur.",
                indoorGuide = "Situated directly beside the Boys Hostel complex.",
                outdoorGuide = "Next to Boys Hostel & Student Point Parking Bay.",
                tags = listOf("transport", "transport office", "bus card", "pass", "routes", "point", "bus"),
                mapLabel = "Transport Office"
            ),
            CampusPin(
                id = "campus_transport",
                name = "Student Point Parking & Bus Bay",
                subTitle = "University Buses, Coasters, HiAces & Ambulance",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.TRANSPORT_GATE,
                roomNumber = "POINT-PARKING",
                latitude = 27.51162,
                longitude = 68.74295,
                indoorX = 0.92f,
                indoorY = 0.25f,
                inCharge = "Transport Incharge",
                timings = "Morning Arrival: 08:00 AM | Departure: 03:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Main parking & boarding terminal for university student point buses, coasters, HiAces, and campus ambulance serving surrounding towns.",
                indoorGuide = "Outdoor bus parking bay right beside the Transport Office.",
                outdoorGuide = "Adjacent to the Transport Office and Boys Hostel.",
                tags = listOf("parking", "point", "student point parking", "bus", "coaster", "hiace"),
                mapLabel = "Student Point Parking"
            ),
            CampusPin(
                id = "hostel_girls",
                name = "Girls Hostel",
                subTitle = "On-Campus Female Student Residence",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.STUDENT_SERVICE,
                roomNumber = "GIRLS-HOSTEL",
                latitude = 27.51140,
                longitude = 68.74335,
                indoorX = 0.95f,
                indoorY = 0.35f,
                inCharge = "Hostel Warden",
                timings = "24/7 Secured Residence",
                contact = "info@bbsutsd.edu.pk",
                description = "Secured on-campus lodging facility for female students.",
                indoorGuide = "Eastern residential compound.",
                outdoorGuide = "East edge of the campus grounds.",
                tags = listOf("girls hostel", "hostel", "residence"),
                mapLabel = "Girls Hostel"
            ),
            CampusPin(
                id = "campus_sports",
                name = "Sports Ground & Playgrounds",
                subTitle = "Cricket, Football & Campus Lawn",
                building = Building.CAMPUS_GROUNDS,
                floor = FloorLevel.OUTDOOR,
                category = PinCategory.AMENITY,
                roomNumber = "GROUND",
                latitude = 27.51088,
                longitude = 68.74292,
                indoorX = 0.90f,
                indoorY = 0.55f,
                inCharge = "Sports Coordinator",
                timings = "07:00 AM - 06:30 PM",
                contact = "info@bbsutsd.edu.pk",
                description = "Open green sports grounds for cricket, football, athletics, and annual university sports weeks.",
                indoorGuide = "Outdoor playground area on the eastern campus grounds.",
                outdoorGuide = "East of New Academic Complex.",
                tags = listOf("sports", "ground", "playground", "cricket", "football"),
                mapLabel = "Sports Ground"
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
                locationPinId = "old_2_lt1",
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
                locationPinId = "new_g_cs_lab1",
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
                locationPinId = "old_2_lt1",
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
                locationPinId = "old_2_lt1",
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
                locationPinId = "old_1_mechanical",
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
                locationPinId = "old_2_lt1",
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
                locationPinId = "old_g_seminar",
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
                locationPinId = "old_2_basic_sciences",
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
                locationPinId = "old_2_lt1",
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
                locationPinId = "new_g_cs_lab1",
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
                locationPinId = "new_1_library",
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
                locationPinId = "old_2_lt2",
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
                locationPinId = "old_1_electrical",
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
                locationPinId = "campus_sports",
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
                locationPinId = "old_2_lt2",
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
                locationPinId = "campus_workshops",
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
                officePinId = "old_1_electrical",
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
                officePinId = "old_1_civil",
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
                officePinId = "new_g_cs_lab1",
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
                officePinId = "old_2_basic_sciences",
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
                officePinId = "new_g_ai_lab",
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
                officePinId = "old_1_mechanical",
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
                officePinId = "old_g_registrar",
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
                officePinId = "old_g_exam",
                roomName = "Old Building - Room OB-G03 (Ground Floor)",
                qualification = "M.E. Engineering Management"
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

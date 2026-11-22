package com.example

import com.example.data.model.Building
import com.example.data.model.FloorLevel
import com.example.data.repository.CampusRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class ExampleUnitTest {

    private lateinit var repository: CampusRepository

    @Before
    fun setUp() {
        repository = CampusRepository()
    }

    @Test
    fun testCampusPinsCompleteness() {
        val pins = repository.allPins.value
        assertTrue("Campus pins should not be empty", pins.isNotEmpty())

        val oldBuildingPins = pins.filter { it.building == Building.OLD_BUILDING }
        val newBuildingPins = pins.filter { it.building == Building.NEW_BUILDING }
        val groundsPins = pins.filter { it.building == Building.CAMPUS_GROUNDS }

        assertTrue("Old Building should have mapped offices", oldBuildingPins.size >= 8)
        assertTrue("New Building should have mapped labs and classrooms", newBuildingPins.size >= 7)
        assertTrue("Campus grounds should have facilities mapped", groundsPins.size >= 4)
    }

    @Test
    fun testOldBuildingGroundFloorOffices() {
        val groundPins = repository.getPinsForBuildingAndFloor(Building.OLD_BUILDING, FloorLevel.GROUND)
        val roomCodes = groundPins.map { it.roomNumber }

        assertTrue("VC office should be on ground floor", roomCodes.contains("OB-G01"))
        assertTrue("Registrar office should be on ground floor", roomCodes.contains("OB-G02"))
        assertTrue("Exam Branch should be on ground floor", roomCodes.contains("OB-G03"))
        assertTrue("Finance should be on ground floor", roomCodes.contains("OB-G04"))
    }

    @Test
    fun testSearchFunctionality() {
        val searchVc = repository.searchPins("vc")
        assertTrue("Searching for VC should find VC Secretariat", searchVc.any { it.id == "old_g_vc" })

        val searchExam = repository.searchPins("examination")
        assertTrue("Searching for examination should find Exam Branch", searchExam.any { it.id == "old_g_exam" })

        val searchLab = repository.searchPins("programming")
        assertTrue("Searching for programming should find CS Lab 1", searchLab.any { it.id == "new_g_cs_lab1" })
    }

    @Test
    fun testDistanceAndBearingMath() {
        // Point A: Gate 1 (27.52475, 68.75510)
        // Point B: Old Building (27.52585, 68.75570)
        val distance = repository.calculateDistanceMeters(27.52475, 68.75510, 27.52585, 68.75570)
        assertTrue("Distance should be positive and reasonable (~130m)", distance in 80.0..250.0)

        val bearing = repository.calculateBearing(27.52475, 68.75510, 27.52585, 68.75570)
        assertTrue("Bearing should be between 0 and 360", bearing in 0f..360f)
    }

    @Test
    fun testScheduleAndResourcesLoaded() {
        val schedules = repository.schedules.value
        assertTrue("Schedules should have entries", schedules.isNotEmpty())

        val resources = repository.resources.value
        assertTrue("Resources should include CMS and Freshmen Guide", resources.any { it.id == "res_cms_portal" })

        val notices = repository.notices.value
        assertTrue("Notices should not be empty", notices.isNotEmpty())
    }

    @Test
    fun testBbsutsdLandmarksAndReferences() {
        val pins = repository.allPins.value
        val labels = pins.map { it.mapLabel }

        val expectedLabels = listOf(
            "VC Office",
            "Director Admissions",
            "Student Welfare Office",
            "Transport Office",
            "Student Point Parking",
            "University Canteen",
            "Central Library",
            "Civil Labs (Concrete & Soil)",
            "Civil Workshop",
            "Electrical Labs",
            "Electrical Workshop",
            "Mechanical Labs",
            "Mechanical Workshop",
            "Electronics Lab",
            "Electronics Workshop",
            "CS Labs",
            "AI Lab",
            "Robotics & AI Lab",
            "Physics Lab",
            "BSRS & English Lab"
        )
        expectedLabels.forEach { expected ->
            assertTrue("Missing expected BBSUTSD landmark label: $expected", labels.contains(expected))
        }

        repository.schedules.value.forEach { item ->
            assertNotNull("Schedule pin missing: ${item.locationPinId}", repository.getPinById(item.locationPinId))
        }
        repository.faculty.value.forEach { member ->
            assertNotNull("Faculty office pin missing: ${member.officePinId}", repository.getPinById(member.officePinId))
        }
    }

    @Test
    fun testFivePointBusTimetableCompleteness() {
        val routes = repository.busPointRoutes.value
        assertEquals("Should have exactly 5 University Point buses", 5, routes.size)
        assertEquals(listOf(1, 2, 3, 4, 5), routes.map { it.pointNumber })

        val point1 = routes.first { it.pointNumber == 1 }
        assertTrue(
            "Point 1 should serve Gambat & Hingorja",
            point1.citiesCovered.contains("Gambat") && point1.citiesCovered.contains("Hingorja")
        )

        val point3 = routes.first { it.pointNumber == 3 }
        assertTrue(
            "Point 3 should serve Sukkur & Rohri",
            point3.citiesCovered.contains("Sukkur") && point3.citiesCovered.contains("Rohri")
        )

        routes.forEach { route ->
            assertTrue("Point ${route.pointNumber} should have multiple stops", route.stops.size >= 5)
            assertTrue("Point ${route.pointNumber} should arrive at campus", route.campusArrivalTime.isNotBlank())
            assertTrue("Point ${route.pointNumber} should have departure time", route.afternoonDepartureTime.isNotBlank())
        }
    }
}

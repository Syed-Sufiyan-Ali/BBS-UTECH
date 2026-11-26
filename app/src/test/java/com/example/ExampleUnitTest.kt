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
        assertEquals("Should contain only the 10 manually added campus pins", 10, pins.size)

        val ids = pins.map { it.id }.toSet()
        assertTrue(!ids.contains("old_g_vc"))
        assertTrue(!ids.contains("hod_english"))
        assertTrue(ids.contains("new_1_smart_class"))
        assertTrue(ids.contains("campus_cafeteria"))
        assertTrue(ids.contains("campus_transport"))
        assertTrue(ids.contains("hod_prof_saleem"))
        assertTrue(ids.contains("central_library"))
        assertTrue(ids.contains("new_building_mosque"))
        assertTrue(ids.contains("gate_main"))
        assertTrue(ids.contains("electronics_lab"))
        assertTrue(ids.contains("computer_lab_1"))
        assertTrue(ids.contains("campus_atm"))

        val pointsStop = repository.getPinById("campus_transport")!!
        assertEquals(27.511694, pointsStop.latitude, 0.0001)
        assertEquals(68.742806, pointsStop.longitude, 0.0001)

        val drSaleem = repository.getPinById("hod_prof_saleem")!!
        assertEquals(27.510900, drSaleem.latitude, 0.0001)
        assertEquals(68.744500, drSaleem.longitude, 0.0001)

        val library = repository.getPinById("central_library")!!
        assertEquals(27.512831, library.latitude, 0.0001)
        assertEquals(68.742349, library.longitude, 0.0001)

        val mosque = repository.getPinById("new_building_mosque")!!
        assertEquals(27.510500, mosque.latitude, 0.0001)
        assertEquals(68.744800, mosque.longitude, 0.0001)

        val gates = repository.getPinById("gate_main")!!
        assertEquals(27.510977, gates.latitude, 0.0001)
        assertEquals(68.743880, gates.longitude, 0.0001)

        val electronicsLab = repository.getPinById("electronics_lab")!!
        assertEquals(27.510800, electronicsLab.latitude, 0.0001)
        assertEquals(68.744700, electronicsLab.longitude, 0.0001)

        val computerLab1 = repository.getPinById("computer_lab_1")!!
        assertEquals(27.510800, computerLab1.latitude, 0.0001)
        assertEquals(68.744700, computerLab1.longitude, 0.0001)
        assertEquals(FloorLevel.SECOND, computerLab1.floor)

        val atm = repository.getPinById("campus_atm")!!
        assertEquals(27.513132, atm.latitude, 0.0001)
        assertEquals(68.741812, atm.longitude, 0.0001)
    }

    @Test
    fun testNewBuildingFirstFloorClassrooms() {
        val firstFloorPins = repository.getPinsForBuildingAndFloor(Building.NEW_BUILDING, FloorLevel.FIRST)
        val roomCodes = firstFloorPins.map { it.roomNumber }

        assertTrue("Smart Class Room should be on New Building 1st floor", roomCodes.contains("NB-110"))
        assertTrue("Central Library should be on New Building 1st floor", roomCodes.contains("CENTRAL-LIB"))
    }

    @Test
    fun testSearchFunctionality() {
        val searchSmart = repository.searchPins("smart class")
        assertTrue("Searching for smart class should find Smart Class Room", searchSmart.any { it.id == "new_1_smart_class" })

        val searchCafeteria = repository.searchPins("cafeteria")
        assertTrue("Searching for cafeteria should find Central Cafeteria", searchCafeteria.any { it.id == "campus_cafeteria" })

        val searchPointsStop = repository.searchPins("points stop")
        assertTrue("Searching for points stop should find Points Stop", searchPointsStop.any { it.id == "campus_transport" })

        val searchSaleem = repository.searchPins("saleem")
        assertTrue("Searching for Saleem should find Dr. Saleem HOD Office", searchSaleem.any { it.id == "hod_prof_saleem" })

        val searchLibrary = repository.searchPins("central library")
        assertTrue("Searching for central library should find Central Library", searchLibrary.any { it.id == "central_library" })

        val searchMosque = repository.searchPins("mosque")
        assertTrue("Searching for mosque should find New Building Mosque", searchMosque.any { it.id == "new_building_mosque" })

        val searchGates = repository.searchPins("main gates")
        assertTrue("Searching for main gates should find Main Gates", searchGates.any { it.id == "gate_main" })

        val searchElectronics = repository.searchPins("electronics lab")
        assertTrue("Searching for electronics lab should find Electronics Lab", searchElectronics.any { it.id == "electronics_lab" })

        val searchComputerLab = repository.searchPins("computer lab 1")
        assertTrue("Searching for computer lab 1 should find Computer Lab 1", searchComputerLab.any { it.id == "computer_lab_1" })

        val searchAtm = repository.searchPins("atm")
        assertTrue("Searching for atm should find Campus ATM", searchAtm.any { it.id == "campus_atm" })
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
            "Smart Class Room",
            "Central Cafeteria",
            "Points Stop",
            "Dr. Saleem HOD Office",
            "Central Library",
            "New Building Mosque",
            "Main Gates",
            "Electronics Lab",
            "Computer Lab 1 (2F)",
            "ATM"
        )
        expectedLabels.forEach { expected ->
            assertTrue("Missing expected BBSUTSD landmark label: $expected", labels.contains(expected))
        }

        val linkedSchedules = repository.schedules.value.filter { it.locationPinId.isNotBlank() }
        assertTrue("At least one schedule item should link to a manual pin", linkedSchedules.isNotEmpty())
        linkedSchedules.forEach { item ->
            assertNotNull("Schedule pin missing: ${item.locationPinId}", repository.getPinById(item.locationPinId))
        }

        val linkedFaculty = repository.faculty.value.filter { it.officePinId.isNotBlank() }
        assertTrue("At least one faculty member should link to a manual pin", linkedFaculty.isNotEmpty())
        linkedFaculty.forEach { member ->
            assertNotNull("Faculty office pin missing: ${member.officePinId}", repository.getPinById(member.officePinId))
        }
    }

    @Test
    fun testSevenBusFleetTimetableCompleteness() {
        val routes = repository.busPointRoutes.value
        assertEquals("Should have all 7 official university bus & coaster routes", 7, routes.size)
        assertEquals(listOf(1, 2, 3, 4, 5, 6, 7), routes.map { it.pointNumber })

        val bus1 = routes.first { it.pointNumber == 1 }
        assertTrue(
            "Bus 01 should serve Gambat & Hingorja",
            bus1.citiesCovered.contains("Gambat") && bus1.citiesCovered.contains("Hingorja")
        )
        assertEquals(12, bus1.stops.size)

        val bus2 = routes.first { it.pointNumber == 2 }
        assertEquals("0300-9319700", bus2.contactPhone)
        assertEquals(19, bus2.stops.size)

        val bus3 = routes.first { it.pointNumber == 3 }
        assertTrue(
            "Bus 03 should serve Sukkur & Rohri",
            bus3.citiesCovered.contains("Sukkur") && bus3.citiesCovered.contains("Rohri")
        )
        assertEquals(22, bus3.stops.size)

        val coaster = routes.first { it.pointNumber == 7 }
        assertTrue(coaster.busNumber.contains("GSF-325"))
        assertEquals("0301-3974440", coaster.contactPhone)

        routes.forEach { route ->
            assertTrue("Bus ${route.pointNumber} should have at least 12 stops", route.stops.size >= 12)
            assertTrue("Bus ${route.pointNumber} should arrive at campus", route.campusArrivalTime.isNotBlank())
            assertTrue("Bus ${route.pointNumber} should have departure time", route.afternoonDepartureTime.isNotBlank())
        }
    }

    @Test
    fun testDefaultPresetOriginIsMainGatesOnly() {
        assertEquals(1, CampusRepository.PRESET_USER_LOCATIONS.size)
        val preset = CampusRepository.PRESET_USER_LOCATIONS.first()
        assertTrue(preset.label.contains("Main Gates"))
        assertEquals(27.510977, preset.latitude, 0.0001)
        assertEquals(68.743880, preset.longitude, 0.0001)
    }
}

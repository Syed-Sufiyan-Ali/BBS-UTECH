import { describe, expect, it } from 'vitest';
import {
  BBSUTSD_CENTER,
  BUS_POINT_ROUTES,
  CAMPUS_PINS,
  CLASS_SCHEDULES,
  DIVIDING_ROAD_PATH,
  FACULTY_MEMBERS,
  NEW_COMPLEX_ZONE,
  OLD_COMPLEX_ZONE,
  PRESET_USER_LOCATIONS,
} from '../data/campusData';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  evaluateCampusContainment,
  searchPins,
} from '../utils/geo';
import { classifyTurnDelta, computeCampusRoute, isOutsideCampusCoord } from '../utils/routing';
import {
  computeCircleOffsets,
  findClusterKeyForPin,
  groupOverlappingPins,
} from '../utils/spiderfy';

describe('BBSUTSD Web Data & Geospatial Logic', () => {
  it('contains all 16 manually added BBSUTSD landmark pins', () => {
    expect(CAMPUS_PINS.length).toBe(16);
    const ids = new Set(CAMPUS_PINS.map((p) => p.id));
    expect(ids.has('old_g_vc')).toBe(false);
    expect(ids.has('hod_english')).toBe(false);
    expect(ids.has('new_1_smart_class')).toBe(true);
    expect(ids.has('campus_cafeteria')).toBe(true);
    expect(ids.has('campus_transport')).toBe(true);
    expect(ids.has('hod_prof_saleem')).toBe(true);
    expect(ids.has('central_library')).toBe(true);
    expect(ids.has('new_building_mosque')).toBe(true);
    expect(ids.has('gate_main')).toBe(true);
    expect(ids.has('electronics_lab')).toBe(true);
    expect(ids.has('computer_lab_1')).toBe(true);
    expect(ids.has('campus_atm')).toBe(true);
    expect(ids.has('new_audi')).toBe(true);
    expect(ids.has('post_grad_office')).toBe(true);
    expect(ids.has('audi_old')).toBe(true);
    expect(ids.has('vc_secretariat_office')).toBe(true);
    expect(ids.has('swo_office')).toBe(true);
    expect(ids.has('nizam_uddin_memon_office')).toBe(true);
  });

  it('includes Old Complex, New Complex, and Dividing Road overlays', () => {
    expect(OLD_COMPLEX_ZONE.length).toBe(4);
    expect(NEW_COMPLEX_ZONE.length).toBe(4);
    expect(DIVIDING_ROAD_PATH.length).toBeGreaterThanOrEqual(4);
  });

  it('provides all 7 official bus schedules (Bus 01-05, Hino, Coaster) with exact stop timings', () => {
    expect(BUS_POINT_ROUTES.map((r) => r.pointNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const p1 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 1)!;
    const p2 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 2)!;
    const p3 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 3)!;
    const p4 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 4)!;
    const p5 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 5)!;
    const hino = BUS_POINT_ROUTES.find((r) => r.pointNumber === 6)!;
    const coaster = BUS_POINT_ROUTES.find((r) => r.pointNumber === 7)!;

    expect(p1.citiesCovered).toContain('Gambat');
    expect(p1.citiesCovered).toContain('Hingorja');
    expect(p2.contactPhone).toBe('0300-9319700');
    expect(p2.stops.length).toBe(19);
    expect(p3.citiesCovered).toContain('Sukkur');
    expect(p3.stops.length).toBe(22);
    expect(p4.citiesCovered).toContain('Chondko');
    expect(p5.citiesCovered).toContain('Sobhodero');
    expect(hino.busNumber).toContain('GS-9526');
    expect(coaster.busNumber).toContain('GSF-325');
    expect(BUS_POINT_ROUTES.every((r) => r.stops.length >= 12)).toBe(true);
  });

  it('evaluates inside vs outside campus GPS perimeter accurately', () => {
    const inside = evaluateCampusContainment(BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng);
    expect(inside.isInside).toBe(true);
    expect(inside.distanceMeters).toBe(0);

    const outside = evaluateCampusContainment(27.7052, 68.8574); // Sukkur
    expect(outside.isInside).toBe(false);
    expect(outside.distanceMeters).toBeGreaterThan(10000);
  });

  it('searchPins finds manual landmarks by alias, room number, and department', () => {
    expect(searchPins(CAMPUS_PINS, 'smart class').some((p) => p.id === 'new_1_smart_class')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'cafeteria').some((p) => p.id === 'campus_cafeteria')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'points stop').some((p) => p.id === 'campus_transport')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'saleem').some((p) => p.id === 'hod_prof_saleem')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'central library').some((p) => p.id === 'central_library')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'mosque').some((p) => p.id === 'new_building_mosque')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'main gate').some((p) => p.id === 'gate_main')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'electronics lab').some((p) => p.id === 'electronics_lab')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'computer lab 1').some((p) => p.id === 'computer_lab_1')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'atm').some((p) => p.id === 'campus_atm')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'new audi').some((p) => p.id === 'new_audi')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'post grad').some((p) => p.id === 'post_grad_office')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'audi old').some((p) => p.id === 'audi_old')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'vc secrete').some((p) => p.id === 'vc_secretariat_office')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'swo').some((p) => p.id === 'swo_office')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'nizam uddin memon').some((p) => p.id === 'nizam_uddin_memon_office')).toBe(true);
  });

  it('computes walking distance and valid non-empty schedule/faculty pin references', () => {
    const dist = calculateDistanceMeters(27.50965, 68.7405, 27.51125, 68.74085);
    expect(dist).toBeGreaterThan(150);
    expect(dist).toBeLessThan(250);
    expect(estimateWalkMinutes(dist)).toBeGreaterThanOrEqual(2);

    const pinIds = new Set(CAMPUS_PINS.map((p) => p.id));
    const linkedSchedules = CLASS_SCHEDULES.filter((s) => s.locationPinId.trim() !== '');
    expect(linkedSchedules.length).toBeGreaterThan(0);
    expect(linkedSchedules.every((s) => pinIds.has(s.locationPinId))).toBe(true);

    const linkedFaculty = FACULTY_MEMBERS.filter((f) => f.officePinId.trim() !== '');
    expect(linkedFaculty.length).toBeGreaterThan(0);
    expect(linkedFaculty.every((f) => pinIds.has(f.officePinId))).toBe(true);
  });

  it('classifies turn angles into clear Left, Right, and Straight instructions', () => {
    expect(classifyTurnDelta(5).action).toBe('STRAIGHT');
    expect(classifyTurnDelta(35).action).toBe('KEEP_RIGHT');
    expect(classifyTurnDelta(90).action).toBe('RIGHT');
    expect(classifyTurnDelta(-90).action).toBe('LEFT');
    expect(classifyTurnDelta(-35).action).toBe('KEEP_LEFT');
  });

  it('computes multi-segment walkable campus routes between manual landmarks', () => {
    const cafeteria = CAMPUS_PINS.find((p) => p.id === 'campus_cafeteria')!;
    const pointsStop = CAMPUS_PINS.find((p) => p.id === 'campus_transport')!;
    const smartClass = CAMPUS_PINS.find((p) => p.id === 'new_1_smart_class')!;
    const profSaleem = CAMPUS_PINS.find((p) => p.id === 'hod_prof_saleem')!;
    const library = CAMPUS_PINS.find((p) => p.id === 'central_library')!;
    const mosque = CAMPUS_PINS.find((p) => p.id === 'new_building_mosque')!;
    const mainGates = CAMPUS_PINS.find((p) => p.id === 'gate_main')!;
    const electronicsLab = CAMPUS_PINS.find((p) => p.id === 'electronics_lab')!;
    const computerLab1 = CAMPUS_PINS.find((p) => p.id === 'computer_lab_1')!;
    const atm = CAMPUS_PINS.find((p) => p.id === 'campus_atm')!;

    expect(pointsStop.latitude).toBeCloseTo(27.511694, 5);
    expect(pointsStop.longitude).toBeCloseTo(68.742806, 5);
    expect(profSaleem.latitude).toBeCloseTo(27.5109, 5);
    expect(profSaleem.longitude).toBeCloseTo(68.7445, 5);
    expect(library.latitude).toBeCloseTo(27.512831, 5);
    expect(library.longitude).toBeCloseTo(68.742349, 5);
    expect(mosque.latitude).toBeCloseTo(27.5105, 5);
    expect(mosque.longitude).toBeCloseTo(68.7448, 5);
    expect(mainGates.latitude).toBeCloseTo(27.510977, 5);
    expect(mainGates.longitude).toBeCloseTo(68.74388, 5);
    expect(electronicsLab.latitude).toBeCloseTo(27.5108, 5);
    expect(electronicsLab.longitude).toBeCloseTo(68.7447, 5);
    expect(computerLab1.latitude).toBeCloseTo(27.5108, 5);
    expect(computerLab1.longitude).toBeCloseTo(68.7447, 5);
    expect(computerLab1.floor).toBe('SECOND');
    expect(atm.latitude).toBeCloseTo(27.513132, 5);
    expect(atm.longitude).toBeCloseTo(68.741812, 5);

    const pointsToCafeteria = computeCampusRoute(
      { lat: pointsStop.latitude, lng: pointsStop.longitude },
      'Points Stop',
      cafeteria
    );
    expect(pointsToCafeteria.polyline.length).toBeGreaterThan(2);
    expect(pointsToCafeteria.steps[0].action).toBe('START');
    expect(pointsToCafeteria.steps[pointsToCafeteria.steps.length - 1].action).toBe('ARRIVE');
    expect(pointsToCafeteria.totalDistanceMeters).toBeGreaterThan(100);

    const gatesToLibrary = computeCampusRoute(
      { lat: mainGates.latitude, lng: mainGates.longitude },
      'Main Gates',
      library
    );
    expect(gatesToLibrary.polyline.length).toBeGreaterThan(2);
    expect(gatesToLibrary.totalDistanceMeters).toBeGreaterThan(150);

    const smartToMosque = computeCampusRoute(
      { lat: smartClass.latitude, lng: smartClass.longitude },
      'Smart Class Room',
      mosque
    );
    expect(smartToMosque.polyline.length).toBeGreaterThan(2);
    expect(smartToMosque.steps.some((s) => /turn|keep|head/i.test(s.instruction))).toBe(true);

    const atmToComputerLab = computeCampusRoute(
      { lat: atm.latitude, lng: atm.longitude },
      'Campus ATM',
      computerLab1
    );
    expect(atmToComputerLab.polyline.length).toBeGreaterThan(2);
    expect(atmToComputerLab.totalDistanceMeters).toBeGreaterThan(200);
  });

  it('uses edge-projection to find the shortest possible walkable path without backwards detours from live user coordinates', () => {
    const smartClass = CAMPUS_PINS.find((p) => p.id === 'new_1_smart_class')!;
    const midRoadLiveGps = { lat: 27.51145, lng: 68.74222 };
    const route = computeCampusRoute(midRoadLiveGps, 'Your Live Location', smartClass);

    const directMeters = calculateDistanceMeters(
      midRoadLiveGps.lat,
      midRoadLiveGps.lng,
      smartClass.latitude,
      smartClass.longitude
    );
    expect(route.totalDistanceMeters).toBeGreaterThanOrEqual(Math.floor(directMeters));
    expect(route.totalDistanceMeters).toBeLessThan(directMeters + 45);
    expect(route.polyline[0].lat).toBeCloseTo(midRoadLiveGps.lat, 5);
    expect(route.polyline[0].lng).toBeCloseTo(midRoadLiveGps.lng, 5);
    expect(route.steps[0].action).toBe('START');
    expect(route.steps[route.steps.length - 1].action).toBe('ARRIVE');
  });

  it('routes directly for very short intra-courtyard distances without artificial node detours', () => {
    const library = CAMPUS_PINS.find((p) => p.id === 'central_library')!;
    const nearbyUser = { lat: library.latitude - 0.00012, lng: library.longitude + 0.00008 };
    const directMeters = calculateDistanceMeters(
      nearbyUser.lat,
      nearbyUser.lng,
      library.latitude,
      library.longitude
    );
    const route = computeCampusRoute(nearbyUser, 'Your Live Location', library);
    expect(route.totalDistanceMeters).toBeLessThanOrEqual(Math.ceil(directMeters) + 2);
  });

  it('clusters overlapping building pins while keeping standalone offices separate', () => {
    const clusters = groupOverlappingPins(CAMPUS_PINS, 6);
    expect(clusters.length).toBe(13);

    const multiClusters = clusters
      .filter((c) => c.pins.length > 1)
      .map((c) => c.pins.map((p) => p.id).sort());
    expect(multiClusters.length).toBe(3);
    expect(multiClusters).toContainEqual(['computer_lab_1', 'electronics_lab']);
    expect(multiClusters).toContainEqual(['audi_old', 'post_grad_office']);
    expect(multiClusters).toContainEqual(['swo_office', 'vc_secretariat_office']);

    expect(findClusterKeyForPin(clusters, 'computer_lab_1')).not.toBeNull();
    expect(findClusterKeyForPin(clusters, 'electronics_lab')).toBe(
      findClusterKeyForPin(clusters, 'computer_lab_1')
    );
    expect(findClusterKeyForPin(clusters, 'post_grad_office')).toBe(
      findClusterKeyForPin(clusters, 'audi_old')
    );
    expect(findClusterKeyForPin(clusters, 'vc_secretariat_office')).toBe(
      findClusterKeyForPin(clusters, 'swo_office')
    );
    expect(findClusterKeyForPin(clusters, 'hod_prof_saleem')).toBeNull();
    expect(findClusterKeyForPin(clusters, 'nizam_uddin_memon_office')).toBeNull();
    expect(findClusterKeyForPin(clusters, 'new_audi')).toBeNull();
    expect(findClusterKeyForPin(clusters, 'campus_atm')).toBeNull();

    const twoOffsets = computeCircleOffsets(2);
    expect(twoOffsets.length).toBe(2);
    expect(Math.round(twoOffsets[0].x)).toBe(-56);
    expect(Math.round(twoOffsets[1].x)).toBe(56);
    expect(Math.abs(twoOffsets[0].y)).toBeLessThan(0.001);
    expect(Math.abs(twoOffsets[1].y)).toBeLessThan(0.001);

    const fourOffsets = computeCircleOffsets(4);
    expect(fourOffsets.length).toBe(4);
    const radii = fourOffsets.map((o) => Math.hypot(o.x, o.y));
    expect(radii.every((r) => Math.abs(r - radii[0]) < 0.01)).toBe(true);
  });

  it('routes along real campus road turns without diagonal straight-line shortcuts and ingests live OSM roads', () => {
    const cafeteria = CAMPUS_PINS.find((p) => p.id === 'campus_cafeteria')!;
    const library = CAMPUS_PINS.find((p) => p.id === 'central_library')!;
    const mainGates = CAMPUS_PINS.find((p) => p.id === 'gate_main')!;
    const labs = CAMPUS_PINS.find((p) => p.id === 'electronics_lab')!;

    // Cafeteria -> Central Library must turn via Campus West Avenue rather than cutting diagonally
    const cafeToLib = computeCampusRoute(
      { lat: cafeteria.latitude, lng: cafeteria.longitude },
      'Central Cafeteria',
      library
    );
    expect(cafeToLib.polyline.length).toBeGreaterThanOrEqual(4);
    expect(cafeToLib.steps.some((s) => s.action === 'LEFT' || s.action === 'RIGHT')).toBe(true);
    const directCafeToLib = calculateDistanceMeters(
      cafeteria.latitude,
      cafeteria.longitude,
      library.latitude,
      library.longitude
    );
    expect(cafeToLib.totalDistanceMeters).toBeGreaterThan(directCafeToLib + 5);

    // Main Gates -> Electronics Lab must make real corridor turns
    const gatesToLab = computeCampusRoute(
      { lat: mainGates.latitude, lng: mainGates.longitude },
      'Main Gates',
      labs
    );
    expect(gatesToLab.polyline.length).toBeGreaterThanOrEqual(4);
    expect(gatesToLab.steps.some((s) => s.action === 'RIGHT' || s.action === 'LEFT')).toBe(true);

    // Live OSM road polyline injection works seamlessly
    const sampleOsmRoads = [
      [
        { lat: 27.513343, lng: 68.741668 },
        { lat: 27.513008, lng: 68.741874 },
        { lat: 27.512811, lng: 68.741885 },
        { lat: 27.512267, lng: 68.741904 },
        { lat: 27.511843, lng: 68.741913 },
        { lat: 27.511772, lng: 68.742769 },
        { lat: 27.511044, lng: 68.744096 },
      ],
    ];
    const osmEnriched = computeCampusRoute(
      { lat: mainGates.latitude, lng: mainGates.longitude },
      'Main Gates',
      cafeteria,
      sampleOsmRoads
    );
    expect(osmEnriched.polyline.length).toBeGreaterThanOrEqual(5);
    expect(osmEnriched.steps[0].action).toBe('START');
    expect(osmEnriched.steps[osmEnriched.steps.length - 1].action).toBe('ARRIVE');
  });

  it('keeps PRESET_USER_LOCATIONS strictly on Main Gates and routes outside/internal paths without using the small gate', () => {
    expect(PRESET_USER_LOCATIONS.length).toBe(1);
    expect(PRESET_USER_LOCATIONS[0].label).toContain('Main Gates');
    expect(PRESET_USER_LOCATIONS[0].latitude).toBeCloseTo(27.510977, 5);
    expect(PRESET_USER_LOCATIONS[0].longitude).toBeCloseTo(68.74388, 5);

    // Every single one of the 16 manual pins must be inside campus bounds
    for (const pin of CAMPUS_PINS) {
      expect(isOutsideCampusCoord({ lat: pin.latitude, lng: pin.longitude })).toBe(false);
    }

    // Outside approach roads (South approach beyond New Audi & East back perimeter road) must be flagged outside
    expect(isOutsideCampusCoord({ lat: 27.5068, lng: 68.742 })).toBe(true);
    expect(isOutsideCampusCoord({ lat: 27.510959, lng: 68.745268 })).toBe(true);

    const pointsStop = CAMPUS_PINS.find((p) => p.id === 'campus_transport')!;
    const mainGates = CAMPUS_PINS.find((p) => p.id === 'gate_main')!;
    const electronicsLab = CAMPUS_PINS.find((p) => p.id === 'electronics_lab')!;
    const mosque = CAMPUS_PINS.find((p) => p.id === 'new_building_mosque')!;
    const newAudi = CAMPUS_PINS.find((p) => p.id === 'new_audi')!;
    const postGrad = CAMPUS_PINS.find((p) => p.id === 'post_grad_office')!;
    const vcSec = CAMPUS_PINS.find((p) => p.id === 'vc_secretariat_office')!;
    const nizamOffice = CAMPUS_PINS.find((p) => p.id === 'nizam_uddin_memon_office')!;

    // Routes to Electronics Lab, Mosque, and all new pins must stay strictly inside without using the East small gate (lng > 68.74485)
    for (const dest of [electronicsLab, mosque, newAudi, postGrad, vcSec, nizamOffice]) {
      const fromGate = computeCampusRoute(
        { lat: mainGates.latitude, lng: mainGates.longitude },
        'Main Gates',
        dest
      );
      expect(fromGate.polyline.length).toBeGreaterThan(2);
      expect(fromGate.polyline.every((pt) => pt.lng <= 68.74485)).toBe(true);

      const fromPoints = computeCampusRoute(
        { lat: pointsStop.latitude, lng: pointsStop.longitude },
        'Points Stop',
        dest
      );
      expect(fromPoints.polyline.length).toBeGreaterThan(2);
      expect(fromPoints.polyline.every((pt) => pt.lng <= 68.74485)).toBe(true);
    }

    // Outside approach fallback routes strictly via Main Gates first
    const outsideOrigin = { lat: 27.5068, lng: 68.742 };
    const outsideRoute = computeCampusRoute(outsideOrigin, 'Approach', electronicsLab);
    expect(
      outsideRoute.polyline.some(
        (pt) =>
          Math.abs(pt.lat - mainGates.latitude) < 0.0001 &&
          Math.abs(pt.lng - mainGates.longitude) < 0.0001
      )
    ).toBe(true);
    expect(outsideRoute.polyline.every((pt) => pt.lng <= 68.74485)).toBe(true);
  });
});


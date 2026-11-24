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
} from '../data/campusData';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  evaluateCampusContainment,
  searchPins,
} from '../utils/geo';
import { classifyTurnDelta, computeCampusRoute } from '../utils/routing';

describe('BBSUTSD Web Data & Geospatial Logic', () => {
  it('contains only the 6 manually added BBSUTSD landmark pins', () => {
    expect(CAMPUS_PINS.length).toBe(6);
    const ids = new Set(CAMPUS_PINS.map((p) => p.id));
    expect(ids.has('old_g_vc')).toBe(true);
    expect(ids.has('hod_english')).toBe(true);
    expect(ids.has('new_1_smart_class')).toBe(true);
    expect(ids.has('campus_cafeteria')).toBe(true);
    expect(ids.has('campus_transport')).toBe(true);
    expect(ids.has('hod_prof_saleem')).toBe(true);
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
    expect(searchPins(CAMPUS_PINS, 'vc office').some((p) => p.id === 'old_g_vc')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'hod english').some((p) => p.id === 'hod_english')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'smart class').some((p) => p.id === 'new_1_smart_class')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'cafeteria').some((p) => p.id === 'campus_cafeteria')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'points stop').some((p) => p.id === 'campus_transport')).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'saleem').some((p) => p.id === 'hod_prof_saleem')).toBe(true);
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
    const vc = CAMPUS_PINS.find((p) => p.id === 'old_g_vc')!;
    const cafeteria = CAMPUS_PINS.find((p) => p.id === 'campus_cafeteria')!;
    const pointsStop = CAMPUS_PINS.find((p) => p.id === 'campus_transport')!;
    const smartClass = CAMPUS_PINS.find((p) => p.id === 'new_1_smart_class')!;
    const profSaleem = CAMPUS_PINS.find((p) => p.id === 'hod_prof_saleem')!;

    expect(vc.latitude).toBeCloseTo(27.511706, 5);
    expect(vc.longitude).toBeCloseTo(68.742824, 5);
    expect(pointsStop.latitude).toBeCloseTo(27.5105, 5);
    expect(pointsStop.longitude).toBeCloseTo(68.7448, 5);

    const vcToCafeteria = computeCampusRoute(
      { lat: vc.latitude, lng: vc.longitude },
      'VC Office',
      cafeteria
    );
    expect(vcToCafeteria.polyline.length).toBeGreaterThan(2);
    expect(vcToCafeteria.steps[0].action).toBe('START');
    expect(vcToCafeteria.steps[vcToCafeteria.steps.length - 1].action).toBe('ARRIVE');
    expect(vcToCafeteria.totalDistanceMeters).toBeGreaterThan(100);

    const vcToPoints = computeCampusRoute(
      { lat: vc.latitude, lng: vc.longitude },
      'VC Office',
      pointsStop
    );
    expect(vcToPoints.polyline.length).toBeGreaterThan(2);
    expect(vcToPoints.totalDistanceMeters).toBeGreaterThan(180);

    const smartToSaleem = computeCampusRoute(
      { lat: smartClass.latitude, lng: smartClass.longitude },
      'Smart Class Room',
      profSaleem
    );
    expect(smartToSaleem.polyline.length).toBeGreaterThan(2);
    expect(smartToSaleem.steps.some((s) => /turn|keep|head/i.test(s.instruction))).toBe(true);
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
    const vc = CAMPUS_PINS.find((p) => p.id === 'old_g_vc')!;
    const nearbyUser = { lat: vc.latitude - 0.00012, lng: vc.longitude + 0.00008 };
    const directMeters = calculateDistanceMeters(
      nearbyUser.lat,
      nearbyUser.lng,
      vc.latitude,
      vc.longitude
    );
    const route = computeCampusRoute(nearbyUser, 'Your Live Location', vc);
    expect(route.totalDistanceMeters).toBeLessThanOrEqual(Math.ceil(directMeters) + 2);
  });
});

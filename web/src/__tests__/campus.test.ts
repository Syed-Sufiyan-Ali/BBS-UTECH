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
  it('contains all essential BBSUTSD landmark pins including VC Office, labs, workshops, transport & canteen', () => {
    const ids = new Set(CAMPUS_PINS.map((p) => p.id));
    expect(ids.has('old_g_vc')).toBe(true);
    expect(ids.has('old_g_admissions')).toBe(true);
    expect(ids.has('old_g_welfare')).toBe(true);
    expect(ids.has('campus_cafeteria')).toBe(true);
    expect(ids.has('new_1_library')).toBe(true);
    expect(ids.has('campus_transport_office')).toBe(true);
    expect(ids.has('campus_transport')).toBe(true);
    expect(ids.has('campus_workshops')).toBe(true);
    expect(ids.has('ws_civil')).toBe(true);
    expect(ids.has('ws_electrical')).toBe(true);
    expect(ids.has('ws_electronics')).toBe(true);
    expect(ids.has('new_g_cs_lab1')).toBe(true);
    expect(ids.has('new_g_ai_lab')).toBe(true);
    expect(ids.has('new_2_automation_lab')).toBe(true);
  });

  it('includes Old Complex, New Complex, and Dividing Road overlays', () => {
    expect(OLD_COMPLEX_ZONE.length).toBe(4);
    expect(NEW_COMPLEX_ZONE.length).toBe(4);
    expect(DIVIDING_ROAD_PATH.length).toBeGreaterThanOrEqual(4);
  });

  it('provides complete 5-Point bus schedules covering Gambat/Hingorja (P1) and Sukkur (P3)', () => {
    expect(BUS_POINT_ROUTES.map((r) => r.pointNumber)).toEqual([1, 2, 3, 4, 5]);
    const p1 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 1)!;
    const p3 = BUS_POINT_ROUTES.find((r) => r.pointNumber === 3)!;
    expect(p1.citiesCovered).toContain('Gambat');
    expect(p1.citiesCovered).toContain('Hingorja');
    expect(p3.citiesCovered).toContain('Sukkur');
    expect(BUS_POINT_ROUTES.every((r) => r.stops.length >= 8)).toBe(true);
  });

  it('evaluates inside vs outside campus GPS perimeter accurately', () => {
    const inside = evaluateCampusContainment(BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng);
    expect(inside.isInside).toBe(true);
    expect(inside.distanceMeters).toBe(0);

    const outside = evaluateCampusContainment(27.7052, 68.8574); // Sukkur
    expect(outside.isInside).toBe(false);
    expect(outside.distanceMeters).toBeGreaterThan(10000);
  });

  it('searchPins finds landmarks by alias, room number, and department', () => {
    expect(searchPins(CAMPUS_PINS, 'vc office').some((p) => p.id === 'old_g_vc')).toBe(true);
    expect(
      searchPins(CAMPUS_PINS, 'transport').some((p) => p.id === 'campus_transport_office')
    ).toBe(true);
    expect(searchPins(CAMPUS_PINS, 'NB-101').some((p) => p.id === 'new_1_library')).toBe(true);
  });

  it('computes walking distance and valid schedule/faculty pin references', () => {
    const dist = calculateDistanceMeters(27.50965, 68.7405, 27.51125, 68.74085);
    expect(dist).toBeGreaterThan(150);
    expect(dist).toBeLessThan(250);
    expect(estimateWalkMinutes(dist)).toBeGreaterThanOrEqual(2);

    const pinIds = new Set(CAMPUS_PINS.map((p) => p.id));
    expect(CLASS_SCHEDULES.every((s) => pinIds.has(s.locationPinId))).toBe(true);
    expect(FACULTY_MEMBERS.every((f) => pinIds.has(f.officePinId))).toBe(true);
  });

  it('classifies turn angles into clear Left, Right, and Straight instructions', () => {
    expect(classifyTurnDelta(5).action).toBe('STRAIGHT');
    expect(classifyTurnDelta(35).action).toBe('KEEP_RIGHT');
    expect(classifyTurnDelta(90).action).toBe('RIGHT');
    expect(classifyTurnDelta(-90).action).toBe('LEFT');
    expect(classifyTurnDelta(-35).action).toBe('KEEP_LEFT');
  });

  it('computes multi-segment walkable campus routes with turn-by-turn steps between arbitrary landmarks', () => {
    const gate = CAMPUS_PINS.find((p) => p.id === 'gate_main')!;
    const lib = CAMPUS_PINS.find((p) => p.id === 'new_1_library')!;
    const route = computeCampusRoute(
      { lat: gate.latitude, lng: gate.longitude },
      'Main Gate',
      lib
    );
    expect(route.polyline.length).toBeGreaterThan(2); // Must follow road/walkways, never a 2-point straight line
    expect(route.steps.length).toBeGreaterThanOrEqual(3);
    expect(route.steps[0].action).toBe('START');
    expect(route.steps[route.steps.length - 1].action).toBe('ARRIVE');
    expect(route.totalDistanceMeters).toBeGreaterThan(100);

    // Arbitrary origin (VC Office -> Transport Office, NOT anchored to Main Gate)
    const vc = CAMPUS_PINS.find((p) => p.id === 'old_g_vc')!;
    const transport = CAMPUS_PINS.find((p) => p.id === 'campus_transport_office')!;
    const vcToTransport = computeCampusRoute(
      { lat: vc.latitude, lng: vc.longitude },
      'VC Office',
      transport
    );
    expect(vcToTransport.polyline.length).toBeGreaterThan(2);
    expect(vcToTransport.steps.some((s) => /turn|keep|head/i.test(s.instruction))).toBe(true);
  });

  it('uses edge-projection to find the shortest possible walkable path without backwards detours from live user coordinates', () => {
    const lib = CAMPUS_PINS.find((p) => p.id === 'new_1_library')!;
    // User standing mid-edge on Dividing Road between mosque_jct and quad_jct
    const midRoadLiveGps = { lat: 27.51048, lng: 68.74128 };
    const route = computeCampusRoute(midRoadLiveGps, 'Your Live Location', lib);

    const directMeters = calculateDistanceMeters(
      midRoadLiveGps.lat,
      midRoadLiveGps.lng,
      lib.latitude,
      lib.longitude
    );
    // Must stay tightly bounded near optimal walkable distance (no backtracking south to gate/mosque_jct)
    expect(route.totalDistanceMeters).toBeGreaterThanOrEqual(Math.floor(directMeters));
    expect(route.totalDistanceMeters).toBeLessThan(directMeters + 45);
    expect(route.polyline[0].lat).toBeCloseTo(midRoadLiveGps.lat, 5);
    expect(route.polyline[0].lng).toBeCloseTo(midRoadLiveGps.lng, 5);
    expect(route.steps[0].action).toBe('START');
    expect(route.steps[route.steps.length - 1].action).toBe('ARRIVE');
  });

  it('routes directly for very short intra-courtyard distances without artificial node detours', () => {
    const welfare = CAMPUS_PINS.find((p) => p.id === 'old_g_welfare')!;
    const nearbyUser = { lat: welfare.latitude - 0.00012, lng: welfare.longitude + 0.00008 };
    const directMeters = calculateDistanceMeters(
      nearbyUser.lat,
      nearbyUser.lng,
      welfare.latitude,
      welfare.longitude
    );
    const route = computeCampusRoute(nearbyUser, 'Your Live Location', welfare);
    expect(route.totalDistanceMeters).toBeLessThanOrEqual(Math.ceil(directMeters) + 2);
  });
});

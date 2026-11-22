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
});

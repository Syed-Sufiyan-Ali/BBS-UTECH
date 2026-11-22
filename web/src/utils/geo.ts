import type { CampusPin, LatLng } from '../types/campus';
import { BBSUTSD_CENTER, CAMPUS_RADIUS_M } from '../data/campusData';

const EARTH_RADIUS_M = 6371000;

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function isPointInPolygon(lat: number, lng: number, poly: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lat;
    const yi = poly[i].lng;
    const xj = poly[j].lat;
    const yj = poly[j].lng;
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function evaluateCampusContainment(
  lat: number,
  lng: number,
  osmBoundary?: LatLng[] | null
): { isInside: boolean; distanceMeters: number } {
  const centerDist = calculateDistanceMeters(
    lat,
    lng,
    BBSUTSD_CENTER.lat,
    BBSUTSD_CENTER.lng
  );

  if (osmBoundary && osmBoundary.length >= 3) {
    const inside = isPointInPolygon(lat, lng, osmBoundary);
    let minEdgeDist = centerDist;
    for (const pt of osmBoundary) {
      const d = calculateDistanceMeters(lat, lng, pt.lat, pt.lng);
      if (d < minEdgeDist) minEdgeDist = d;
    }
    return {
      isInside: inside,
      distanceMeters: inside ? 0 : Math.round(minEdgeDist),
    };
  }

  const inside = centerDist <= CAMPUS_RADIUS_M;
  return {
    isInside: inside,
    distanceMeters: inside ? 0 : Math.round(centerDist - CAMPUS_RADIUS_M),
  };
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function estimateWalkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 75));
}

export function searchPins(pins: CampusPin[], query: string): CampusPin[] {
  const q = query.trim().toLowerCase();
  if (!q) return pins;
  return pins.filter(
    (pin) =>
      pin.name.toLowerCase().includes(q) ||
      pin.mapLabel.toLowerCase().includes(q) ||
      pin.subTitle.toLowerCase().includes(q) ||
      pin.roomNumber.toLowerCase().includes(q) ||
      pin.inCharge.toLowerCase().includes(q) ||
      pin.building.toLowerCase().includes(q) ||
      pin.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function getTodayDayName(
  date: Date = new Date()
): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' {
  const day = date.getDay();
  switch (day) {
    case 1:
      return 'Monday';
    case 2:
      return 'Tuesday';
    case 3:
      return 'Wednesday';
    case 4:
      return 'Thursday';
    case 5:
      return 'Friday';
    default:
      return 'Monday';
  }
}

export function getCurrentMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

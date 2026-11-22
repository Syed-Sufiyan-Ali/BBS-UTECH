import { BUILDINGS, CAMPUS_PINS } from '../data/campusData';
import type { CampusPin, LatLng } from '../types/campus';
import {
  calculateBearing,
  calculateDistanceMeters,
  estimateWalkMinutes,
  formatDistance,
} from './geo';

export type TurnAction =
  | 'START'
  | 'STRAIGHT'
  | 'KEEP_LEFT'
  | 'LEFT'
  | 'SHARP_LEFT'
  | 'KEEP_RIGHT'
  | 'RIGHT'
  | 'SHARP_RIGHT'
  | 'ARRIVE';

export interface RouteStep {
  id: string;
  action: TurnAction;
  instruction: string;
  streetName: string;
  distanceMeters: number;
  coord: LatLng;
  segmentCoords: LatLng[];
}

export interface ComputedRoute {
  polyline: LatLng[];
  steps: RouteStep[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  usedExternalRoad: boolean;
}

interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

interface GraphEdge {
  to: string;
  streetName: string;
}

const GRAPH_NODES: Record<string, GraphNode> = {
  gate_entry: { id: 'gate_entry', lat: 27.50965, lng: 68.7405, label: 'Main Entrance Gate' },
  gate_plaza: { id: 'gate_plaza', lat: 27.50998, lng: 68.74082, label: 'Main Gate Plaza' },
  mosque_jct: { id: 'mosque_jct', lat: 27.51035, lng: 68.74115, label: 'Masjid & Old Block Turnoff' },
  quad_jct: { id: 'quad_jct', lat: 27.51062, lng: 68.74142, label: 'Canteen & Dividing Road Junction' },
  dividing_center: { id: 'dividing_center', lat: 27.51082, lng: 68.74164, label: 'Campus Dividing Road Center' },
  new_mid_road: { id: 'new_mid_road', lat: 27.51112, lng: 68.74194, label: 'Dividing Road North-East' },
  ws_split: { id: 'ws_split', lat: 27.51145, lng: 68.74222, label: 'Workshops & Hostels Junction' },
  hostel_jct: { id: 'hostel_jct', lat: 27.51172, lng: 68.74256, label: 'Transport & Boys Hostel Junction' },
  transport_plaza: { id: 'transport_plaza', lat: 27.51185, lng: 68.74275, label: 'Transport Terminal Road' },

  // Old Complex Network (West of Dividing Road)
  mosque_walk: { id: 'mosque_walk', lat: 27.51055, lng: 68.7406, label: 'Campus Mosque Walkway' },
  old_porch: { id: 'old_porch', lat: 27.51092, lng: 68.74088, label: 'Old Building Front Porch' },
  old_west: { id: 'old_west', lat: 27.51125, lng: 68.74072, label: 'Old Complex West Wing (VC)' },
  old_center: { id: 'old_center', lat: 27.51118, lng: 68.74105, label: 'Old Complex Central Foyer' },
  old_east: { id: 'old_east', lat: 27.5112, lng: 68.74135, label: 'Old Complex East Wing' },
  old_north: { id: 'old_north', lat: 27.51144, lng: 68.74102, label: 'Old Complex Upper Labs Corridor' },

  // New Complex & Canteen Network (East of Dividing Road)
  canteen_quad: { id: 'canteen_quad', lat: 27.51022, lng: 68.74132, label: 'University Canteen Quad' },
  new_porch: { id: 'new_porch', lat: 27.51056, lng: 68.74202, label: 'New Complex Glass Entrance' },
  new_west: { id: 'new_west', lat: 27.51036, lng: 68.74192, label: 'New Complex West Wing (CS Labs)' },
  new_center: { id: 'new_center', lat: 27.51046, lng: 68.74218, label: 'New Complex Central Atrium (Library)' },
  new_east: { id: 'new_east', lat: 27.51045, lng: 68.74245, label: 'New Complex East Wing (AI / Medical)' },
  sports_track: { id: 'sports_track', lat: 27.51088, lng: 68.74292, label: 'Sports Ground Perimeter' },
  girls_hostel_walk: { id: 'girls_hostel_walk', lat: 27.5114, lng: 68.74335, label: 'Girls Hostel Lane' },

  // Workshop Complex Network (North)
  ws_civil_bay: { id: 'ws_civil_bay', lat: 27.51162, lng: 68.74122, label: 'Civil Workshop Yard' },
  ws_mech_bay: { id: 'ws_mech_bay', lat: 27.51172, lng: 68.7417, label: 'Mechanical Workshop Bay' },
  ws_elec_bay: { id: 'ws_elec_bay', lat: 27.51162, lng: 68.74208, label: 'Electrical & Electronics Workshops' },

  // Hostels & Transport Bays
  boys_hostel_gate: { id: 'boys_hostel_gate', lat: 27.51195, lng: 68.74265, label: 'Boys Hostel Gate' },
  transport_office_door: { id: 'transport_office_door', lat: 27.51182, lng: 68.74288, label: 'Transport Office' },
  point_parking_bay: { id: 'point_parking_bay', lat: 27.51162, lng: 68.74295, label: 'Student Point Parking Bay' },
};

const EDGE_DEFS: [string, string, string][] = [
  // Campus Dividing Road Spine
  ['gate_entry', 'gate_plaza', 'Hami Road Entrance Walk'],
  ['gate_plaza', 'mosque_jct', 'Campus Dividing Road'],
  ['mosque_jct', 'quad_jct', 'Campus Dividing Road'],
  ['quad_jct', 'dividing_center', 'Campus Dividing Road'],
  ['dividing_center', 'new_mid_road', 'Campus Dividing Road'],
  ['new_mid_road', 'ws_split', 'Campus Dividing Road'],
  ['ws_split', 'hostel_jct', 'Transport & Hostel Access Road'],
  ['hostel_jct', 'transport_plaza', 'Transport Terminal Road'],

  // Old Building Walkway Connections
  ['gate_plaza', 'mosque_walk', 'Masjid Lawn Walkway'],
  ['mosque_jct', 'mosque_walk', 'Masjid Connector Path'],
  ['mosque_walk', 'old_porch', 'Admin Block West Walk'],
  ['mosque_jct', 'old_porch', 'Old Complex Approach Lane'],
  ['quad_jct', 'old_east', 'Admin East Path'],
  ['dividing_center', 'old_east', 'Old Complex Crossing'],
  ['old_porch', 'old_center', 'Old Complex Main Corridor'],
  ['old_porch', 'old_west', 'VC Secretariat Walkway'],
  ['old_west', 'old_center', 'Old Admin West Corridor'],
  ['old_center', 'old_east', 'Old Admin East Corridor'],
  ['old_west', 'old_north', 'Old Complex West Stairway'],
  ['old_center', 'old_north', 'Old Complex North Corridor'],
  ['old_east', 'old_north', 'Old Complex East Corridor'],

  // Canteen & New Complex Connections
  ['mosque_jct', 'canteen_quad', 'Student Quad Path'],
  ['quad_jct', 'canteen_quad', 'University Canteen Walkway'],
  ['canteen_quad', 'new_west', 'Canteen–New Complex Walkway'],
  ['dividing_center', 'new_porch', 'New Complex Crossing'],
  ['new_mid_road', 'new_porch', 'New Complex North Entry'],
  ['new_porch', 'new_west', 'New Complex West Wing'],
  ['new_porch', 'new_center', 'New Complex Main Atrium'],
  ['new_west', 'new_center', 'CS & AI Corridor'],
  ['new_center', 'new_east', 'New Complex East Corridor'],
  ['new_east', 'sports_track', 'Sports Ground Path'],
  ['new_mid_road', 'sports_track', 'Sports Track Connector'],
  ['sports_track', 'girls_hostel_walk', 'Girls Hostel Walkway'],
  ['point_parking_bay', 'girls_hostel_walk', 'East Campus Perimeter Path'],

  // Workshop Industrial Complex Connections
  ['old_north', 'ws_civil_bay', 'Workshop West Lane'],
  ['ws_civil_bay', 'ws_mech_bay', 'Workshop Central Spine'],
  ['ws_mech_bay', 'ws_elec_bay', 'Workshop East Bay'],
  ['ws_split', 'ws_elec_bay', 'Workshop Complex Turnoff'],

  // Hostels & Transport Bays
  ['hostel_jct', 'boys_hostel_gate', 'Boys Hostel Walkway'],
  ['transport_plaza', 'boys_hostel_gate', 'Hostel Approach Path'],
  ['transport_plaza', 'transport_office_door', 'Transport Office Walkway'],
  ['transport_plaza', 'point_parking_bay', 'Point Bus Parking Lane'],
  ['transport_office_door', 'point_parking_bay', 'Bus Bay Steps'],
  ['sports_track', 'point_parking_bay', 'East Campus Spine'],
];

const ADJACENCY: Record<string, GraphEdge[]> = (() => {
  const adj: Record<string, GraphEdge[]> = {};
  for (const id of Object.keys(GRAPH_NODES)) {
    adj[id] = [];
  }
  for (const [a, b, streetName] of EDGE_DEFS) {
    adj[a]?.push({ to: b, streetName });
    adj[b]?.push({ to: a, streetName });
  }
  return adj;
})();

const PIN_TO_NODE: Record<string, string> = {
  gate_main: 'gate_entry',
  campus_mosque: 'mosque_walk',
  campus_cafeteria: 'canteen_quad',
  old_g_welfare: 'old_porch',
  old_g_seminar: 'old_porch',
  old_g_vc: 'old_west',
  old_g_registrar: 'old_center',
  old_g_exam: 'old_center',
  old_g_finance: 'old_east',
  old_g_admissions: 'old_east',
  old_1_civil: 'old_north',
  old_1_electrical: 'old_north',
  old_1_mechanical: 'old_north',
  old_1_electronics: 'old_east',
  old_2_basic_sciences: 'old_west',
  old_2_physics: 'old_north',
  old_2_lt1: 'old_west',
  old_2_lt2: 'old_center',
  new_g_reception: 'new_porch',
  new_g_skill_dir: 'new_west',
  new_g_cs_lab1: 'new_west',
  new_g_ai_lab: 'new_east',
  new_g_medical: 'new_east',
  new_1_library: 'new_center',
  new_1_smart_class: 'new_east',
  new_2_auditorium: 'new_center',
  new_2_automation_lab: 'new_west',
  campus_workshops: 'ws_mech_bay',
  ws_civil: 'ws_civil_bay',
  ws_electrical: 'ws_elec_bay',
  ws_electronics: 'ws_elec_bay',
  hostel_boys: 'boys_hostel_gate',
  campus_transport_office: 'transport_office_door',
  campus_transport: 'point_parking_bay',
  hostel_girls: 'girls_hostel_walk',
  campus_sports: 'sports_track',
};

function findNearestGraphNode(coord: LatLng): string {
  let bestId = 'gate_entry';
  let bestDist = Infinity;
  for (const node of Object.values(GRAPH_NODES)) {
    const d = calculateDistanceMeters(coord.lat, coord.lng, node.lat, node.lng);
    if (d < bestDist) {
      bestDist = d;
      bestId = node.id;
    }
  }
  return bestId;
}

function dijkstra(startId: string, endId: string): { nodeIds: string[]; edgeNames: string[] } {
  const dist: Record<string, number> = {};
  const prev: Record<string, { id: string; streetName: string } | null> = {};
  const unvisited = new Set<string>(Object.keys(GRAPH_NODES));

  for (const id of unvisited) {
    dist[id] = Infinity;
    prev[id] = null;
  }
  dist[startId] = 0;

  while (unvisited.size > 0) {
    let curr: string | null = null;
    let smallest = Infinity;
    for (const id of unvisited) {
      if (dist[id] < smallest) {
        smallest = dist[id];
        curr = id;
      }
    }
    if (!curr || curr === endId || smallest === Infinity) break;
    unvisited.delete(curr);

    const currNode = GRAPH_NODES[curr];
    for (const edge of ADJACENCY[curr] || []) {
      if (!unvisited.has(edge.to)) continue;
      const toNode = GRAPH_NODES[edge.to];
      const w = calculateDistanceMeters(currNode.lat, currNode.lng, toNode.lat, toNode.lng);
      const alt = dist[curr] + w;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        prev[edge.to] = { id: curr, streetName: edge.streetName };
      }
    }
  }

  const nodeIds: string[] = [];
  const edgeNames: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    nodeIds.unshift(cursor);
    const prevEntry: { id: string; streetName: string } | null = prev[cursor] ?? null;
    if (prevEntry) {
      edgeNames.unshift(prevEntry.streetName);
      cursor = prevEntry.id;
    } else {
      cursor = null;
    }
  }

  return { nodeIds, edgeNames };
}

export function classifyTurnDelta(deltaDeg: number): {
  action: TurnAction;
  verb: string;
} {
  // Normalize to [-180, 180]
  const d = ((deltaDeg + 540) % 360) - 180;
  if (Math.abs(d) < 22) return { action: 'STRAIGHT', verb: 'Continue straight' };
  if (d >= 22 && d < 55) return { action: 'KEEP_RIGHT', verb: 'Keep right' };
  if (d >= 55 && d < 120) return { action: 'RIGHT', verb: 'Turn right' };
  if (d >= 120) return { action: 'SHARP_RIGHT', verb: 'Make a sharp right' };
  if (d <= -22 && d > -55) return { action: 'KEEP_LEFT', verb: 'Keep left' };
  if (d <= -55 && d > -120) return { action: 'LEFT', verb: 'Turn left' };
  return { action: 'SHARP_LEFT', verb: 'Make a sharp left' };
}

export function compassDirectionLabel(bearingDeg: number): string {
  const dirs = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return dirs[Math.round(((bearingDeg % 360) / 45)) % 8];
}

export function computeCampusRoute(
  origin: LatLng,
  originLabel: string,
  destinationPin: CampusPin
): ComputedRoute {
  const startNodeId = findNearestGraphNode(origin);
  const endNodeId =
    PIN_TO_NODE[destinationPin.id] ??
    findNearestGraphNode({ lat: destinationPin.latitude, lng: destinationPin.longitude });

  const { nodeIds, edgeNames } = dijkstra(startNodeId, endNodeId);

  // Build ordered full coordinate path + street names per segment
  const rawPoints: LatLng[] = [];
  const rawSegNames: string[] = [];

  const startNode = GRAPH_NODES[startNodeId];
  const distToStartNode = calculateDistanceMeters(
    origin.lat,
    origin.lng,
    startNode.lat,
    startNode.lng
  );
  if (distToStartNode > 6) {
    rawPoints.push({ lat: origin.lat, lng: origin.lng });
    rawSegNames.push(`Walkway from ${originLabel}`);
  }

  for (let i = 0; i < nodeIds.length; i++) {
    const n = GRAPH_NODES[nodeIds[i]];
    rawPoints.push({ lat: n.lat, lng: n.lng });
    if (i < edgeNames.length) {
      rawSegNames.push(edgeNames[i]);
    }
  }

  const lastPt = rawPoints[rawPoints.length - 1];
  const distFromEndNode = calculateDistanceMeters(
    lastPt.lat,
    lastPt.lng,
    destinationPin.latitude,
    destinationPin.longitude
  );
  if (distFromEndNode > 4) {
    rawSegNames.push(`${destinationPin.mapLabel || destinationPin.name} Entrance`);
    rawPoints.push({ lat: destinationPin.latitude, lng: destinationPin.longitude });
  }

  // Edge case: origin & destination are right next to each other (<6m)
  if (rawPoints.length < 2) {
    rawPoints.push({ lat: destinationPin.latitude, lng: destinationPin.longitude });
    rawSegNames.push('Immediate Arrival');
  }

  // Convert segments into clean merged turn-by-turn steps
  const steps: RouteStep[] = [];
  let totalDist = 0;

  interface RawSeg {
    from: LatLng;
    to: LatLng;
    dist: number;
    bearing: number;
    streetName: string;
  }

  const segs: RawSeg[] = [];
  for (let i = 0; i < rawPoints.length - 1; i++) {
    const from = rawPoints[i];
    const to = rawPoints[i + 1];
    const d = calculateDistanceMeters(from.lat, from.lng, to.lat, to.lng);
    if (d < 1.5 && rawPoints.length > 2) continue;
    totalDist += d;
    segs.push({
      from,
      to,
      dist: d,
      bearing: calculateBearing(from.lat, from.lng, to.lat, to.lng),
      streetName: rawSegNames[i] ?? 'Campus Walkway',
    });
  }

  if (segs.length === 0) {
    const d = Math.round(
      calculateDistanceMeters(
        origin.lat,
        origin.lng,
        destinationPin.latitude,
        destinationPin.longitude
      )
    );
    return {
      polyline: [origin, { lat: destinationPin.latitude, lng: destinationPin.longitude }],
      steps: [
        {
          id: 'step-arrive',
          action: 'ARRIVE',
          instruction: `You are already at ${destinationPin.name} (${destinationPin.roomNumber})`,
          streetName: BUILDINGS[destinationPin.building].shortName,
          distanceMeters: d,
          coord: { lat: destinationPin.latitude, lng: destinationPin.longitude },
          segmentCoords: [origin, { lat: destinationPin.latitude, lng: destinationPin.longitude }],
        },
      ],
      totalDistanceMeters: d,
      estimatedMinutes: 1,
      usedExternalRoad: false,
    };
  }

  // Step 0: Start instruction (merge subsequent straight segments on the same road)
  let currentCoords: LatLng[] = [segs[0].from, segs[0].to];
  let currentDist = segs[0].dist;
  let currentStreet = segs[0].streetName;
  let currentBearing = segs[0].bearing;
  let pendingAction: TurnAction = 'START';
  let pendingVerb = `Head ${compassDirectionLabel(currentBearing)}`;

  const flushStep = (idx: number) => {
    const rounded = Math.max(1, Math.round(currentDist));
    const text =
      pendingAction === 'START'
        ? `${pendingVerb} along ${currentStreet} for ${formatDistance(rounded)}`
        : `${pendingVerb} onto ${currentStreet} • walk ${formatDistance(rounded)}`;
    steps.push({
      id: `step-${idx}`,
      action: pendingAction,
      instruction: text,
      streetName: currentStreet,
      distanceMeters: rounded,
      coord: currentCoords[0],
      segmentCoords: [...currentCoords],
    });
  };

  for (let i = 1; i < segs.length; i++) {
    const next = segs[i];
    const turn = classifyTurnDelta(next.bearing - currentBearing);
    if (turn.action === 'STRAIGHT' && next.streetName === currentStreet) {
      currentCoords.push(next.to);
      currentDist += next.dist;
      currentBearing = next.bearing;
    } else if (turn.action === 'STRAIGHT' && next.dist < 18) {
      currentCoords.push(next.to);
      currentDist += next.dist;
      currentBearing = next.bearing;
    } else {
      flushStep(steps.length);
      pendingAction = turn.action;
      pendingVerb = turn.verb;
      currentStreet = next.streetName;
      currentCoords = [next.from, next.to];
      currentDist = next.dist;
      currentBearing = next.bearing;
    }
  }
  flushStep(steps.length);

  // Final arrival step with indoor continuation hint
  const isIndoor =
    destinationPin.building !== 'CAMPUS_GROUNDS' && destinationPin.floor !== 'OUTDOOR';
  steps.push({
    id: `step-arrive`,
    action: 'ARRIVE',
    instruction: isIndoor
      ? `Arrive at ${destinationPin.name} (${destinationPin.roomNumber}). ${destinationPin.indoorGuide}`
      : `Arrive at ${destinationPin.name} (${destinationPin.roomNumber})`,
    streetName: BUILDINGS[destinationPin.building].shortName,
    distanceMeters: 0,
    coord: { lat: destinationPin.latitude, lng: destinationPin.longitude },
    segmentCoords: [
      { lat: destinationPin.latitude, lng: destinationPin.longitude },
    ],
  });

  const roundedTotal = Math.round(totalDist);
  return {
    polyline: rawPoints,
    steps,
    totalDistanceMeters: roundedTotal,
    estimatedMinutes: estimateWalkMinutes(roundedTotal),
    usedExternalRoad: false,
  };
}

export async function fetchOsrmRoadRoute(
  origin: LatLng,
  destinationPin: CampusPin
): Promise<ComputedRoute | null> {
  const gatePin = CAMPUS_PINS.find((p) => p.id === 'gate_main');
  if (!gatePin) return null;

  const url = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${gatePin.longitude},${gatePin.latitude}?overview=full&geometries=geojson&steps=true`;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route || !route.geometry?.coordinates) return null;

    const roadPolyline: LatLng[] = route.geometry.coordinates.map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] })
    );

    const roadSteps: RouteStep[] = [];
    const legs = route.legs?.[0];
    if (Array.isArray(legs?.steps)) {
      legs.steps.forEach(
        (
          s: {
            distance: number;
            name?: string;
            maneuver?: {
              type?: string;
              modifier?: string;
              location?: [number, number];
            };
          },
          idx: number
        ) => {
          const mType = s.maneuver?.type ?? 'continue';
          const mod = s.maneuver?.modifier ?? '';
          if (mType === 'arrive') return;
          let action: TurnAction = 'STRAIGHT';
          let verb = 'Continue straight';
          if (idx === 0) {
            action = 'START';
            verb = 'Start toward BBSUTSD Main Gate';
          } else if (mod.includes('sharp right')) {
            action = 'SHARP_RIGHT';
            verb = 'Make a sharp right';
          } else if (mod.includes('slight right')) {
            action = 'KEEP_RIGHT';
            verb = 'Keep right';
          } else if (mod.includes('right')) {
            action = 'RIGHT';
            verb = 'Turn right';
          } else if (mod.includes('sharp left')) {
            action = 'SHARP_LEFT';
            verb = 'Make a sharp left';
          } else if (mod.includes('slight left')) {
            action = 'KEEP_LEFT';
            verb = 'Keep left';
          } else if (mod.includes('left')) {
            action = 'LEFT';
            verb = 'Turn left';
          }

          const loc = s.maneuver?.location;
          const pt = loc ? { lat: loc[1], lng: loc[0] } : origin;
          const roadName = s.name && s.name.trim() ? s.name : 'City Approach Road';
          roadSteps.push({
            id: `osrm-${idx}`,
            action,
            instruction: `${verb} onto ${roadName} • ${formatDistance(s.distance)}`,
            streetName: roadName,
            distanceMeters: Math.round(s.distance),
            coord: pt,
            segmentCoords: [pt],
          });
        }
      );
    }

    const campusPart = computeCampusRoute(
      { lat: gatePin.latitude, lng: gatePin.longitude },
      'Main Entrance Gate',
      destinationPin
    );

    const totalDist = Math.round((route.distance || 0) + campusPart.totalDistanceMeters);
    return {
      polyline: [...roadPolyline, ...campusPart.polyline],
      steps: [...roadSteps, ...campusPart.steps],
      totalDistanceMeters: totalDist,
      estimatedMinutes: estimateWalkMinutes(totalDist),
      usedExternalRoad: true,
    };
  } catch {
    return null;
  }
}

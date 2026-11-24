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
  cafeteria_plaza: { id: 'cafeteria_plaza', lat: 27.513138, lng: 68.741641, label: 'BBSUTSD Central Cafeteria' },
  central_library_entry: { id: 'central_library_entry', lat: 27.512831, lng: 68.742349, label: 'Central Library' },
  smart_class_entry: { id: 'smart_class_entry', lat: 27.512277, lng: 68.742401, label: 'Smart Class Room' },
  vc_english_block: { id: 'vc_english_block', lat: 27.511706, lng: 68.742824, label: 'VC Office & HOD English Wing' },
  points_stop_node: { id: 'points_stop_node', lat: 27.511694, lng: 68.742806, label: 'Points Stop Terminal' },
  main_gates_entry: { id: 'main_gates_entry', lat: 27.510977, lng: 68.74388, label: 'Main Gates (Old & New Buildings)' },
  dr_saleem_office_node: { id: 'dr_saleem_office_node', lat: 27.5109, lng: 68.7445, label: 'Dr. Saleem HOD Office' },
  mosque_new_bldg: { id: 'mosque_new_bldg', lat: 27.5105, lng: 68.7448, label: 'New Building Mosque' },
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
  ['old_porch', 'quad_jct', 'Old Complex Plaza Walk'],
  ['old_porch', 'old_east', 'Admin Front Walkway'],
  ['quad_jct', 'old_east', 'Admin East Path'],
  ['dividing_center', 'old_east', 'Old Complex Crossing'],
  ['old_east', 'new_mid_road', 'Science Block Crossing'],
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
  ['canteen_quad', 'new_porch', 'New Complex Lawn Walk'],
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
  ['ws_mech_bay', 'cafeteria_plaza', 'Central Cafeteria North Walk'],
  ['boys_hostel_gate', 'cafeteria_plaza', 'Cafeteria & Hostel Path'],
  ['ws_split', 'smart_class_entry', 'Smart Classrooms North Walk'],
  ['hostel_jct', 'smart_class_entry', 'Smart Classrooms Connector'],
  ['smart_class_entry', 'boys_hostel_gate', 'Smart Classroom–Hostel Path'],
  ['hostel_jct', 'vc_english_block', 'VC Office & Admin Access Walk'],
  ['transport_plaza', 'vc_english_block', 'VC Office & English Wing Walk'],
  ['point_parking_bay', 'vc_english_block', 'VC & HOD English East Path'],
  ['smart_class_entry', 'vc_english_block', 'Smart Class–VC Office Path'],
  ['cafeteria_plaza', 'central_library_entry', 'Cafeteria–Central Library Walkway'],
  ['smart_class_entry', 'central_library_entry', 'Smart Class–Central Library Path'],
  ['boys_hostel_gate', 'central_library_entry', 'Hostel–Central Library Lane'],
  ['vc_english_block', 'points_stop_node', 'VC Office–Points Stop Path'],
  ['transport_plaza', 'points_stop_node', 'Points Stop Terminal Walk'],
  ['point_parking_bay', 'points_stop_node', 'Points Stop Bay Access'],
  ['girls_hostel_walk', 'main_gates_entry', 'Main Gates Approach Road'],
  ['point_parking_bay', 'main_gates_entry', 'Points Bay–Main Gates Road'],
  ['sports_track', 'main_gates_entry', 'Sports Ground–Main Gates Path'],
  ['main_gates_entry', 'dr_saleem_office_node', 'Main Gates–Dr. Saleem Office Walk'],
  ['girls_hostel_walk', 'dr_saleem_office_node', 'East Wing HOD Office Path'],
  ['dr_saleem_office_node', 'mosque_new_bldg', 'Dr. Saleem Office–New Building Mosque Walk'],
  ['main_gates_entry', 'mosque_new_bldg', 'Main Gates–New Building Mosque Road'],
  ['new_east', 'mosque_new_bldg', 'New Complex–New Building Mosque Path'],
];

const PIN_TO_NODE: Record<string, string> = {
  old_g_vc: 'vc_english_block',
  hod_english: 'vc_english_block',
  new_1_smart_class: 'smart_class_entry',
  campus_cafeteria: 'cafeteria_plaza',
  campus_transport: 'points_stop_node',
  hod_prof_saleem: 'dr_saleem_office_node',
  central_library: 'central_library_entry',
  new_building_mosque: 'mosque_new_bldg',
  gate_main: 'main_gates_entry',
};

function projectPointOntoSegment(
  p: LatLng,
  a: LatLng,
  b: LatLng
): { point: LatLng; t: number; distMeters: number } {
  const cosLat = Math.cos((27.5108 * Math.PI) / 180);
  const px = p.lng * 111320 * cosLat;
  const py = p.lat * 110810;
  const ax = a.lng * 111320 * cosLat;
  const ay = a.lat * 110810;
  const bx = b.lng * 111320 * cosLat;
  const by = b.lat * 110810;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 1e-9) {
    t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  }
  const proj: LatLng = {
    lat: a.lat + t * (b.lat - a.lat),
    lng: a.lng + t * (b.lng - a.lng),
  };
  return {
    point: proj,
    t,
    distMeters: calculateDistanceMeters(p.lat, p.lng, proj.lat, proj.lng),
  };
}

function attachPointToDynamicGraph(
  virtualId: string,
  coord: LatLng,
  approachName: string,
  nodes: Record<string, GraphNode>,
  adj: Record<string, GraphEdge[]>,
  preferredNodeId?: string
): void {
  nodes[virtualId] = {
    id: virtualId,
    lat: coord.lat,
    lng: coord.lng,
    label: approachName,
  };
  adj[virtualId] = [];

  // 1. Connect to nearest edge projections (eliminates backtracking along walkways)
  const edgeCandidates: {
    u: string;
    v: string;
    streetName: string;
    proj: LatLng;
    t: number;
    distMeters: number;
  }[] = [];

  for (const [u, v, streetName] of EDGE_DEFS) {
    const nu = GRAPH_NODES[u];
    const nv = GRAPH_NODES[v];
    if (!nu || !nv) continue;
    const res = projectPointOntoSegment(coord, nu, nv);
    edgeCandidates.push({
      u,
      v,
      streetName,
      proj: res.point,
      t: res.t,
      distMeters: res.distMeters,
    });
  }

  edgeCandidates.sort((a, b) => a.distMeters - b.distMeters);
  const topEdges = edgeCandidates.filter((c, i) => i < 4 && (i === 0 || c.distMeters <= 75));

  topEdges.forEach((cand, idx) => {
    if (cand.t <= 0.04) {
      adj[virtualId].push({ to: cand.u, streetName: approachName });
      adj[cand.u]?.push({ to: virtualId, streetName: approachName });
    } else if (cand.t >= 0.96) {
      adj[virtualId].push({ to: cand.v, streetName: approachName });
      adj[cand.v]?.push({ to: virtualId, streetName: approachName });
    } else {
      const splitId = `${virtualId}_proj_${idx}`;
      nodes[splitId] = {
        id: splitId,
        lat: cand.proj.lat,
        lng: cand.proj.lng,
        label: cand.streetName,
      };
      adj[splitId] = [
        { to: cand.u, streetName: cand.streetName },
        { to: cand.v, streetName: cand.streetName },
        { to: virtualId, streetName: approachName },
      ];
      adj[cand.u]?.push({ to: splitId, streetName: cand.streetName });
      adj[cand.v]?.push({ to: splitId, streetName: cand.streetName });
      adj[virtualId].push({ to: splitId, streetName: approachName });
    }
  });

  // 2. Also ensure direct connection to nearest graph vertices & preferred entrance node
  const nodeDists = Object.values(GRAPH_NODES)
    .map((n) => ({
      id: n.id,
      d: calculateDistanceMeters(coord.lat, coord.lng, n.lat, n.lng),
    }))
    .sort((a, b) => a.d - b.d);

  const nearbyIds = new Set<string>();
  if (nodeDists[0]) nearbyIds.add(nodeDists[0].id);
  if (nodeDists[1] && nodeDists[1].d <= 65) nearbyIds.add(nodeDists[1].id);
  if (preferredNodeId && GRAPH_NODES[preferredNodeId]) {
    nearbyIds.add(preferredNodeId);
  }

  for (const targetId of nearbyIds) {
    if (!adj[virtualId].some((e) => e.to === targetId)) {
      adj[virtualId].push({ to: targetId, streetName: approachName });
      adj[targetId]?.push({ to: virtualId, streetName: approachName });
    }
  }
}

function solveShortestGraphPath(
  origin: LatLng,
  originLabel: string,
  destinationPin: CampusPin
): { points: LatLng[]; segNames: string[]; totalDist: number } {
  const nodes: Record<string, GraphNode> = {};
  for (const [k, v] of Object.entries(GRAPH_NODES)) {
    nodes[k] = { ...v };
  }
  const adj: Record<string, GraphEdge[]> = {};
  for (const id of Object.keys(nodes)) {
    adj[id] = [];
  }
  for (const [a, b, streetName] of EDGE_DEFS) {
    adj[a]?.push({ to: b, streetName });
    adj[b]?.push({ to: a, streetName });
  }

  const startId = '__start__';
  const endId = '__end__';
  attachPointToDynamicGraph(startId, origin, `Walkway from ${originLabel}`, nodes, adj);
  attachPointToDynamicGraph(
    endId,
    { lat: destinationPin.latitude, lng: destinationPin.longitude },
    `${destinationPin.mapLabel || destinationPin.name} Entrance`,
    nodes,
    adj,
    PIN_TO_NODE[destinationPin.id]
  );

  // If the same edge has projections for both start and end, connect them directly
  // so intra-edge walks are strictly straight along that walkway!
  for (const [sId, sNode] of Object.entries(nodes)) {
    if (!sId.startsWith('__start___proj_')) continue;
    for (const [eId, eNode] of Object.entries(nodes)) {
      if (!eId.startsWith('__end___proj_')) continue;
      const sNeighbors = (adj[sId] || []).map((x) => x.to).filter((x) => x !== startId);
      const eNeighbors = (adj[eId] || []).map((x) => x.to).filter((x) => x !== endId);
      if (
        sNeighbors.length === 2 &&
        eNeighbors.length === 2 &&
        ((sNeighbors[0] === eNeighbors[0] && sNeighbors[1] === eNeighbors[1]) ||
          (sNeighbors[0] === eNeighbors[1] && sNeighbors[1] === eNeighbors[0]))
      ) {
        adj[sId].push({ to: eId, streetName: sNode.label });
        adj[eId].push({ to: sId, streetName: eNode.label });
      }
    }
  }

  const dist: Record<string, number> = {};
  const prev: Record<string, { id: string; streetName: string } | null> = {};
  const unvisited = new Set<string>(Object.keys(nodes));
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

    const currNode = nodes[curr];
    for (const edge of adj[curr] || []) {
      if (!unvisited.has(edge.to)) continue;
      const toNode = nodes[edge.to];
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

  const points: LatLng[] = nodeIds.map((id) => ({ lat: nodes[id].lat, lng: nodes[id].lng }));
  return {
    points,
    segNames: edgeNames,
    totalDist: dist[endId] ?? Infinity,
  };
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
  const destCoord: LatLng = { lat: destinationPin.latitude, lng: destinationPin.longitude };
  const directDist = calculateDistanceMeters(origin.lat, origin.lng, destCoord.lat, destCoord.lng);

  let rawPoints: LatLng[] = [];
  let rawSegNames: string[] = [];

  if (directDist <= 28) {
    rawPoints = [origin, destCoord];
    rawSegNames = [`Walk directly to ${destinationPin.mapLabel || destinationPin.name}`];
  } else {
    const solved = solveShortestGraphPath(origin, originLabel, destinationPin);
    rawPoints = solved.points;
    rawSegNames = solved.segNames;
  }

  // Deduplicate ultra-close vertices (< 2.5m) while preserving start & destination
  const cleanedPoints: LatLng[] = [];
  const cleanedNames: string[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i];
    if (cleanedPoints.length === 0) {
      cleanedPoints.push(pt);
    } else {
      const prevPt = cleanedPoints[cleanedPoints.length - 1];
      const d = calculateDistanceMeters(prevPt.lat, prevPt.lng, pt.lat, pt.lng);
      if (d >= 2.5 || i === rawPoints.length - 1) {
        cleanedPoints.push(pt);
        cleanedNames.push(rawSegNames[i - 1] ?? 'Campus Walkway');
      }
    }
  }

  if (cleanedPoints.length < 2) {
    cleanedPoints.push(destCoord);
    cleanedNames.push('Immediate Arrival');
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
  for (let i = 0; i < cleanedPoints.length - 1; i++) {
    const from = cleanedPoints[i];
    const to = cleanedPoints[i + 1];
    const d = calculateDistanceMeters(from.lat, from.lng, to.lat, to.lng);
    if (d < 1.5 && cleanedPoints.length > 2) continue;
    totalDist += d;
    segs.push({
      from,
      to,
      dist: d,
      bearing: calculateBearing(from.lat, from.lng, to.lat, to.lng),
      streetName: cleanedNames[i] ?? 'Campus Walkway',
    });
  }

  if (segs.length === 0) {
    const d = Math.round(directDist);
    return {
      polyline: [origin, destCoord],
      steps: [
        {
          id: 'step-arrive',
          action: 'ARRIVE',
          instruction: `You are already at ${destinationPin.name} (${destinationPin.roomNumber})`,
          streetName: BUILDINGS[destinationPin.building].shortName,
          distanceMeters: d,
          coord: destCoord,
          segmentCoords: [origin, destCoord],
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
    } else if (turn.action === 'STRAIGHT' && next.dist < 14) {
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
    coord: destCoord,
    segmentCoords: [destCoord],
  });

  const roundedTotal = Math.round(totalDist);
  return {
    polyline: cleanedPoints,
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
  const gateCoord = CAMPUS_PINS.find((p) => p.id === 'gate_main');
  const gateLat = gateCoord?.latitude ?? 27.510977;
  const gateLng = gateCoord?.longitude ?? 68.74388;

  const url = `https://router.project-osrm.org/route/v1/foot/${origin.lng},${origin.lat};${gateLng},${gateLat}?overview=full&geometries=geojson&steps=true`;
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
      { lat: gateLat, lng: gateLng },
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

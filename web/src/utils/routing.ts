import { BBSUTSD_CENTER, BUILDINGS, CAMPUS_PINS } from '../data/campusData';
import type { CampusPin, LatLng } from '../types/campus';
import {
  calculateBearing,
  calculateDistanceMeters,
  estimateWalkMinutes,
  formatDistance,
  isPointInPolygon,
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

/**
 * Real-world BBSUTSD Khairpur Mirs road centerline & walkway junction nodes
 * anchored to OpenStreetMap & Google Street/Satellite geometry.
 */
const GRAPH_NODES: Record<string, GraphNode> = {
  // Campus West Avenue (North-South street serving Cafeteria, ATM, Central Library, Smart Class)
  rd_cafeteria_nw: { id: 'rd_cafeteria_nw', lat: 27.513343, lng: 68.741668, label: 'Cafeteria North Junction' },
  rd_cafeteria_turn: { id: 'rd_cafeteria_turn', lat: 27.51319, lng: 68.741553, label: 'Central Cafeteria Curb' },
  rd_atm_curb: { id: 'rd_atm_curb', lat: 27.513127, lng: 68.741801, label: 'ATM Roadfront' },
  rd_atm_front: { id: 'rd_atm_front', lat: 27.513008, lng: 68.741874, label: 'ATM & Cafeteria Avenue' },
  rd_library_front: { id: 'rd_library_front', lat: 27.512811, lng: 68.741885, label: 'Central Library Road Turn' },
  rd_library_walk: { id: 'rd_library_walk', lat: 27.512822, lng: 68.74212, label: 'Central Library Entrance Walk' },
  rd_north_mid: { id: 'rd_north_mid', lat: 27.512617, lng: 68.741895, label: 'Campus West Avenue' },
  rd_smart_front: { id: 'rd_smart_front', lat: 27.512267, lng: 68.741904, label: 'Smart Class West Turnoff' },
  rd_west_spine_jct: { id: 'rd_west_spine_jct', lat: 27.511843, lng: 68.741913, label: 'West Ave & Central Spine Junction' },
  rd_mid_west_ave: { id: 'rd_mid_west_ave', lat: 27.511246, lng: 68.741928, label: 'Campus West Avenue South' },
  rd_south_west_ave: { id: 'rd_south_west_ave', lat: 27.51043, lng: 68.741948, label: 'New Complex West Road' },

  // Campus Central Spine Road (WNW-ESE road connecting West Ave, Smart Class South, Points Stop, Main Gates)
  rd_smart_south_jct: { id: 'rd_smart_south_jct', lat: 27.511792, lng: 68.742401, label: 'Smart Class South Junction' },
  rd_central_bend: { id: 'rd_central_bend', lat: 27.511767, lng: 68.742705, label: 'Points Terminal Curve' },
  rd_points_jct: { id: 'rd_points_jct', lat: 27.511772, lng: 68.742769, label: 'Points Stop Junction' },
  rd_gates_jct: { id: 'rd_gates_jct', lat: 27.511044, lng: 68.744096, label: 'Main Gates Boulevard Junction' },

  // Eastern Campus Boulevard & Main Gates Approach
  rd_boulevard_sw: { id: 'rd_boulevard_sw', lat: 27.509919, lng: 68.743061, label: 'BBSUTSD South Boulevard' },
  rd_gates_front: { id: 'rd_gates_front', lat: 27.51091, lng: 68.743973, label: 'Main Entrance Approach' },

  // Campus Dividing Connectors (Internal campus paths only)
  mosque_jct: { id: 'mosque_jct', lat: 27.51035, lng: 68.74115, label: 'Dividing Road South' },
  quad_jct: { id: 'quad_jct', lat: 27.51062, lng: 68.74142, label: 'Dividing Road Mid' },
  dividing_center: { id: 'dividing_center', lat: 27.51082, lng: 68.74164, label: 'Campus Dividing Road Center' },
  new_mid_road: { id: 'new_mid_road', lat: 27.51112, lng: 68.74194, label: 'Dividing Road North-East' },
  ws_split: { id: 'ws_split', lat: 27.51145, lng: 68.74222, label: 'Central Walkway Split' },
  old_porch: { id: 'old_porch', lat: 27.511234, lng: 68.741032, label: 'Old Academic Complex Front' },
  new_east: { id: 'new_east', lat: 27.51045, lng: 68.74245, label: 'New Complex East Walk' },

  // New Building Structured Courtyard & Corridor Turns (entered strictly via Main Gates)
  nb_gate_courtyard: { id: 'nb_gate_courtyard', lat: 27.510977, lng: 68.74404, label: 'Main Gate Courtyard Entry' },
  nb_west_gallery: { id: 'nb_west_gallery', lat: 27.5109, lng: 68.74432, label: 'New Building West Gallery' },
  nb_labs_corner: { id: 'nb_labs_corner', lat: 27.5109, lng: 68.7447, label: 'East Wing Labs Junction' },
  nb_mosque_turn: { id: 'nb_mosque_turn', lat: 27.5105, lng: 68.7447, label: 'Mosque Courtyard Corner' },

  // Calibrated Manual Landmark Entrance Nodes
  cafeteria_plaza: { id: 'cafeteria_plaza', lat: 27.513138, lng: 68.741641, label: 'BBSUTSD Central Cafeteria' },
  atm_kiosk: { id: 'atm_kiosk', lat: 27.513132, lng: 68.741812, label: 'Campus ATM' },
  central_library_entry: { id: 'central_library_entry', lat: 27.512831, lng: 68.742349, label: 'Central Library' },
  smart_class_entry: { id: 'smart_class_entry', lat: 27.512277, lng: 68.742401, label: 'Smart Class Room' },
  points_stop_node: { id: 'points_stop_node', lat: 27.511694, lng: 68.742806, label: 'Points Stop Terminal' },
  main_gates_entry: { id: 'main_gates_entry', lat: 27.510977, lng: 68.74388, label: 'Main Gates (Old & New Buildings)' },
  dr_saleem_office_node: { id: 'dr_saleem_office_node', lat: 27.5109, lng: 68.7445, label: 'Dr. Saleem HOD Office' },
  electronics_lab_node: { id: 'electronics_lab_node', lat: 27.5108, lng: 68.7447, label: 'Electronics Lab' },
  computer_lab_1_node: { id: 'computer_lab_1_node', lat: 27.5108, lng: 68.7447, label: 'Computer Lab 1 (2F)' },
  mosque_new_bldg: { id: 'mosque_new_bldg', lat: 27.5105, lng: 68.7448, label: 'New Building Mosque' },

  // North & South Wings Road Junctions + New Manual Landmark Nodes
  rd_north_audi_jct: { id: 'rd_north_audi_jct', lat: 27.513343, lng: 68.7421, label: 'Post Grad & Audi Old Lane' },
  rd_vc_swo_jct: { id: 'rd_vc_swo_jct', lat: 27.513343, lng: 68.7427, label: 'VC Secretariat & SWO Junction' },
  rd_east_admin_walk: { id: 'rd_east_admin_walk', lat: 27.5128, lng: 68.7427, label: 'East Admin Block Walkway' },
  rd_nizam_corridor: { id: 'rd_nizam_corridor', lat: 27.51228, lng: 68.7427, label: 'Smart Class & Memon Office Junction' },
  rd_new_audi_jct: { id: 'rd_new_audi_jct', lat: 27.50895, lng: 68.74191, label: 'South Auditorium Road' },
  rd_new_audi_turn: { id: 'rd_new_audi_turn', lat: 27.50915, lng: 68.74235, label: 'New Auditorium Approach' },
  new_audi_node: { id: 'new_audi_node', lat: 27.5086, lng: 68.7418, label: 'New Audi' },
  post_grad_office_node: { id: 'post_grad_office_node', lat: 27.5134, lng: 68.7421, label: 'Post Grad Office' },
  audi_old_node: { id: 'audi_old_node', lat: 27.5134, lng: 68.7421, label: 'Audi Old' },
  vc_secretariat_node: { id: 'vc_secretariat_node', lat: 27.5132, lng: 68.7427, label: 'VC Secretary Office' },
  swo_office_node: { id: 'swo_office_node', lat: 27.5132, lng: 68.7427, label: 'SWO Office' },
  nizam_memon_office_node: { id: 'nizam_memon_office_node', lat: 27.5124, lng: 68.7427, label: 'Nizam Uddin Memon Office' },
};

const EDGE_DEFS: [string, string, string][] = [
  // Campus West Avenue (Cafeteria -> ATM -> Central Library -> Smart Class -> West Spine Junction -> Dividing Rd)
  ['rd_cafeteria_turn', 'cafeteria_plaza', 'Central Cafeteria Entrance'],
  ['rd_cafeteria_nw', 'rd_cafeteria_turn', 'Cafeteria North Lane'],
  ['rd_cafeteria_nw', 'rd_atm_curb', 'Campus West Avenue'],
  ['rd_atm_curb', 'atm_kiosk', 'Campus ATM Curb'],
  ['rd_atm_curb', 'rd_atm_front', 'Campus West Avenue'],
  ['rd_atm_front', 'rd_library_front', 'Campus West Avenue'],
  ['rd_library_front', 'rd_library_walk', 'Central Library Path'],
  ['rd_library_walk', 'central_library_entry', 'Central Library Path'],
  ['rd_library_front', 'rd_north_mid', 'Campus West Avenue'],
  ['rd_north_mid', 'rd_smart_front', 'Campus West Avenue'],
  ['rd_smart_front', 'smart_class_entry', 'Smart Classrooms West Walk'],
  ['rd_smart_front', 'rd_west_spine_jct', 'Campus West Avenue'],
  ['rd_west_spine_jct', 'rd_mid_west_ave', 'Campus West Avenue South'],
  ['rd_mid_west_ave', 'rd_south_west_ave', 'Campus West Avenue South'],

  // Campus Central Spine Road (West Ave Junction -> Smart Class South -> Points Stop -> Main Gates Junction)
  ['rd_west_spine_jct', 'rd_smart_south_jct', 'Campus Central Road'],
  ['rd_smart_south_jct', 'smart_class_entry', 'Smart Classrooms Courtyard Walk'],
  ['rd_smart_south_jct', 'rd_central_bend', 'Campus Central Road'],
  ['rd_central_bend', 'rd_points_jct', 'Campus Central Road'],
  ['rd_points_jct', 'points_stop_node', 'Points Stop Terminal Bay'],
  ['rd_points_jct', 'rd_gates_jct', 'Campus Central Road'],

  // Dividing Road & Old/New Complex Connectors
  ['mosque_jct', 'quad_jct', 'Campus Dividing Road'],
  ['quad_jct', 'dividing_center', 'Campus Dividing Road'],
  ['dividing_center', 'new_mid_road', 'Campus Dividing Road'],
  ['new_mid_road', 'rd_mid_west_ave', 'Campus West Avenue'],
  ['rd_mid_west_ave', 'old_porch', 'Old Complex Access Lane'],
  ['new_mid_road', 'ws_split', 'Central Campus Walkway'],
  ['ws_split', 'rd_west_spine_jct', 'West Junction Connector'],
  ['ws_split', 'rd_smart_south_jct', 'Central Courtyard Path'],
  ['rd_south_west_ave', 'new_east', 'New Complex Front Walk'],
  ['new_east', 'rd_boulevard_sw', 'South Campus Road'],

  // Eastern Boulevard & Main Gates Approach (strictly Main Gates only)
  ['rd_boulevard_sw', 'rd_gates_front', 'BBSUTSD Main Boulevard'],
  ['rd_gates_front', 'main_gates_entry', 'Main Gates Entrance'],
  ['rd_gates_front', 'rd_gates_jct', 'BBSUTSD Main Boulevard'],
  ['rd_gates_jct', 'nb_gate_courtyard', 'Main Gates Entrance'],

  // New Building Structured Courtyard & Wing Corridors (90-degree turns)
  ['main_gates_entry', 'nb_gate_courtyard', 'Main Gate Plaza'],
  ['nb_gate_courtyard', 'nb_west_gallery', 'New Building Main Walkway'],
  ['nb_west_gallery', 'dr_saleem_office_node', 'Dr. Saleem HOD Office Corridor'],
  ['dr_saleem_office_node', 'nb_labs_corner', 'New Building East Corridor'],
  ['nb_labs_corner', 'electronics_lab_node', 'Electronics Lab Wing'],
  ['electronics_lab_node', 'computer_lab_1_node', 'Stairway to Computer Lab 1 (2F)'],
  ['electronics_lab_node', 'nb_mosque_turn', 'New Building South Walkway'],
  ['nb_mosque_turn', 'mosque_new_bldg', 'New Building Mosque Walk'],

  // North Admin & Auditoriums Wing (Cafeteria North -> Post Grad / Audi Old -> VC Sec / SWO -> Nizam Memon -> Central Spine)
  ['rd_cafeteria_nw', 'rd_north_audi_jct', 'North Auditorium Lane'],
  ['rd_north_audi_jct', 'post_grad_office_node', 'Post Grad Office Entrance'],
  ['rd_north_audi_jct', 'audi_old_node', 'Audi Old Entrance'],
  ['rd_north_audi_jct', 'rd_vc_swo_jct', 'North Executive Wing Lane'],
  ['rd_vc_swo_jct', 'vc_secretariat_node', 'VC Secretary Office Walk'],
  ['rd_vc_swo_jct', 'swo_office_node', 'SWO Office Walk'],
  ['vc_secretariat_node', 'swo_office_node', 'Admin & Welfare Shared Block'],
  ['vc_secretariat_node', 'rd_east_admin_walk', 'East Admin Block Walkway'],
  ['rd_east_admin_walk', 'central_library_entry', 'Library East Connector'],
  ['rd_east_admin_walk', 'nizam_memon_office_node', 'East Admin Block Walkway'],
  ['nizam_memon_office_node', 'rd_nizam_corridor', 'Memon Office Corridor'],
  ['rd_nizam_corridor', 'smart_class_entry', 'Smart Class East Walk'],
  ['rd_nizam_corridor', 'rd_central_bend', 'Points Terminal North Walk'],

  // South Campus New Auditorium Wing
  ['rd_south_west_ave', 'rd_new_audi_jct', 'South Auditorium Road'],
  ['rd_boulevard_sw', 'rd_new_audi_turn', 'South Boulevard Auditorium Turn'],
  ['rd_new_audi_turn', 'rd_new_audi_jct', 'New Auditorium Approach'],
  ['rd_new_audi_jct', 'new_audi_node', 'New Audi Entrance'],
];

const PIN_TO_NODE: Record<string, string> = {
  new_1_smart_class: 'smart_class_entry',
  campus_cafeteria: 'cafeteria_plaza',
  campus_transport: 'points_stop_node',
  hod_prof_saleem: 'dr_saleem_office_node',
  central_library: 'central_library_entry',
  new_building_mosque: 'mosque_new_bldg',
  gate_main: 'main_gates_entry',
  electronics_lab: 'electronics_lab_node',
  computer_lab_1: 'computer_lab_1_node',
  campus_atm: 'atm_kiosk',
  new_audi: 'new_audi_node',
  post_grad_office: 'post_grad_office_node',
  audi_old: 'audi_old_node',
  vc_secretariat_office: 'vc_secretariat_node',
  swo_office: 'swo_office_node',
  nizam_uddin_memon_office: 'nizam_memon_office_node',
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

interface DynamicGraph {
  nodes: Record<string, GraphNode>;
  adj: Record<string, GraphEdge[]>;
  edges: [string, string, string][];
}

function buildCampusAndOsmGraph(osmRoads?: LatLng[][]): DynamicGraph {
  const nodes: Record<string, GraphNode> = {};
  for (const [k, v] of Object.entries(GRAPH_NODES)) {
    nodes[k] = { ...v };
  }
  const adj: Record<string, GraphEdge[]> = {};
  for (const id of Object.keys(nodes)) {
    adj[id] = [];
  }
  const edges: [string, string, string][] = [...EDGE_DEFS];
  for (const [a, b, streetName] of EDGE_DEFS) {
    adj[a]?.push({ to: b, streetName });
    adj[b]?.push({ to: a, streetName });
  }

  // Merge live OpenStreetMap road ways into the navigable graph when loaded
  if (osmRoads && osmRoads.length > 0) {
    const osmNodeIds: string[] = [];
    const findOrCreateOsmNode = (pt: LatLng): string => {
      for (const id of osmNodeIds) {
        const n = nodes[id];
        if (calculateDistanceMeters(pt.lat, pt.lng, n.lat, n.lng) <= 4.5) {
          return id;
        }
      }
      const newId = `osm_${osmNodeIds.length}`;
      nodes[newId] = {
        id: newId,
        lat: pt.lat,
        lng: pt.lng,
        label: 'Campus Street',
      };
      adj[newId] = [];
      osmNodeIds.push(newId);
      return newId;
    };

    for (const road of osmRoads) {
      if (road.length < 2) continue;
      let prevId: string | null = null;
      for (const pt of road) {
        if (
          calculateDistanceMeters(pt.lat, pt.lng, BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng) >
            560 ||
          (pt.lng > 68.74435 && pt.lat < 27.5122)
        ) {
          prevId = null;
          continue;
        }
        const curId = findOrCreateOsmNode(pt);
        if (prevId && prevId !== curId) {
          const already = adj[prevId].some((e) => e.to === curId);
          if (!already) {
            adj[prevId].push({ to: curId, streetName: 'Mapped Campus Street' });
            adj[curId].push({ to: prevId, streetName: 'Mapped Campus Street' });
            edges.push([prevId, curId, 'Mapped Campus Street']);
          }
        }
        prevId = curId;
      }
    }

    // Bridge road junctions on our street backbone to nearby OSM road nodes (<= 16m)
    const anchorRoadIds = [
      'rd_cafeteria_nw',
      'rd_north_audi_jct',
      'rd_vc_swo_jct',
      'rd_atm_front',
      'rd_library_front',
      'rd_smart_front',
      'rd_west_spine_jct',
      'rd_points_jct',
      'rd_gates_jct',
      'rd_new_audi_jct',
    ];
    for (const aId of anchorRoadIds) {
      const aNode = nodes[aId];
      if (!aNode) continue;
      let bestOsmId: string | null = null;
      let bestDist = Infinity;
      for (const oId of osmNodeIds) {
        const d = calculateDistanceMeters(aNode.lat, aNode.lng, nodes[oId].lat, nodes[oId].lng);
        if (d < bestDist) {
          bestDist = d;
          bestOsmId = oId;
        }
      }
      if (bestOsmId && bestDist <= 16 && bestDist >= 1.5) {
        if (!adj[aId].some((e) => e.to === bestOsmId)) {
          adj[aId].push({ to: bestOsmId, streetName: aNode.label });
          adj[bestOsmId].push({ to: aId, streetName: aNode.label });
          edges.push([aId, bestOsmId, aNode.label]);
        }
      }
    }
  }

  return { nodes, adj, edges };
}

function attachPointToDynamicGraph(
  virtualId: string,
  coord: LatLng,
  approachName: string,
  graph: DynamicGraph,
  preferredNodeId?: string
): void {
  const { nodes, adj, edges } = graph;
  nodes[virtualId] = {
    id: virtualId,
    lat: coord.lat,
    lng: coord.lng,
    label: approachName,
  };
  adj[virtualId] = [];

  // If this coordinate corresponds directly to a mapped landmark entrance node,
  // enter strictly via that mapped entrance spur so paths follow roads/corridors instead of cutting diagonally.
  if (preferredNodeId && nodes[preferredNodeId]) {
    const pref = nodes[preferredNodeId];
    const prefDist = calculateDistanceMeters(coord.lat, coord.lng, pref.lat, pref.lng);
    if (prefDist <= 15) {
      adj[virtualId].push({ to: preferredNodeId, streetName: approachName });
      adj[preferredNodeId].push({ to: virtualId, streetName: approachName });
      return;
    }
  }

  // Otherwise snap perpendicularly onto the closest road/walkway segment(s)
  const edgeCandidates: {
    u: string;
    v: string;
    streetName: string;
    proj: LatLng;
    t: number;
    distMeters: number;
  }[] = [];

  for (const [u, v, streetName] of edges) {
    const nu = nodes[u];
    const nv = nodes[v];
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
  const closestDist = edgeCandidates[0]?.distMeters ?? 0;
  const topEdges = edgeCandidates.filter(
    (c, i) => i < 2 && (i === 0 || c.distMeters <= Math.min(18, closestDist + 6))
  );

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
}

function solveShortestGraphPath(
  origin: LatLng,
  originLabel: string,
  destinationPin: CampusPin,
  osmRoads?: LatLng[][]
): { points: LatLng[]; segNames: string[]; totalDist: number } {
  const graph = buildCampusAndOsmGraph(osmRoads);
  const { nodes, adj } = graph;

  const startId = '__start__';
  const endId = '__end__';

  // Match if origin itself sits right on one of the manual pins
  const originMatchingPin = CAMPUS_PINS.find(
    (p) => calculateDistanceMeters(origin.lat, origin.lng, p.latitude, p.longitude) <= 8
  );

  attachPointToDynamicGraph(
    startId,
    origin,
    `Walkway from ${originLabel}`,
    graph,
    originMatchingPin ? PIN_TO_NODE[originMatchingPin.id] : undefined
  );
  attachPointToDynamicGraph(
    endId,
    { lat: destinationPin.latitude, lng: destinationPin.longitude },
    `${destinationPin.mapLabel || destinationPin.name} Entrance`,
    graph,
    PIN_TO_NODE[destinationPin.id]
  );

  // Connect projections that land on the exact same road segment
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
  const d = ((deltaDeg + 540) % 360) - 180;
  if (Math.abs(d) < 18) return { action: 'STRAIGHT', verb: 'Continue straight' };
  if (d >= 18 && d < 50) return { action: 'KEEP_RIGHT', verb: 'Keep right' };
  if (d >= 50 && d < 125) return { action: 'RIGHT', verb: 'Turn right' };
  if (d >= 125) return { action: 'SHARP_RIGHT', verb: 'Make a sharp right' };
  if (d <= -18 && d > -50) return { action: 'KEEP_LEFT', verb: 'Keep left' };
  if (d <= -50 && d > -125) return { action: 'LEFT', verb: 'Turn left' };
  return { action: 'SHARP_LEFT', verb: 'Make a sharp left' };
}

export function compassDirectionLabel(bearingDeg: number): string {
  const dirs = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return dirs[Math.round(((bearingDeg % 360) / 45)) % 8];
}

export function computeCampusRoute(
  origin: LatLng,
  originLabel: string,
  destinationPin: CampusPin,
  osmRoads?: LatLng[][]
): ComputedRoute {
  const destCoord: LatLng = { lat: destinationPin.latitude, lng: destinationPin.longitude };
  const directDist = calculateDistanceMeters(origin.lat, origin.lng, destCoord.lat, destCoord.lng);

  let rawPoints: LatLng[] = [];
  let rawSegNames: string[] = [];

  if (directDist <= 28) {
    rawPoints = [origin, destCoord];
    rawSegNames = [`Walk directly to ${destinationPin.mapLabel || destinationPin.name}`];
  } else if (isOutsideCampusCoord(origin)) {
    const gatePin = CAMPUS_PINS.find((p) => p.id === 'gate_main');
    const gateCoord: LatLng = {
      lat: gatePin?.latitude ?? 27.510977,
      lng: gatePin?.longitude ?? 68.74388,
    };
    if (destinationPin.id === 'gate_main') {
      rawPoints = [origin, gateCoord];
      rawSegNames = ['Approach Road to Main Gates'];
    } else {
      const fromGate = solveShortestGraphPath(
        gateCoord,
        'Main Gates (Old & New Buildings)',
        destinationPin,
        osmRoads
      );
      rawPoints = [origin, ...fromGate.points];
      rawSegNames = ['Approach Road to Main Gates', ...fromGate.segNames];
    }
  } else {
    const solved = solveShortestGraphPath(origin, originLabel, destinationPin, osmRoads);
    rawPoints = solved.points;
    rawSegNames = solved.segNames;
  }

  // Deduplicate ultra-close vertices (< 2m) while preserving start & destination
  const cleanedPoints: LatLng[] = [];
  const cleanedNames: string[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const pt = rawPoints[i];
    if (cleanedPoints.length === 0) {
      cleanedPoints.push(pt);
    } else {
      const prevPt = cleanedPoints[cleanedPoints.length - 1];
      const d = calculateDistanceMeters(prevPt.lat, prevPt.lng, pt.lat, pt.lng);
      if (d >= 2.0 || i === rawPoints.length - 1) {
        cleanedPoints.push(pt);
        cleanedNames.push(rawSegNames[i - 1] ?? 'Campus Walkway');
      }
    }
  }

  if (cleanedPoints.length < 2) {
    cleanedPoints.push(destCoord);
    cleanedNames.push('Immediate Arrival');
  }

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
    } else if (turn.action === 'STRAIGHT' && next.dist < 5) {
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

export function isOutsideCampusCoord(
  coord: LatLng,
  osmBoundary?: LatLng[] | null
): boolean {
  const centerDist = calculateDistanceMeters(
    coord.lat,
    coord.lng,
    BBSUTSD_CENTER.lat,
    BBSUTSD_CENTER.lng
  );
  if (
    centerDist > 350 ||
    coord.lat < 27.50835 ||
    coord.lat > 27.51365 ||
    coord.lng < 68.7402 ||
    coord.lng > 68.74495
  ) {
    return true;
  }
  if (osmBoundary && osmBoundary.length >= 3) {
    const insidePoly = isPointInPolygon(coord.lat, coord.lng, osmBoundary);
    if (!insidePoly && centerDist > 260) {
      const nearManualPin = CAMPUS_PINS.some(
        (p) => calculateDistanceMeters(coord.lat, coord.lng, p.latitude, p.longitude) <= 35
      );
      if (!nearManualPin) return true;
    }
  }
  return false;
}

export async function fetchOsrmRoadRoute(
  origin: LatLng,
  destinationPin: CampusPin,
  osmRoads?: LatLng[][],
  osmBoundary?: LatLng[] | null
): Promise<ComputedRoute | null> {
  const destCoord: LatLng = { lat: destinationPin.latitude, lng: destinationPin.longitude };
  const directDist = calculateDistanceMeters(origin.lat, origin.lng, destCoord.lat, destCoord.lng);
  if (directDist <= 38) return null;

  const isOutsideCampus = isOutsideCampusCoord(origin, osmBoundary);
  if (!isOutsideCampus) {
    // Inside campus: strictly use campus + Main Gates walkable graph so routes never detour outside to small gates.
    return null;
  }

  const gatePin = CAMPUS_PINS.find((p) => p.id === 'gate_main');
  const gateLat = gatePin?.latitude ?? 27.510977;
  const gateLng = gatePin?.longitude ?? 68.74388;

  // Approaching from outside campus: ALWAYS calculate road path strictly to Main Gates first.
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
    if (roadPolyline.length < 2) return null;

    const fullPolyline: LatLng[] = [];
    if (calculateDistanceMeters(origin.lat, origin.lng, roadPolyline[0].lat, roadPolyline[0].lng) > 3) {
      fullPolyline.push(origin);
    }
    fullPolyline.push(...roadPolyline);

    const roadSteps: RouteStep[] = [];
    const legs = route.legs?.[0];
    if (Array.isArray(legs?.steps)) {
      legs.steps.forEach(
        (
          s: {
            distance: number;
            name?: string;
            geometry?: { coordinates?: [number, number][] };
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

          const segCoords: LatLng[] =
            s.geometry?.coordinates && s.geometry.coordinates.length >= 2
              ? s.geometry.coordinates.map((c) => ({ lat: c[1], lng: c[0] }))
              : s.maneuver?.location
              ? [{ lat: s.maneuver.location[1], lng: s.maneuver.location[0] }]
              : [origin];

          let action: TurnAction = 'STRAIGHT';
          let verb = 'Continue straight';
          if (idx === 0) {
            action = 'START';
            const bearing =
              segCoords.length >= 2
                ? calculateBearing(segCoords[0].lat, segCoords[0].lng, segCoords[1].lat, segCoords[1].lng)
                : calculateBearing(origin.lat, origin.lng, gateLat, gateLng);
            verb = `Head ${compassDirectionLabel(bearing)}`;
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
          const pt = loc ? { lat: loc[1], lng: loc[0] } : segCoords[0] ?? origin;
          const roadName =
            s.name && s.name.trim() ? s.name : 'City Approach Road';

          roadSteps.push({
            id: `osrm-${idx}`,
            action,
            instruction: `${verb} onto ${roadName} • ${formatDistance(s.distance)}`,
            streetName: roadName,
            distanceMeters: Math.round(s.distance),
            coord: pt,
            segmentCoords: segCoords,
          });
        }
      );
    }

    if (destinationPin.id === 'gate_main') {
      roadSteps.push({
        id: 'step-arrive-main-gate',
        action: 'ARRIVE',
        instruction: `Arrive at ${destinationPin.name} (${destinationPin.roomNumber})`,
        streetName: BUILDINGS[destinationPin.building].shortName,
        distanceMeters: 0,
        coord: { lat: gateLat, lng: gateLng },
        segmentCoords: [{ lat: gateLat, lng: gateLng }],
      });
      const totalDist = Math.round(route.distance || 0);
      return {
        polyline: fullPolyline,
        steps: roadSteps,
        totalDistanceMeters: totalDist,
        estimatedMinutes: estimateWalkMinutes(totalDist),
        usedExternalRoad: true,
      };
    }

    const campusPart = computeCampusRoute(
      { lat: gateLat, lng: gateLng },
      'Main Gates (Old & New Buildings)',
      destinationPin,
      osmRoads
    );
    const totalDist = Math.round((route.distance || 0) + campusPart.totalDistanceMeters);
    return {
      polyline: [...fullPolyline, ...campusPart.polyline],
      steps: [...roadSteps, ...campusPart.steps],
      totalDistanceMeters: totalDist,
      estimatedMinutes: estimateWalkMinutes(totalDist),
      usedExternalRoad: true,
    };
  } catch {
    return null;
  }
}

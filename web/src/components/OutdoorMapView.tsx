import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  ArrowUp,
  Bus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  CornerUpLeft,
  CornerUpRight,
  Crosshair,
  Flag,
  Footprints,
  Info,
  Layers,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Radio,
  RotateCcw,
  Route as RouteIcon,
  Search,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  BBSUTSD_CENTER,
  BUILDINGS,
  CAMPUS_PINS,
  CAMPUS_RADIUS_M,
  CATEGORY_COLORS,
  DIVIDING_ROAD_PATH,
  FLOORS,
  NEW_COMPLEX_ZONE,
  OLD_COMPLEX_ZONE,
  RESTRICT_BOUNDS,
} from '../data/campusData';
import type { GpsMode } from '../hooks/useGeolocation';
import type { CampusPin, LatLng, UserLocation } from '../types/campus';
import {
  calculateDistanceMeters,
  evaluateCampusContainment,
  formatDistance,
  searchPins,
} from '../utils/geo';
import {
  computeCampusRoute,
  fetchOsrmRoadRoute,
  type ComputedRoute,
  type RouteStep,
  type TurnAction,
} from '../utils/routing';
import {
  computeCircleOffsets,
  findClusterKeyForPin,
  groupOverlappingPins,
} from '../utils/spiderfy';

type MapFilterTab = 'ALL' | 'OFFICES' | 'CLASSES' | 'FOOD_BUS';
type MobileSheetTab = 'DIRECTIONS' | 'INFO';

const FILTER_TABS: { key: MapFilterTab; label: string }[] = [
  { key: 'ALL', label: 'All Pins' },
  { key: 'OFFICES', label: 'Offices & HODs' },
  { key: 'CLASSES', label: 'Classes, Labs & Lib' },
  { key: 'FOOD_BUS', label: 'Gates, Mosque & Bus' },
];

interface OutdoorMapViewProps {
  userLocation: UserLocation | null;
  gpsMode: GpsMode;
  isAcquiringGps?: boolean;
  presetIndex: number;
  presets: UserLocation[];
  gpsError: string | null;
  navTargetPin: CampusPin | null;
  onClearNavTarget: () => void;
  onRequestLiveGps: () => void;
  onSelectPreset: (idx: number) => void;
  onOpenPinDetail: (pin: CampusPin) => void;
  onOpenBusTimings: () => void;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function matchesFilter(pin: CampusPin, filter: MapFilterTab, query: string): boolean {
  if (filter === 'OFFICES') {
    if (pin.category !== 'ADMIN' && pin.category !== 'STUDENT_SERVICE') return false;
  } else if (filter === 'CLASSES') {
    if (pin.category !== 'ACADEMIC' && pin.category !== 'LAB' && pin.category !== 'LIBRARY') return false;
  } else if (filter === 'FOOD_BUS') {
    if (pin.category !== 'AMENITY' && pin.category !== 'TRANSPORT_GATE') return false;
  }

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    const hay = `${pin.mapLabel} ${pin.name} ${pin.subTitle} ${pin.roomNumber} ${pin.tags.join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function TurnGlyph({ action, className }: { action: TurnAction; className?: string }) {
  const cls = className ?? 'h-4 w-4';
  switch (action) {
    case 'LEFT':
    case 'SHARP_LEFT':
    case 'KEEP_LEFT':
      return <CornerUpLeft className={cls} />;
    case 'RIGHT':
    case 'SHARP_RIGHT':
    case 'KEEP_RIGHT':
      return <CornerUpRight className={cls} />;
    case 'ARRIVE':
      return <Flag className={cls} />;
    case 'START':
      return <Navigation className={cls} />;
    default:
      return <ArrowUp className={cls} />;
  }
}

const LABEL_ZOOM_THRESHOLD = 18;

function getCategoryPinSvg(pin: CampusPin): string {
  const id = pin.id;
  if (id === 'campus_mosque' || id === 'new_building_mosque') {
    return '<svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  }
  if (id === 'campus_cafeteria') {
    return '<svg viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/></svg>';
  }
  if (id === 'campus_atm') {
    return '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>';
  }
  if (id === 'campus_sports') {
    return '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  }
  if (id.startsWith('hostel_')) {
    return '<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  }
  if (id === 'gate_main') {
    return '<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V9a7 7 0 0 1 14 0v12"/><path d="M9 21v-6a3 3 0 0 1 6 0v6"/></svg>';
  }
  if (id === 'new_g_medical') {
    return '<svg viewBox="0 0 24 24"><path d="M12 6v12"/><path d="M6 12h12"/><rect x="3" y="3" width="18" height="18" rx="4"/></svg>';
  }
  if (id.startsWith('ws_') || id === 'campus_workshops') {
    return '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
  }
  switch (pin.category) {
    case 'ADMIN':
      return '<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/><path d="M9 21v-5h6v5"/><path d="M9 11h.01"/><path d="M15 11h.01"/></svg>';
    case 'STUDENT_SERVICE':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>';
    case 'LAB':
      return '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M9 2v2"/><path d="M15 20v2"/><path d="M9 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/></svg>';
    case 'LIBRARY':
      return '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
    case 'TRANSPORT_GATE':
      return '<svg viewBox="0 0 24 24"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M4 18V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v11"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>';
    case 'AMENITY':
      return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
    case 'ACADEMIC':
    default:
      return '<svg viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
  }
}

export function OutdoorMapView({
  userLocation,
  gpsMode,
  isAcquiringGps = false,
  presetIndex,
  presets,
  gpsError,
  navTargetPin,
  onClearNavTarget,
  onRequestLiveGps,
  onSelectPreset,
  onOpenPinDetail,
  onOpenBusTimings,
}: OutdoorMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const satLayerRef = useRef<L.TileLayer | null>(null);
  const streetLayerRef = useRef<L.TileLayer | null>(null);
  const geometryLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const guideLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const lastOsrmOriginRef = useRef<{ pinId: string; coord: LatLng } | null>(null);

  const [isSatellite, setIsSatellite] = useState(true);
  const [mapZoom, setMapZoom] = useState(17);
  const [selectedFilter, setSelectedFilter] = useState<MapFilterTab>('ALL');
  const [searchText, setSearchText] = useState('');
  const [focusedPin, setFocusedPin] = useState<CampusPin | null>(null);
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
  const [customOriginPinId, setCustomOriginPinId] = useState<string>('AUTO_GPS');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [mobileSheetTab, setMobileSheetTab] = useState<MobileSheetTab>('DIRECTIONS');
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState<boolean>(true);
  const [showMobileDirectory, setShowMobileDirectory] = useState<boolean>(false);
  const hasNavTargetOnMountRef = useRef<boolean>(Boolean(navTargetPin));
  const [externalRoute, setExternalRoute] = useState<ComputedRoute | null>(null);
  const [isFetchingExternalRoute, setIsFetchingExternalRoute] = useState(false);

  const [osmBoundary, setOsmBoundary] = useState<LatLng[] | null>(null);
  const [osmBuildings, setOsmBuildings] = useState<
    { coords: LatLng[]; centerLat: number; centerLng: number }[]
  >([]);
  const [osmRoads, setOsmRoads] = useState<LatLng[][]>([]);
  const [outsideNotice, setOutsideNotice] = useState(false);

  const effectiveOrigin = useMemo<{ coord: LatLng; label: string; isPinOrigin: boolean } | null>(
    () => {
      if (customOriginPinId !== 'AUTO_GPS') {
        const originPin = CAMPUS_PINS.find((p) => p.id === customOriginPinId);
        if (originPin) {
          return {
            coord: { lat: originPin.latitude, lng: originPin.longitude },
            label: originPin.mapLabel || originPin.name,
            isPinOrigin: true,
          };
        }
      }
      if (userLocation) {
        return {
          coord: { lat: userLocation.latitude, lng: userLocation.longitude },
          label: userLocation.label || 'Your Live Location',
          isPinOrigin: false,
        };
      }
      return null;
    },
    [customOriginPinId, userLocation]
  );

  const boundaryStatus = useMemo(() => {
    if (!userLocation) return null;
    return evaluateCampusContainment(
      userLocation.latitude,
      userLocation.longitude,
      osmBoundary
    );
  }, [userLocation, osmBoundary]);

  const searchSuggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    return searchPins(CAMPUS_PINS, searchText).slice(0, 6);
  }, [searchText]);

  const filteredDirectoryPins = useMemo(() => {
    return CAMPUS_PINS.filter((p) => matchesFilter(p, selectedFilter, searchText));
  }, [selectedFilter, searchText]);

  const localCampusRoute = useMemo<ComputedRoute | null>(() => {
    if (!focusedPin || !effectiveOrigin) return null;
    return computeCampusRoute(effectiveOrigin.coord, effectiveOrigin.label, focusedPin, osmRoads);
  }, [focusedPin, effectiveOrigin, osmRoads]);

  useEffect(() => {
    setActiveStepIndex(0);
  }, [focusedPin?.id, customOriginPinId]);

  useEffect(() => {
    if (!focusedPin || !effectiveOrigin) {
      setExternalRoute(null);
      setIsFetchingExternalRoute(false);
      lastOsrmOriginRef.current = null;
      return;
    }
    const directDist = calculateDistanceMeters(
      effectiveOrigin.coord.lat,
      effectiveOrigin.coord.lng,
      focusedPin.latitude,
      focusedPin.longitude
    );
    const distFromCampus = calculateDistanceMeters(
      effectiveOrigin.coord.lat,
      effectiveOrigin.coord.lng,
      BBSUTSD_CENTER.lat,
      BBSUTSD_CENTER.lng
    );
    if (directDist <= 38 || distFromCampus > 50000) {
      setExternalRoute(null);
      setIsFetchingExternalRoute(false);
      lastOsrmOriginRef.current = null;
      return;
    }

    const last = lastOsrmOriginRef.current;
    if (
      last &&
      last.pinId === focusedPin.id &&
      calculateDistanceMeters(
        last.coord.lat,
        last.coord.lng,
        effectiveOrigin.coord.lat,
        effectiveOrigin.coord.lng
      ) < 12
    ) {
      return;
    }

    lastOsrmOriginRef.current = { pinId: focusedPin.id, coord: effectiveOrigin.coord };
    setExternalRoute(null);
    let cancelled = false;
    setIsFetchingExternalRoute(true);
    fetchOsrmRoadRoute(effectiveOrigin.coord, focusedPin, osmRoads)
      .then((res) => {
        if (!cancelled && res) {
          setExternalRoute(res);
        }
      })
      .finally(() => {
        if (!cancelled) setIsFetchingExternalRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [focusedPin, effectiveOrigin, osmRoads]);

  const activeRoute = externalRoute ?? localCampusRoute;

  const fitRouteBounds = useCallback((route: ComputedRoute | null, pin: CampusPin | null) => {
    const map = mapRef.current;
    if (!map) return;
    if (route && route.polyline.length >= 2) {
      const bounds = L.latLngBounds(route.polyline.map((p) => [p.lat, p.lng] as [number, number]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 19, animate: true });
        return;
      }
    }
    if (pin) {
      map.setView([pin.latitude, pin.longitude], 18, { animate: true });
    }
  }, []);

  const fitAllCampusPins = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (CAMPUS_PINS.length >= 2) {
      const bounds = L.latLngBounds(
        CAMPUS_PINS.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 17, animate: true });
        return;
      }
    }
    if (CAMPUS_PINS.length === 1) {
      map.setView([CAMPUS_PINS[0].latitude, CAMPUS_PINS[0].longitude], 17, { animate: true });
      return;
    }
    map.setView([BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng], 17, { animate: true });
  }, []);

  const handleSelectPin = useCallback((pin: CampusPin) => {
    setFocusedPin(pin);
    const clusters = groupOverlappingPins(CAMPUS_PINS);
    const clusterKey = findClusterKeyForPin(clusters, pin.id);
    setExpandedClusterKey(clusterKey);
    setActiveStepIndex(0);
    setMobileSheetExpanded(true);
    setShowMobileDirectory(false);
    const map = mapRef.current;
    if (map) {
      map.panTo([pin.latitude, pin.longitude], { animate: true });
    }
  }, []);

  const handleSelectPinRef = useRef(handleSelectPin);
  handleSelectPinRef.current = handleSelectPin;

  const focusStepOnMap = useCallback((step: RouteStep, index: number) => {
    setActiveStepIndex(index);
    const map = mapRef.current;
    if (!map) return;
    if (step.segmentCoords.length >= 2) {
      const bounds = L.latLngBounds(
        step.segmentCoords.map((p) => [p.lat, p.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [64, 64], maxZoom: 20, animate: true });
    } else {
      map.setView([step.coord.lat, step.coord.lng], 20, { animate: true });
    }
  }, []);

  const focusStepOnMapRef = useRef(focusStepOnMap);
  focusStepOnMapRef.current = focusStepOnMap;

  // 1. Initialize Leaflet Map + ResizeObserver
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current) return;

    const bounds = L.latLngBounds(
      [RESTRICT_BOUNDS.south, RESTRICT_BOUNDS.west],
      [RESTRICT_BOUNDS.north, RESTRICT_BOUNDS.east]
    );

    const map = L.map(container, {
      center: [BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng],
      zoom: 17,
      minZoom: 15,
      maxZoom: 21,
      maxBounds: bounds.pad(0.25),
      maxBoundsViscosity: 0.75,
      zoomControl: false,
      attributionControl: false,
    });

    // Updated Google Hybrid Satellite (satellite photography + live streets & labels)
    const sat = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        maxNativeZoom: 20,
        maxZoom: 21,
      }
    );
    // Updated Google Street Roadmap (crisp current streets, intersections, blocks)
    const street = L.tileLayer(
      'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        subdomains: ['0', '1', '2', '3'],
        maxNativeZoom: 20,
        maxZoom: 21,
      }
    );

    sat.addTo(map);

    const geoGroup = L.layerGroup().addTo(map);
    const guideGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);

    map.on('click', () => {
      setFocusedPin(null);
      setExpandedClusterKey(null);
    });

    const syncZoomLabels = () => {
      const z = map.getZoom();
      setMapZoom(z);
      map.getContainer().classList.toggle('map-show-labels', z >= LABEL_ZOOM_THRESHOLD);
    };
    map.on('zoomend', syncZoomLabels);
    syncZoomLabels();

    if (!hasNavTargetOnMountRef.current && CAMPUS_PINS.length >= 2) {
      const pinBounds = L.latLngBounds(
        CAMPUS_PINS.map((p) => [p.latitude, p.longitude] as [number, number])
      );
      if (pinBounds.isValid()) {
        map.fitBounds(pinBounds, { padding: [56, 56], maxZoom: 17, animate: false });
      }
    }

    mapRef.current = map;
    satLayerRef.current = sat;
    streetLayerRef.current = street;
    geometryLayerGroupRef.current = geoGroup;
    guideLayerGroupRef.current = guideGroup;
    markersLayerGroupRef.current = markersGroup;
    userLayerGroupRef.current = userGroup;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);
    const initTimer = window.setTimeout(() => map.invalidateSize({ animate: false }), 120);

    const controller = new AbortController();
    const query = `[out:json][timeout:12];
      (
        way["amenity"="university"](around:600,${BBSUTSD_CENTER.lat},${BBSUTSD_CENTER.lng});
        relation["amenity"="university"](around:600,${BBSUTSD_CENTER.lat},${BBSUTSD_CENTER.lng});
        way["landuse"="education"](around:600,${BBSUTSD_CENTER.lat},${BBSUTSD_CENTER.lng});
        way["building"](around:480,${BBSUTSD_CENTER.lat},${BBSUTSD_CENTER.lng});
        way["highway"](around:480,${BBSUTSD_CENTER.lat},${BBSUTSD_CENTER.lng});
      );
      out geom;`;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) =>
        res.ok
          ? res.json()
          : fetch(`https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`, {
              signal: controller.signal,
            }).then((r2) => (r2.ok ? r2.json() : Promise.reject(new Error('OSM failed'))))
      )
      .then((data) => {
        if (!data || !Array.isArray(data.elements)) return;
        let poly: LatLng[] | null = null;
        const blds: { coords: LatLng[]; centerLat: number; centerLng: number }[] = [];
        const roads: LatLng[][] = [];

        for (const el of data.elements) {
          if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2) {
            const tags = el.tags || {};
            if (
              (tags.amenity === 'university' || tags.landuse === 'education') &&
              el.geometry.length >= 3
            ) {
              poly = el.geometry.map((g: { lat: number; lon: number }) => ({
                lat: g.lat,
                lng: g.lon,
              }));
            } else if (tags.building && el.geometry.length >= 3) {
              const coords: LatLng[] = el.geometry.map((g: { lat: number; lon: number }) => ({
                lat: g.lat,
                lng: g.lon,
              }));
              const avgLat = coords.reduce((s, p) => s + p.lat, 0) / coords.length;
              const avgLng = coords.reduce((s, p) => s + p.lng, 0) / coords.length;
              if (
                calculateDistanceMeters(
                  avgLat,
                  avgLng,
                  BBSUTSD_CENTER.lat,
                  BBSUTSD_CENTER.lng
                ) <= 380
              ) {
                blds.push({ coords, centerLat: avgLat, centerLng: avgLng });
              }
            } else if (tags.highway) {
              roads.push(
                el.geometry.map((g: { lat: number; lon: number }) => ({
                  lat: g.lat,
                  lng: g.lon,
                }))
              );
            }
          }
        }

        setOsmBoundary(poly);
        setOsmBuildings(blds);
        setOsmRoads(roads);
      })
      .catch(() => {
        // Fallback smoothly to curated BBSUTSD zones
      });

    return () => {
      window.clearTimeout(initTimer);
      resizeObserver.disconnect();
      controller.abort();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Toggle Satellite vs Map View Layer
  useEffect(() => {
    const map = mapRef.current;
    const sat = satLayerRef.current;
    const street = streetLayerRef.current;
    if (!map || !sat || !street) return;

    if (isSatellite) {
      if (map.hasLayer(street)) map.removeLayer(street);
      if (!map.hasLayer(sat)) sat.addTo(map);
    } else {
      if (map.hasLayer(sat)) map.removeLayer(sat);
      if (!map.hasLayer(street)) street.addTo(map);
    }
  }, [isSatellite]);

  // 3. Render Complex Polygons, Dividing Road, OSM Buildings & Perimeter
  useEffect(() => {
    const group = geometryLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (osmBoundary && osmBoundary.length >= 3) {
      L.polygon(
        osmBoundary.map((p) => [p.lat, p.lng]),
        {
          color: '#0B57D0',
          weight: 2.5,
          opacity: 0.78,
          dashArray: '8, 6',
          fillColor: '#0B57D0',
          fillOpacity: 0.04,
          interactive: false,
        }
      ).addTo(group);
    } else {
      L.circle([BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng], {
        radius: CAMPUS_RADIUS_M,
        color: '#0B57D0',
        weight: 2.5,
        opacity: 0.78,
        dashArray: '8, 6',
        fillColor: '#0B57D0',
        fillOpacity: 0.04,
        interactive: false,
      }).addTo(group);
    }

    const zoneFill = isSatellite ? 0.04 : 0.11;
    const bldFill = isSatellite ? 0.06 : 0.18;

    L.polygon(
      OLD_COMPLEX_ZONE.map((p) => [p.lat, p.lng]),
      {
        color: '#B3261E',
        weight: 1.8,
        opacity: 0.8,
        dashArray: '6, 5',
        fillColor: '#B3261E',
        fillOpacity: zoneFill,
        interactive: false,
      }
    ).addTo(group);

    L.polygon(
      NEW_COMPLEX_ZONE.map((p) => [p.lat, p.lng]),
      {
        color: '#0F9D58',
        weight: 1.8,
        opacity: 0.8,
        dashArray: '6, 5',
        fillColor: '#0F9D58',
        fillOpacity: zoneFill,
        interactive: false,
      }
    ).addTo(group);

    osmBuildings.forEach((bld) => {
      const isOld = bld.centerLat >= 27.51085 || bld.centerLng < 68.74162;
      const color = isOld ? '#B3261E' : '#0F9D58';
      L.polygon(
        bld.coords.map((p) => [p.lat, p.lng]),
        {
          color,
          weight: 1.5,
          opacity: 0.72,
          fillColor: color,
          fillOpacity: bldFill,
          interactive: false,
        }
      ).addTo(group);
    });

    L.polyline(
      DIVIDING_ROAD_PATH.map((p) => [p.lat, p.lng]),
      {
        color: '#FFFFFF',
        weight: isSatellite ? 5 : 7,
        opacity: isSatellite ? 0.45 : 0.85,
        interactive: false,
      }
    ).addTo(group);

    L.polyline(
      DIVIDING_ROAD_PATH.map((p) => [p.lat, p.lng]),
      {
        color: '#0B57D0',
        weight: 2.5,
        opacity: isSatellite ? 0.65 : 0.85,
        dashArray: '8, 6',
        interactive: false,
      }
    ).addTo(group);

    osmRoads.forEach((segment) => {
      L.polyline(
        segment.map((p) => [p.lat, p.lng]),
        {
          color: isSatellite ? '#FEF08A' : '#FFFFFF',
          weight: 2,
          opacity: isSatellite ? 0.35 : 0.68,
          interactive: false,
        }
      ).addTo(group);
    });

    const addBadge = (lat: number, lng: number, label: string, cls: string) => {
      const icon = L.divIcon({
        className: 'campus-leaflet-icon',
        html: `<div class="zone-badge ${cls}">${escapeHtml(label)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 50 }).addTo(group);
    };

    addBadge(27.51162, 68.74098, 'Old Building Complex', 'zone-badge-old');
    addBadge(27.51083, 68.74163, 'Campus Dividing Road', 'zone-badge-road');
    addBadge(27.51018, 68.7422, 'New Building Complex', 'zone-badge-new');
  }, [osmBoundary, osmBuildings, osmRoads, isSatellite]);

  // 4. Render Labeled Campus Pill Pins + Spiderfy Dispersion for Overlapping Pins
  useEffect(() => {
    const group = markersLayerGroupRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();

    const visiblePins = CAMPUS_PINS.filter((p) =>
      matchesFilter(p, selectedFilter, searchText)
    );
    const clusters = groupOverlappingPins(visiblePins);

    const attachSinglePin = (
      pin: CampusPin,
      lat: number,
      lng: number,
      isSpiderLeg: boolean,
      legIndex: number
    ) => {
      const color = CATEGORY_COLORS[pin.category] ?? '#0B57D0';
      const isSelected = focusedPin?.id === pin.id;
      const isOrigin = customOriginPinId === pin.id;
      const animDelay = isSpiderLeg ? ` style="--pin-color:${color};animation-delay:${legIndex * 45}ms"` : ` style="--pin-color:${color}"`;
      const html = `<div class="campus-pin${isSelected ? ' is-selected' : ''}${isOrigin ? ' is-origin' : ''}${isSpiderLeg ? ' is-spider-leg' : ''}" role="button" tabindex="0" aria-label="${escapeHtml(pin.name)}"${animDelay}>
        <div class="campus-pin-label">${isOrigin ? 'Start: ' : ''}${escapeHtml(pin.mapLabel || pin.name)}</div>
        <div class="campus-pin-icon">${getCategoryPinSvg(pin)}</div>
      </div>`;

      const icon = L.divIcon({
        className: 'campus-leaflet-icon',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lng], {
        icon,
        interactive: false,
        zIndexOffset: isSelected ? 960 : isSpiderLeg ? 890 : isOrigin ? 800 : 200,
      }).addTo(group);

      const containerEl = marker.getElement();
      if (containerEl) {
        L.DomEvent.disableClickPropagation(containerEl);
        const pinEl = containerEl.querySelector('.campus-pin') as HTMLElement | null;
        if (pinEl) {
          pinEl.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            handleSelectPinRef.current(pin);
          });
          pinEl.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              ev.stopPropagation();
              handleSelectPinRef.current(pin);
            }
          });
        }
      }
    };

    clusters.forEach((cluster) => {
      if (cluster.pins.length === 1) {
        const pin = cluster.pins[0];
        attachSinglePin(pin, pin.latitude, pin.longitude, false, 0);
        return;
      }

      const isExpanded = expandedClusterKey === cluster.key;
      if (!isExpanded) {
        const count = cluster.pins.length;
        const containsFocused = cluster.pins.some((p) => p.id === focusedPin?.id);
        const containsOrigin = cluster.pins.some((p) => p.id === customOriginPinId);
        const previewNames = cluster.pins.map((p) => p.mapLabel || p.name).join(' • ');
        const hubHtml = `<div class="campus-pin campus-spider-hub${containsFocused ? ' is-selected' : ''}${containsOrigin ? ' is-origin' : ''}" role="button" tabindex="0" aria-label="${count} overlapping locations: ${escapeHtml(previewNames)}. Tap to expand." style="--pin-color:#7C4D2B">
          <div class="campus-pin-label">${count} Overlapping • Tap to spread</div>
          <div class="campus-pin-icon"><svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg></div>
          <span class="campus-spider-count">${count}</span>
        </div>`;

        const hubIcon = L.divIcon({
          className: 'campus-leaflet-icon',
          html: hubHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const hubMarker = L.marker([cluster.anchor.lat, cluster.anchor.lng], {
          icon: hubIcon,
          interactive: false,
          zIndexOffset: containsFocused ? 900 : 350,
        }).addTo(group);

        const el = hubMarker.getElement();
        if (el) {
          L.DomEvent.disableClickPropagation(el);
          const hubEl = el.querySelector('.campus-pin') as HTMLElement | null;
          const expandCluster = (ev: Event) => {
            ev.preventDefault();
            ev.stopPropagation();
            setExpandedClusterKey(cluster.key);
            map.panTo([cluster.anchor.lat, cluster.anchor.lng], { animate: true });
          };
          if (hubEl) {
            hubEl.addEventListener('click', expandCluster);
            hubEl.addEventListener('keydown', (ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') expandCluster(ev);
            });
          }
        }
        return;
      }

      // Spiderfied: fan overlapping pins out in a neat circle around anchor in pixel space
      const anchorPt = map.latLngToLayerPoint([cluster.anchor.lat, cluster.anchor.lng]);
      const offsets = computeCircleOffsets(cluster.pins.length);
      const circleRadiusPx = Math.hypot(offsets[0].x, offsets[0].y);
      const ringEdgeLatLng = map.layerPointToLatLng(
        L.point(anchorPt.x + circleRadiusPx, anchorPt.y)
      );
      const ringMeters = calculateDistanceMeters(
        cluster.anchor.lat,
        cluster.anchor.lng,
        ringEdgeLatLng.lat,
        ringEdgeLatLng.lng
      );

      if (ringMeters > 0.5) {
        L.circle([cluster.anchor.lat, cluster.anchor.lng], {
          radius: ringMeters,
          color: '#A66B3F',
          weight: 1.5,
          opacity: 0.55,
          dashArray: '4, 5',
          fillColor: '#F6ECE0',
          fillOpacity: 0.14,
          interactive: false,
        }).addTo(group);
      }

      cluster.pins.forEach((pin, idx) => {
        const offset = offsets[idx];
        const dispersedLatLng = map.layerPointToLatLng(
          L.point(anchorPt.x + offset.x, anchorPt.y + offset.y)
        );

        L.polyline(
          [
            [cluster.anchor.lat, cluster.anchor.lng],
            [dispersedLatLng.lat, dispersedLatLng.lng],
          ],
          {
            color: '#7C4D2B',
            weight: 2,
            opacity: 0.72,
            dashArray: '4, 4',
            interactive: false,
          }
        ).addTo(group);

        attachSinglePin(pin, dispersedLatLng.lat, dispersedLatLng.lng, true, idx);
      });

      const anchorIcon = L.divIcon({
        className: 'campus-leaflet-icon',
        html: '<button type="button" class="campus-spider-anchor" aria-label="Collapse spread pins" title="Collapse spread pins">×</button>',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const anchorMarker = L.marker([cluster.anchor.lat, cluster.anchor.lng], {
        icon: anchorIcon,
        interactive: false,
        zIndexOffset: 920,
      }).addTo(group);

      const anchorEl = anchorMarker.getElement();
      if (anchorEl) {
        L.DomEvent.disableClickPropagation(anchorEl);
        const btn = anchorEl.querySelector('.campus-spider-anchor');
        if (btn) {
          btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            setExpandedClusterKey(null);
          });
        }
      }
    });
  }, [selectedFilter, searchText, focusedPin, customOriginPinId, expandedClusterKey, mapZoom]);

  // 5. Render User GPS Blue Dot
  useEffect(() => {
    const group = userLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!userLocation) return;

    const acc = Math.min(Math.max(userLocation.accuracyMeters ?? 15, 5), 120);
    L.circle([userLocation.latitude, userLocation.longitude], {
      radius: acc,
      color: '#0B57D0',
      weight: 1.5,
      opacity: 0.45,
      fillColor: '#0B57D0',
      fillOpacity: 0.14,
      interactive: false,
    }).addTo(group);

    const gpsIcon = L.divIcon({
      className: '',
      html: '<div class="gps-dot-wrapper"><div class="gps-dot-pulse"></div><div class="gps-dot-core"></div></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([userLocation.latitude, userLocation.longitude], {
      icon: gpsIcon,
      interactive: false,
      zIndexOffset: 999,
    }).addTo(group);
  }, [userLocation]);

  // 6. Render Google Maps Style Cobalt Blue Multi-Segment Turn-by-Turn Path
  useEffect(() => {
    const group = guideLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!focusedPin || !activeRoute || activeRoute.polyline.length < 2) return;

    const latLngs: [number, number][] = activeRoute.polyline.map((p) => [p.lat, p.lng]);

    L.polyline(latLngs, {
      color: '#FFFFFF',
      weight: 9,
      opacity: 0.96,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    }).addTo(group);

    L.polyline(latLngs, {
      color: '#0B57D0',
      weight: 5,
      opacity: 0.96,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    }).addTo(group);

    const currentStep = activeRoute.steps[activeStepIndex];
    if (currentStep && currentStep.segmentCoords.length >= 2) {
      L.polyline(
        currentStep.segmentCoords.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#0F9D58',
          weight: 6.5,
          opacity: 0.98,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }
      ).addTo(group);
    }

    if (effectiveOrigin?.isPinOrigin) {
      const originIcon = L.divIcon({
        className: 'campus-leaflet-icon',
        html: `<div class="route-origin-badge">Start • ${escapeHtml(effectiveOrigin.label)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([effectiveOrigin.coord.lat, effectiveOrigin.coord.lng], {
        icon: originIcon,
        interactive: false,
        zIndexOffset: 940,
      }).addTo(group);
    }

    activeRoute.steps.forEach((step, idx) => {
      if (step.action === 'ARRIVE') return;
      const isStepActive = idx === activeStepIndex;
      const badgeIcon = L.divIcon({
        className: 'campus-leaflet-icon',
        html: `<div class="route-turn-badge${isStepActive ? ' is-active' : ''}" title="${escapeHtml(step.instruction)}">${idx + 1}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const turnMarker = L.marker([step.coord.lat, step.coord.lng], {
        icon: badgeIcon,
        interactive: false,
        zIndexOffset: isStepActive ? 980 : 750,
      }).addTo(group);

      const el = turnMarker.getElement();
      if (el) {
        L.DomEvent.disableClickPropagation(el);
        const badgeEl = el.querySelector('.route-turn-badge') as HTMLElement | null;
        if (badgeEl) {
          badgeEl.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            focusStepOnMapRef.current(step, idx);
          });
        }
      }
    });
  }, [focusedPin, activeRoute, activeStepIndex, effectiveOrigin]);

  // 7. Handle incoming navigation target from other tabs
  useEffect(() => {
    if (!navTargetPin) return;
    setFocusedPin(navTargetPin);
    const clusters = groupOverlappingPins(CAMPUS_PINS);
    setExpandedClusterKey(findClusterKeyForPin(clusters, navTargetPin.id));
    setSelectedFilter('ALL');
    setSearchText('');
    setActiveStepIndex(0);
    setMobileSheetTab('DIRECTIONS');
    setMobileSheetExpanded(true);
    mapRef.current?.setView([navTargetPin.latitude, navTargetPin.longitude], 18, {
      animate: true,
    });
    onClearNavTarget();
  }, [navTargetPin, onClearNavTarget]);

  const handleRecenterUser = () => {
    if (!userLocation) {
      onRequestLiveGps();
      return;
    }
    const status = evaluateCampusContainment(
      userLocation.latitude,
      userLocation.longitude,
      osmBoundary
    );
    if (status.isInside) {
      mapRef.current?.setView([userLocation.latitude, userLocation.longitude], 18, {
        animate: true,
      });
    } else {
      mapRef.current?.setView([BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng], 17, {
        animate: true,
      });
      setOutsideNotice(true);
      window.setTimeout(() => setOutsideNotice(false), 3500);
    }
  };

  const focusPinFromSearch = (pin: CampusPin) => {
    setSelectedFilter('ALL');
    setSearchText('');
    setShowMobileDirectory(false);
    handleSelectPin(pin);
    const route = effectiveOrigin
      ? computeCampusRoute(effectiveOrigin.coord, effectiveOrigin.label, pin, osmRoads)
      : null;
    fitRouteBounds(route, pin);
  };

  const currentTutorialStep = activeRoute?.steps[activeStepIndex] ?? null;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[360px_1fr] xl:grid-cols-[400px_1fr] h-[calc(100dvh-148px)] sm:h-[calc(100dvh-152px)] lg:h-[calc(100dvh-96px)] min-h-[380px] lg:min-h-[480px] w-full overflow-hidden rounded-[28px] border border-[#E6DDD0] bg-[#FFFFFF] nutty-card">
      {/* =================================================================== */}
      {/* DESKTOP LEFT PANEL (Hidden < lg so mobile stays full-screen)       */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex flex-col h-full min-h-0 overflow-hidden border-r border-[#E6DDD0] bg-[#FFFFFF]">
        {/* Header & Search */}
        <div className="border-b border-[#E6DDD0] p-4 space-y-3 bg-gradient-to-b from-[#FAF7F2] to-[#FFFFFF]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-base font-bold text-[#1F1812]">
                Campus Directions
              </h1>
              <p className="font-mono text-[10.5px] font-medium text-[#7D7166]">
                27.5108° N • 68.7416° E • Khairpur Mirs
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestLiveGps}
              className={`nutty-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[11px] font-semibold cursor-pointer ${
                gpsMode === 'LIVE'
                  ? 'bg-[#E6F4EA] text-[#137333] border border-[#0F9D58]'
                  : 'bg-[#F6ECE0] text-[#7C4D2B] border border-[#DFCBB4] hover:bg-[#EFE0CE]'
              }`}
            >
              <Radio className="h-3 w-3" />
              <span>{gpsMode === 'LIVE' ? 'Live GPS' : 'Use GPS'}</span>
            </button>
          </div>

          {/* Start From (Origin) Selector */}
          <div className="rounded-2xl border border-[#DFCBB4] bg-[#FFFFFF] p-3 space-y-2 shadow-[0_3px_10px_-3px_rgba(74,44,21,0.08)]">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="desktop-origin-select"
                className="text-[11px] font-bold text-[#0F9D58]"
              >
                A • Start Location
              </label>
              {customOriginPinId !== 'AUTO_GPS' && (
                <button
                  type="button"
                  onClick={() => setCustomOriginPinId('AUTO_GPS')}
                  className="nutty-chip flex items-center gap-1 rounded-full bg-[#F6ECE0] px-2 py-0.5 text-[11px] font-semibold text-[#7C4D2B] cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset GPS
                </button>
              )}
            </div>
            <select
              id="desktop-origin-select"
              value={customOriginPinId}
              onChange={(e) => {
                setCustomOriginPinId(e.target.value);
                setActiveStepIndex(0);
              }}
              className="w-full rounded-xl border border-[#E6DDD0] bg-[#FAF7F2] px-3 py-2 text-xs font-medium text-[#1F1812] outline-none focus:border-[#7C4D2B] transition"
            >
              <option value="AUTO_GPS">
                {gpsMode === 'LIVE'
                  ? 'Live Browser GPS Signal'
                  : `GPS Preset: ${presets[presetIndex]?.label ?? 'Main Gates (Old & New Buildings)'}`}
              </option>
              <optgroup label="── Pick Any Campus Starting Landmark ──">
                {CAMPUS_PINS.map((pin) => (
                  <option key={pin.id} value={pin.id}>
                    {pin.mapLabel || pin.name} ({pin.roomNumber})
                  </option>
                ))}
              </optgroup>
            </select>

            {customOriginPinId === 'AUTO_GPS' && gpsMode === 'SIMULATED' && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10.5px] font-semibold text-[#7D7166]">Preset:</span>
                <select
                  aria-label="Campus GPS Preset"
                  value={presetIndex}
                  onChange={(e) => onSelectPreset(Number(e.target.value))}
                  className="flex-1 rounded-xl border border-[#E6DDD0] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] text-[#1F1812] outline-none focus:border-[#7C4D2B]"
                >
                  {presets.map((p, idx) => (
                    <option key={p.label} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Destination Search Pill */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C4D2B]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="B • Destination (Library, Labs, ATM, Mosque...)"
              className="w-full rounded-full border border-[#DFCBB4] bg-[#FFFFFF] py-2.5 pl-10 pr-8 text-xs text-[#1F1812] placeholder-[#7D7166] shadow-[0_2px_8px_-2px_rgba(74,44,21,0.08)] outline-none focus:border-[#7C4D2B] focus:ring-2 focus:ring-[#F6ECE0] transition"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7166] hover:text-[#1F1812] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {FILTER_TABS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  className={`nutty-chip shrink-0 rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold cursor-pointer ${
                    active
                      ? 'border-[#7C4D2B] bg-[#7C4D2B] text-[#FAF7F2]'
                      : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F6ECE0] hover:text-[#1F1812]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Boundary / Live Location Status Strip */}
          {gpsError && gpsMode === 'LIVE' ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#F2B8B5] bg-[#FCE8E6] px-3 py-2 text-[11px] font-semibold text-[#B3261E]">
              <span className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{gpsError}</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectPreset(0)}
                className="shrink-0 text-[#0B57D0] underline cursor-pointer ml-1"
              >
                Use Preset
              </button>
            </div>
          ) : isAcquiringGps ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[#D3E3FD] bg-[#E8F0FE] px-3 py-2 text-[11px] font-semibold text-[#0B57D0]">
              <LocateFixed className="h-3.5 w-3.5 shrink-0 animate-pulse" />
              <span className="truncate">Acquiring your live GPS location...</span>
            </div>
          ) : boundaryStatus?.isInside === false ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[#F2B8B5] bg-[#FCE8E6] px-3 py-2 text-[11px] font-semibold text-[#B3261E]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Outside campus • {formatDistance(boundaryStatus.distanceMeters)} away</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-[#CBE6D3] bg-[#E6F4EA] px-3 py-2 text-[11px] font-semibold text-[#137333]">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {gpsMode === 'LIVE' ? 'Live GPS active' : 'Demo origin active'} •{' '}
                {filteredDirectoryPins.length} pins
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {focusedPin ? (
            <>
              {/* Pin Info Card */}
              <div className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      <span className="rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[#0B57D0]">
                        {BUILDINGS[focusedPin.building].shortName}
                      </span>
                      <span className="rounded-full bg-[#E6F4EA] px-2.5 py-0.5 text-[#137333]">
                        {focusedPin.floor === 'OUTDOOR'
                          ? 'Grounds'
                          : FLOORS[focusedPin.floor].code}{' '}
                        • {focusedPin.roomNumber}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-base font-bold text-[#111827]">
                      {focusedPin.name}
                    </h2>
                    <p className="text-xs text-[#5F6368]">{focusedPin.subTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFocusedPin(null)}
                    aria-label="Back to pin directory"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Essential Info Rows */}
                <div className="grid grid-cols-1 gap-1.5 border-t border-[#E2E8F0] pt-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#111827]">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#0B57D0]" />
                    <span className="truncate font-medium">{focusedPin.inCharge}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5F6368]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[#0B57D0]" />
                    <span className="truncate">{focusedPin.timings}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#5F6368]">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#0B57D0]" />
                    <span className="truncate">{focusedPin.contact}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[#444746]">{focusedPin.description}</p>

                <div className="rounded-2xl bg-[#EFF3F8] p-3 text-xs">
                  <div className="font-display text-[11px] font-bold text-[#0B57D0]">
                    Indoor Walk Guide
                  </div>
                  <p className="mt-0.5 text-[#111827]">{focusedPin.indoorGuide}</p>
                </div>

                {/* Action Pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomOriginPinId(focusedPin.id);
                      setActiveStepIndex(0);
                    }}
                    className="nutty-btn flex items-center gap-1.5 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-3.5 py-1.5 font-display text-[11px] font-semibold text-[#137333] hover:bg-[#D7EFE0] cursor-pointer"
                  >
                    <Navigation className="h-3 w-3" />
                    Set Start
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPinDetail(focusedPin)}
                    className="nutty-btn-primary flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-3.5 py-1.5 font-display text-[11px] font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
                  >
                    <Info className="h-3 w-3" />
                    Full Info
                  </button>
                  {(focusedPin.id === 'campus_transport_office' ||
                    focusedPin.id === 'campus_transport') && (
                    <button
                      type="button"
                      onClick={onOpenBusTimings}
                      className="nutty-btn flex items-center gap-1.5 rounded-full bg-[#0F9D58] px-3.5 py-1.5 font-display text-[11px] font-semibold text-white hover:bg-[#0B8043] cursor-pointer"
                    >
                      <Bus className="h-3 w-3" />
                      Bus Timings
                    </button>
                  )}
                </div>
              </div>

              {/* Google Maps Style Turn-by-Turn Tutorial */}
              {activeRoute ? (
                <div className="rounded-3xl border border-[#DCE2EC] bg-[#F8FAFC] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B57D0] text-white">
                        <RouteIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-display text-xs font-bold text-[#111827]">
                          Shortest Route Directions
                        </div>
                        <div className="font-mono text-[11px] font-semibold text-[#137333]">
                          {formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                          {activeRoute.estimatedMinutes} min walk • {activeRoute.steps.length} steps
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fitRouteBounds(activeRoute, focusedPin)}
                      className="rounded-full bg-[#FFFFFF] border border-[#DCE2EC] px-2.5 py-1 text-[10.5px] font-semibold text-[#0B57D0] hover:bg-[#E8F0FE] cursor-pointer"
                    >
                      Fit Path
                    </button>
                  </div>

                  {isFetchingExternalRoute && (
                    <div className="text-[11px] text-[#5F6368]">
                      Snapping turns to updated campus streets...
                    </div>
                  )}

                  {/* Active Tutorial Step Banner */}
                  {currentTutorialStep && (
                    <div className="rounded-2xl bg-[#D3E3FD] p-3 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#041E49]">
                        <span>
                          Step {activeStepIndex + 1} of {activeRoute.steps.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={activeStepIndex <= 0}
                            onClick={() => {
                              const prev = Math.max(0, activeStepIndex - 1);
                              focusStepOnMap(activeRoute.steps[prev], prev);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFFFF] text-[#041E49] disabled:opacity-40 cursor-pointer"
                            aria-label="Previous step"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={activeStepIndex >= activeRoute.steps.length - 1}
                            onClick={() => {
                              const next = Math.min(
                                activeRoute.steps.length - 1,
                                activeStepIndex + 1
                              );
                              focusStepOnMap(activeRoute.steps[next], next);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFFFF] text-[#041E49] disabled:opacity-40 cursor-pointer"
                            aria-label="Next step"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B57D0] text-white">
                          <TurnGlyph action={currentTutorialStep.action} className="h-4 w-4" />
                        </div>
                        <div className="text-xs font-semibold text-[#041E49]">
                          {currentTutorialStep.instruction}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Clickable Step List */}
                  <div className="space-y-1.5">
                    {activeRoute.steps.map((step, idx) => {
                      const active = idx === activeStepIndex;
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => focusStepOnMap(step, idx)}
                          className={`flex w-full items-start gap-2.5 rounded-2xl border p-2.5 text-left transition cursor-pointer ${
                            active
                              ? 'border-[#0B57D0] bg-[#E8F0FE]'
                              : 'border-[#E2E8F0] bg-[#FFFFFF] hover:border-[#0B57D0]/50'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                              active
                                ? 'bg-[#0B57D0] text-white'
                                : 'bg-[#EFF3F8] text-[#444746]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827]">
                              <TurnGlyph
                                action={step.action}
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  step.action === 'ARRIVE' ? 'text-[#0F9D58]' : 'text-[#0B57D0]'
                                }`}
                              />
                              <span>{step.instruction}</span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#5F6368]">
                              {step.streetName}
                              {step.distanceMeters > 0
                                ? ` • ${formatDistance(step.distanceMeters)}`
                                : ''}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#DCE2EC] bg-[#F8FAFC] p-4 space-y-2.5">
                  <div className="font-display text-xs font-bold text-[#111827]">
                    {isAcquiringGps
                      ? 'Waiting for your live GPS location...'
                      : 'Location access needed for live directions'}
                  </div>
                  <p className="text-[11px] text-[#5F6368]">
                    Allow location access to trace the shortest path from where you are standing right now, or select a starting landmark above.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onRequestLiveGps}
                      className="rounded-full bg-[#0B57D0] px-3 py-1.5 font-display text-[11px] font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
                    >
                      Enable Live GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPreset(0)}
                      className="rounded-full bg-[#FFFFFF] border border-[#DCE2EC] px-3 py-1.5 font-display text-[11px] font-semibold text-[#111827] hover:bg-[#EFF3F8] cursor-pointer"
                    >
                      Use Start Preset
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#5F6368]">
                <span>Campus Directory ({filteredDirectoryPins.length})</span>
                <span className="text-[#0B57D0]">Tap pin on map or list</span>
              </div>
              {filteredDirectoryPins.map((pin) => {
                const color = CATEGORY_COLORS[pin.category] ?? '#0B57D0';
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => focusPinFromSearch(pin)}
                    className="nutty-card flex w-full items-center gap-3 rounded-2xl border border-[#E6DDD0] bg-[#FAF7F2] p-3 text-left transition hover:border-[#A66B3F] hover:bg-[#FFFFFF] hover:-translate-y-0.5 cursor-pointer"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-xs"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-xs font-bold text-[#1F1812]">
                        {pin.name}
                      </div>
                      <div className="truncate font-mono text-[10.5px] text-[#7D7166]">
                        {BUILDINGS[pin.building].shortName} • {pin.roomNumber}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#7C4D2B]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* =================================================================== */}
      {/* MAIN MAP VIEWPORT (Mobile + Desktop Right Column)                   */}
      {/* =================================================================== */}
      <div className="relative flex-1 h-full min-h-0 w-full overflow-hidden">
        <div ref={mapContainerRef} className="relative z-0 isolate h-full w-full" />

        {/* MOBILE TOP COMPACT SEARCH BAR (< lg) */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-40 flex flex-col gap-2 lg:hidden">
          <div className="pointer-events-auto rounded-3xl border border-[#DFCBB4] bg-[#FFFFFF]/96 backdrop-blur-md p-2.5 shadow-[0_10px_26px_-6px_rgba(62,39,20,0.2)] space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7C4D2B]" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    if (e.target.value.trim()) setShowMobileDirectory(false);
                  }}
                  placeholder="Search Library, Labs, ATM, Mosque..."
                  className="w-full rounded-full border border-[#E6DDD0] bg-[#FAF7F2] py-2 pl-9 pr-8 text-xs text-[#1F1812] placeholder-[#7D7166] outline-none focus:border-[#7C4D2B] focus:ring-2 focus:ring-[#F6ECE0]"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D7166]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMobileDirectory((v) => !v)}
                className={`nutty-btn shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-2 text-[11px] font-semibold cursor-pointer ${
                  showMobileDirectory
                    ? 'border-[#7C4D2B] bg-[#7C4D2B] text-[#FAF7F2]'
                    : 'border-[#DFCBB4] bg-[#F6ECE0] text-[#7C4D2B]'
                }`}
              >
                <MapPin className="h-3 w-3" />
                <span>Pins ({filteredDirectoryPins.length})</span>
              </button>
              <button
                type="button"
                onClick={onRequestLiveGps}
                className={`nutty-btn shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-2 text-[11px] font-semibold cursor-pointer ${
                  gpsMode === 'LIVE'
                    ? 'border-[#CBE6D3] bg-[#E6F4EA] text-[#137333]'
                    : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147]'
                }`}
              >
                <Radio className="h-3 w-3" />
                <span>GPS</span>
              </button>
            </div>

            {/* Compact Start-From Picker */}
            <div className="flex items-center gap-2 px-1">
              <span className="shrink-0 text-[10.5px] font-bold text-[#0F9D58]">
                From:
              </span>
              <select
                aria-label="Starting campus location"
                value={customOriginPinId}
                onChange={(e) => {
                  setCustomOriginPinId(e.target.value);
                  setActiveStepIndex(0);
                }}
                className="min-w-0 flex-1 rounded-full border border-[#E6DDD0] bg-[#FAF7F2] px-3 py-1 text-[11px] font-medium text-[#1F1812] outline-none"
              >
                <option value="AUTO_GPS">
                  {gpsMode === 'LIVE'
                    ? 'Live GPS Signal'
                    : `Preset: ${presets[presetIndex]?.label ?? 'Main Gates'}`}
                </option>
                {CAMPUS_PINS.map((pin) => (
                  <option key={pin.id} value={pin.id}>
                    {pin.mapLabel || pin.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Horizontal Category Filter Pills */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto py-0.5">
            {FILTER_TABS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  className={`nutty-chip shrink-0 rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold cursor-pointer ${
                    active
                      ? 'border-[#7C4D2B] bg-[#7C4D2B] text-[#FAF7F2]'
                      : 'border-[#DFCBB4] bg-[#FFFFFF]/96 text-[#5C5147] hover:bg-[#F6ECE0]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Quick Search Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="pointer-events-auto max-h-48 overflow-y-auto rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-xl">
              {searchSuggestions.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => focusPinFromSearch(pin)}
                  className="flex w-full items-center gap-2.5 border-b border-[#F1F5F9] px-4 py-2.5 text-left hover:bg-[#EFF3F8] last:border-b-0 cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0B57D0]" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-xs font-bold text-[#111827]">
                      {pin.mapLabel || pin.name}
                    </div>
                    <div className="truncate text-[10.5px] text-[#5F6368]">
                      {pin.name} • {BUILDINGS[pin.building].shortName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mobile Quick Pins List Drawer */}
          {showMobileDirectory && searchSuggestions.length === 0 && (
            <div className="pointer-events-auto max-h-[36dvh] overflow-y-auto rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] p-2 shadow-xl">
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-[#5F6368]">
                <span>Campus Pins ({filteredDirectoryPins.length})</span>
                <button
                  type="button"
                  onClick={() => setShowMobileDirectory(false)}
                  className="text-[#0B57D0] font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
              {filteredDirectoryPins.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-[#5F6368]">
                  No pins match this filter.
                </div>
              ) : (
                filteredDirectoryPins.map((pin) => {
                  const color = CATEGORY_COLORS[pin.category] ?? '#0B57D0';
                  return (
                    <button
                      key={pin.id}
                      type="button"
                      onClick={() => focusPinFromSearch(pin)}
                      className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left hover:bg-[#EFF3F8] cursor-pointer"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border-2 border-white shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-display text-xs font-bold text-[#111827]">
                          {pin.name}
                        </div>
                        <div className="truncate text-[10.5px] text-[#5F6368]">
                          {BUILDINGS[pin.building].shortName} • {pin.roomNumber}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#747775]" />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Outside Campus Toast Notice */}
        {outsideNotice && (
          <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-full border border-[#F2B8B5] bg-[#FFFFFF] px-4 py-2 text-xs font-semibold text-[#B3261E] shadow-lg">
            GPS outside BBS-UTECH perimeter — map centered on campus.
          </div>
        )}

        {/* Right-Edge Floating Map Controls (Zoom +/- always visible & unobstructed) */}
        <div className="absolute right-3 top-[148px] sm:top-[152px] lg:top-4 z-30 flex flex-col items-center gap-2">
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#DFCBB4] bg-[#FFFFFF]/98 shadow-[0_8px_22px_-4px_rgba(62,39,20,0.22)] divide-y divide-[#E6DDD0]">
            <button
              type="button"
              title="Zoom In"
              aria-label="Zoom In"
              onClick={() => mapRef.current?.zoomIn()}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-[#1F1812] transition hover:bg-[#F6ECE0] hover:text-[#7C4D2B] active:bg-[#EAE1D4] active:scale-95 cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Zoom Out"
              aria-label="Zoom Out"
              onClick={() => mapRef.current?.zoomOut()}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-[#1F1812] transition hover:bg-[#F6ECE0] hover:text-[#7C4D2B] active:bg-[#EAE1D4] active:scale-95 cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>

          <MapCircleBtn
            title={isSatellite ? 'Switch to Updated Street Map' : 'Switch to Satellite + Street Hybrid'}
            active={isSatellite}
            onClick={() => setIsSatellite((s) => !s)}
          >
            {isSatellite ? <Layers className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          </MapCircleBtn>

          <MapCircleBtn
            title="Recenter on My GPS"
            active={gpsMode === 'LIVE'}
            onClick={handleRecenterUser}
          >
            <LocateFixed className="h-4 w-4" />
          </MapCircleBtn>

          <MapCircleBtn
            title="Fit All Campus Pins"
            primary
            onClick={fitAllCampusPins}
          >
            <Crosshair className="h-4 w-4" />
          </MapCircleBtn>
        </div>

        {/* Desktop Map Top-Left Floating Route Pill */}
        {focusedPin && activeRoute && (
          <div className="hidden lg:flex items-center gap-2.5 absolute top-3.5 left-3.5 z-30 rounded-full border border-[#DFCBB4] bg-[#FFFFFF]/96 backdrop-blur-md px-4 py-2 shadow-[0_8px_22px_-4px_rgba(62,39,20,0.2)]">
            <Footprints className="h-4 w-4 text-[#0B57D0]" />
            <div className="text-xs font-semibold text-[#1F1812]">
              <span className="text-[#0F9D58]">{effectiveOrigin?.label}</span>
              <span className="mx-1.5 text-[#7D7166]">→</span>
              <span>{focusedPin.mapLabel || focusedPin.name}</span>
              <span className="ml-2 font-mono text-[11px] text-[#0B57D0]">
                ({formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                {activeRoute.estimatedMinutes} min)
              </span>
            </div>
          </div>
        )}

        <div className="hidden lg:flex absolute bottom-3.5 left-3.5 z-30 items-center gap-3.5 rounded-full border border-[#DFCBB4] bg-[#FFFFFF]/96 px-4 py-1.5 text-[11px] font-semibold text-[#5C5147] shadow-[0_6px_18px_-4px_rgba(62,39,20,0.18)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B3261E]" /> Old Complex
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0F9D58]" /> New Complex
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0B57D0]" /> Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7C4D2B]" /> Shared Cluster
          </span>
          <span className="border-l border-[#E6DDD0] pl-3 text-[#7C4D2B]">
            {mapZoom >= LABEL_ZOOM_THRESHOLD ? 'Labels visible' : 'Zoom in for names'}
          </span>
        </div>

        {/* =================================================================== */}
        {/* MOBILE BOTTOM PIXEL SHEET (Pin Info + Turn-by-Turn Tutorial)        */}
        {/* =================================================================== */}
        {focusedPin ? (
          <div className="lg:hidden absolute bottom-2.5 left-2.5 right-2.5 z-30 rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF]/97 backdrop-blur-md shadow-2xl">
            <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-[#CBD5E1]" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#F1F5F9] px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold">
                  <span className="rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[#0B57D0]">
                    {BUILDINGS[focusedPin.building].shortName} • {focusedPin.roomNumber}
                  </span>
                  {activeRoute && (
                    <span className="text-[#137333] font-mono">
                      {formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                      {activeRoute.estimatedMinutes} min
                    </span>
                  )}
                </div>
                <h3 className="mt-1 truncate font-display text-sm font-bold text-[#111827]">
                  {focusedPin.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                  aria-label={mobileSheetExpanded ? 'Collapse sheet' : 'Expand sheet'}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3F8] text-[#111827]"
                >
                  {mobileSheetExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFocusedPin(null)}
                  aria-label="Close landmark card"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF3F8] text-[#5F6368]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {mobileSheetExpanded && (
              <div className="p-3.5 space-y-2.5 max-h-[34dvh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-1.5 rounded-full bg-[#EFF3F8] p-1">
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab('DIRECTIONS')}
                    className={`rounded-full py-1.5 font-display text-[11px] font-semibold ${
                      mobileSheetTab === 'DIRECTIONS'
                        ? 'bg-[#FFFFFF] text-[#0B57D0] shadow-xs'
                        : 'text-[#5F6368]'
                    }`}
                  >
                    Directions ({activeRoute?.steps.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab('INFO')}
                    className={`rounded-full py-1.5 font-display text-[11px] font-semibold ${
                      mobileSheetTab === 'INFO'
                        ? 'bg-[#FFFFFF] text-[#0B57D0] shadow-xs'
                        : 'text-[#5F6368]'
                    }`}
                  >
                    Location Info
                  </button>
                </div>

                {mobileSheetTab === 'DIRECTIONS' && activeRoute ? (
                  <div className="space-y-2">
                    {currentTutorialStep && (
                      <div className="flex items-center gap-2.5 rounded-2xl bg-[#D3E3FD] p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B57D0] text-white">
                          <TurnGlyph action={currentTutorialStep.action} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-[#0B57D0]">
                            Step {activeStepIndex + 1}/{activeRoute.steps.length}
                          </div>
                          <div className="text-xs font-semibold text-[#041E49]">
                            {currentTutorialStep.instruction}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={activeStepIndex <= 0}
                            onClick={() => {
                              const prev = Math.max(0, activeStepIndex - 1);
                              focusStepOnMap(activeRoute.steps[prev], prev);
                            }}
                            aria-label="Previous direction step"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFFFF] text-[#041E49] disabled:opacity-35"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={activeStepIndex >= activeRoute.steps.length - 1}
                            onClick={() => {
                              const next = Math.min(
                                activeRoute.steps.length - 1,
                                activeStepIndex + 1
                              );
                              focusStepOnMap(activeRoute.steps[next], next);
                            }}
                            aria-label="Next direction step"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFFFF] text-[#041E49] disabled:opacity-35"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      {activeRoute.steps.map((step, idx) => (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => focusStepOnMap(step, idx)}
                          className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs ${
                            idx === activeStepIndex
                              ? 'border-[#0B57D0] bg-[#E8F0FE] text-[#111827] font-semibold'
                              : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#444746]'
                          }`}
                        >
                          <span className="font-mono text-[10.5px] font-bold text-[#0B57D0]">
                            {idx + 1}.
                          </span>
                          <TurnGlyph action={step.action} className="h-3.5 w-3.5 shrink-0" />
                          <span className="flex-1">{step.instruction}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : mobileSheetTab === 'DIRECTIONS' ? (
                  <div className="rounded-2xl bg-[#EFF3F8] p-3 text-xs space-y-2">
                    <div className="font-bold text-[#111827]">
                      {isAcquiringGps
                        ? 'Acquiring live GPS location...'
                        : 'Enable GPS to route from your location'}
                    </div>
                    <p className="text-[#5F6368]">
                      Turn on location access or select a start point in the top bar.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onRequestLiveGps}
                        className="rounded-full bg-[#0B57D0] px-3 py-1.5 font-display text-[11px] font-semibold text-white"
                      >
                        Enable GPS
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPreset(0)}
                        className="rounded-full bg-[#FFFFFF] border border-[#DCE2EC] px-3 py-1.5 font-display text-[11px] font-semibold text-[#111827]"
                      >
                        Use Preset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <p className="text-[#444746]">
                      <strong className="text-[#111827]">In-Charge:</strong> {focusedPin.inCharge} •{' '}
                      {focusedPin.timings}
                    </p>
                    <p className="text-[#5F6368]">{focusedPin.description}</p>
                    <div className="rounded-2xl bg-[#EFF3F8] p-2.5 text-xs">
                      <span className="font-bold text-[#0B57D0]">Indoor: </span>
                      <span className="text-[#111827]">{focusedPin.indoorGuide}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenPinDetail(focusedPin)}
                    className="nutty-btn-primary flex flex-1 items-center justify-center gap-1 rounded-full bg-[#0B57D0] px-3 py-2 font-display text-xs font-semibold text-white cursor-pointer"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Details
                  </button>
                  {(focusedPin.id === 'campus_transport_office' ||
                    focusedPin.id === 'campus_transport') && (
                    <button
                      type="button"
                      onClick={onOpenBusTimings}
                      className="nutty-btn flex flex-1 items-center justify-center gap-1 rounded-full bg-[#0F9D58] px-3 py-2 font-display text-xs font-semibold text-white cursor-pointer"
                    >
                      <Bus className="h-3.5 w-3.5" />
                      Buses
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 rounded-full border border-[#DFCBB4] bg-[#FFFFFF]/96 px-3.5 py-1.5 text-[10.5px] font-semibold text-[#5C5147] shadow-[0_6px_18px_-4px_rgba(62,39,20,0.2)] whitespace-nowrap">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#B3261E]" /> Old
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#0F9D58]" /> New
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#7C4D2B]" /> Cluster
            </span>
            <span className="text-[#7C4D2B]">
              {mapZoom >= LABEL_ZOOM_THRESHOLD ? 'Tap any pin' : 'Zoom in for labels'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MapCircleBtn({
  title,
  active,
  primary,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  primary?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`nutty-btn flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border cursor-pointer ${
        active
          ? 'border-[#0B57D0] bg-[#0B57D0] text-white'
          : primary
          ? 'border-[#DFCBB4] bg-[#F6ECE0] text-[#7C4D2B] hover:bg-[#EDE0CE]'
          : 'border-[#DFCBB4] bg-[#FFFFFF]/96 text-[#1F1812] hover:bg-[#FAF7F2] hover:text-[#7C4D2B]'
      }`}
    >
      {children}
    </button>
  );
}

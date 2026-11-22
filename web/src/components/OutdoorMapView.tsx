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

type MapFilterTab = 'ALL' | 'OFFICES' | 'LABS_WORKSHOPS' | 'TRANSPORT' | 'AMENITIES';
type MobileSheetTab = 'DIRECTIONS' | 'INFO';

const FILTER_TABS: { key: MapFilterTab; label: string }[] = [
  { key: 'ALL', label: 'ALL PINS' },
  { key: 'OFFICES', label: 'VC & OFFICES' },
  { key: 'LABS_WORKSHOPS', label: 'LABS & SHOPS' },
  { key: 'TRANSPORT', label: 'POINT & BUSES' },
  { key: 'AMENITIES', label: 'LIBRARY & FOOD' },
];

interface OutdoorMapViewProps {
  userLocation: UserLocation | null;
  gpsMode: GpsMode;
  presetIndex: number;
  presets: UserLocation[];
  gpsError: string | null;
  navTargetPin: CampusPin | null;
  onClearNavTarget: () => void;
  onRequestLiveGps: () => void;
  onSelectPreset: (idx: number) => void;
  onOpenPinDetail: (pin: CampusPin) => void;
  onOpenIndoorPlan: (pin: CampusPin) => void;
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
  } else if (filter === 'LABS_WORKSHOPS') {
    if (pin.category !== 'LAB') return false;
  } else if (filter === 'TRANSPORT') {
    if (pin.category !== 'TRANSPORT_GATE') return false;
  } else if (filter === 'AMENITIES') {
    if (pin.category !== 'AMENITY' && pin.category !== 'LIBRARY') return false;
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

export function OutdoorMapView({
  userLocation,
  gpsMode,
  presetIndex,
  presets,
  gpsError,
  navTargetPin,
  onClearNavTarget,
  onRequestLiveGps,
  onSelectPreset,
  onOpenPinDetail,
  onOpenIndoorPlan,
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

  const [isSatellite, setIsSatellite] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<MapFilterTab>('ALL');
  const [searchText, setSearchText] = useState('');
  const [focusedPin, setFocusedPin] = useState<CampusPin | null>(null);
  const [customOriginPinId, setCustomOriginPinId] = useState<string>('AUTO_GPS');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [mobileSheetTab, setMobileSheetTab] = useState<MobileSheetTab>('DIRECTIONS');
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState<boolean>(true);
  const [externalRoute, setExternalRoute] = useState<ComputedRoute | null>(null);
  const [isFetchingExternalRoute, setIsFetchingExternalRoute] = useState(false);

  const [osmBoundary, setOsmBoundary] = useState<LatLng[] | null>(null);
  const [osmBuildings, setOsmBuildings] = useState<
    { coords: LatLng[]; centerLat: number; centerLng: number }[]
  >([]);
  const [osmRoads, setOsmRoads] = useState<LatLng[][]>([]);
  const [outsideNotice, setOutsideNotice] = useState(false);

  // Resolve effective starting coordinates (either GPS/Preset OR user-chosen campus landmark)
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
          label: userLocation.label || 'Your Location',
          isPinOrigin: false,
        };
      }
      return {
        coord: { lat: BBSUTSD_CENTER.lat, lng: BBSUTSD_CENTER.lng },
        label: 'Campus Center',
        isPinOrigin: false,
      };
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

  // Compute walkable multi-segment campus route with turn-by-turn steps
  const localCampusRoute = useMemo<ComputedRoute | null>(() => {
    if (!focusedPin || !effectiveOrigin) return null;
    return computeCampusRoute(effectiveOrigin.coord, effectiveOrigin.label, focusedPin);
  }, [focusedPin, effectiveOrigin]);

  // When user uses live GPS outside campus perimeter (>450m), enrich with OSRM road route
  useEffect(() => {
    setExternalRoute(null);
    setActiveStepIndex(0);
    if (!focusedPin || !effectiveOrigin || effectiveOrigin.isPinOrigin) {
      setIsFetchingExternalRoute(false);
      return;
    }
    const distFromCampus = calculateDistanceMeters(
      effectiveOrigin.coord.lat,
      effectiveOrigin.coord.lng,
      BBSUTSD_CENTER.lat,
      BBSUTSD_CENTER.lng
    );
    if (distFromCampus <= 450 || distFromCampus > 50000) {
      setIsFetchingExternalRoute(false);
      return;
    }

    let cancelled = false;
    setIsFetchingExternalRoute(true);
    fetchOsrmRoadRoute(effectiveOrigin.coord, focusedPin)
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
  }, [focusedPin, effectiveOrigin]);

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

  const handleSelectPin = useCallback((pin: CampusPin) => {
    setFocusedPin(pin);
    setActiveStepIndex(0);
    setMobileSheetExpanded(true);
    const map = mapRef.current;
    if (map) {
      map.panTo([pin.latitude, pin.longitude], { animate: true });
    }
  }, []);

  // Stable ref so Leaflet DOM handlers never read stale callbacks
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
      map.fitBounds(bounds, { padding: [64, 64], maxZoom: 19, animate: true });
    } else {
      map.setView([step.coord.lat, step.coord.lng], 19, { animate: true });
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
      maxZoom: 19,
      maxBounds: bounds.pad(0.25),
      maxBoundsViscosity: 0.75,
      zoomControl: false,
      attributionControl: false,
    });

    const sat = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    });

    sat.addTo(map);

    const geoGroup = L.layerGroup().addTo(map);
    const guideGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);

    map.on('click', () => {
      setFocusedPin(null);
    });

    mapRef.current = map;
    satLayerRef.current = sat;
    streetLayerRef.current = street;
    geometryLayerGroupRef.current = geoGroup;
    guideLayerGroupRef.current = guideGroup;
    markersLayerGroupRef.current = markersGroup;
    userLayerGroupRef.current = userGroup;

    // Keep Leaflet viewport synced on responsive resizes & tab transitions
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);
    const initTimer = window.setTimeout(() => map.invalidateSize({ animate: false }), 120);

    // Fetch up-to-date OpenStreetMap campus buildings & roads
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
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('OSM failed'))))
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
                ) <= 340
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

  // 2. Toggle Satellite vs Street Layer
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
          color: '#39FF14',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '8, 6',
          fillColor: '#39FF14',
          fillOpacity: 0.05,
          interactive: false,
        }
      ).addTo(group);
    } else {
      L.circle([BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng], {
        radius: CAMPUS_RADIUS_M,
        color: '#39FF14',
        weight: 2.5,
        opacity: 0.85,
        dashArray: '8, 6',
        fillColor: '#39FF14',
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(group);
    }

    L.polygon(
      OLD_COMPLEX_ZONE.map((p) => [p.lat, p.lng]),
      {
        color: '#FF1E2D',
        weight: 2,
        opacity: 0.92,
        dashArray: '6, 5',
        fillColor: '#FF1E2D',
        fillOpacity: 0.16,
        interactive: false,
      }
    ).addTo(group);

    L.polygon(
      NEW_COMPLEX_ZONE.map((p) => [p.lat, p.lng]),
      {
        color: '#39FF14',
        weight: 2,
        opacity: 0.92,
        dashArray: '6, 5',
        fillColor: '#39FF14',
        fillOpacity: 0.14,
        interactive: false,
      }
    ).addTo(group);

    osmBuildings.forEach((bld) => {
      const isOld = bld.centerLat >= 27.51085 || bld.centerLng < 68.74162;
      const color = isOld ? '#FF1E2D' : '#39FF14';
      L.polygon(
        bld.coords.map((p) => [p.lat, p.lng]),
        {
          color,
          weight: 2,
          opacity: 0.92,
          fillColor: color,
          fillOpacity: 0.28,
          interactive: false,
        }
      ).addTo(group);
    });

    L.polyline(
      DIVIDING_ROAD_PATH.map((p) => [p.lat, p.lng]),
      {
        color: '#050507',
        weight: 8,
        opacity: 0.78,
        interactive: false,
      }
    ).addTo(group);

    L.polyline(
      DIVIDING_ROAD_PATH.map((p) => [p.lat, p.lng]),
      {
        color: '#F8FAFC',
        weight: 4,
        opacity: 0.95,
        dashArray: '10, 6',
        interactive: false,
      }
    ).addTo(group);

    osmRoads.forEach((segment) => {
      L.polyline(
        segment.map((p) => [p.lat, p.lng]),
        {
          color: '#F8FAFC',
          weight: 3,
          opacity: 0.78,
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
  }, [osmBoundary, osmBuildings, osmRoads]);

  // 4. Render Labeled Campus Pins with bullet-proof DOM click handling
  useEffect(() => {
    const group = markersLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    const visiblePins = CAMPUS_PINS.filter((p) =>
      matchesFilter(p, selectedFilter, searchText)
    );

    visiblePins.forEach((pin) => {
      const color = CATEGORY_COLORS[pin.category] ?? '#FF1E2D';
      const isSelected = focusedPin?.id === pin.id;
      const isOrigin = customOriginPinId === pin.id;
      const html = `<div class="campus-pin${isSelected ? ' is-selected' : ''}" role="button" tabindex="0" aria-label="${escapeHtml(pin.name)}" style="--pin-color:${color}">
        <div class="campus-pin-label">${isOrigin ? 'START: ' : ''}${escapeHtml(pin.mapLabel || pin.name)}</div>
        <div class="campus-pin-dot"></div>
      </div>`;

      const icon = L.divIcon({
        className: 'campus-leaflet-icon',
        html,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([pin.latitude, pin.longitude], {
        icon,
        interactive: false,
        zIndexOffset: isSelected ? 900 : isOrigin ? 800 : 200,
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
    });
  }, [selectedFilter, searchText, focusedPin, customOriginPinId]);

  // 5. Render Live / Simulated User GPS Marker
  useEffect(() => {
    const group = userLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!userLocation) return;

    const acc = Math.min(Math.max(userLocation.accuracyMeters ?? 15, 5), 120);
    L.circle([userLocation.latitude, userLocation.longitude], {
      radius: acc,
      color: '#39FF14',
      weight: 1,
      opacity: 0.55,
      fillColor: '#39FF14',
      fillOpacity: 0.16,
      interactive: false,
    }).addTo(group);

    const gpsIcon = L.divIcon({
      className: '',
      html: '<div class="gps-dot-wrapper"><div class="gps-dot-pulse"></div><div class="gps-dot-core"></div></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    L.marker([userLocation.latitude, userLocation.longitude], {
      icon: gpsIcon,
      interactive: false,
      zIndexOffset: 999,
    }).addTo(group);
  }, [userLocation]);

  // 6. Render Multi-Segment Turn-by-Turn Path, Corner Badges, & Active Step Highlight
  useEffect(() => {
    const group = guideLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!focusedPin || !activeRoute || activeRoute.polyline.length < 2) return;

    const latLngs: [number, number][] = activeRoute.polyline.map((p) => [p.lat, p.lng]);

    // Dark outer casing for crisp satellite readability
    L.polyline(latLngs, {
      color: '#050507',
      weight: 8,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    }).addTo(group);

    // Neon Green main walkable path
    L.polyline(latLngs, {
      color: '#39FF14',
      weight: 4.5,
      opacity: 0.96,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    }).addTo(group);

    // Highlight currently selected tutorial segment in Sports Red
    const currentStep = activeRoute.steps[activeStepIndex];
    if (currentStep && currentStep.segmentCoords.length >= 2) {
      L.polyline(
        currentStep.segmentCoords.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#FF1E2D',
          weight: 6.5,
          opacity: 0.98,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: false,
        }
      ).addTo(group);
    }

    // Origin badge if starting from a custom landmark pin
    if (effectiveOrigin?.isPinOrigin) {
      const originIcon = L.divIcon({
        className: 'campus-leaflet-icon',
        html: `<div class="route-origin-badge">START • ${escapeHtml(effectiveOrigin.label)}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker([effectiveOrigin.coord.lat, effectiveOrigin.coord.lng], {
        icon: originIcon,
        interactive: false,
        zIndexOffset: 940,
      }).addTo(group);
    }

    // Numbered turn-point corner nodes
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
    handleSelectPin(pin);
    const route = effectiveOrigin
      ? computeCampusRoute(effectiveOrigin.coord, effectiveOrigin.label, pin)
      : null;
    fitRouteBounds(route, pin);
  };

  const currentTutorialStep = activeRoute?.steps[activeStepIndex] ?? null;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[400px_1fr] xl:grid-cols-[420px_1fr] h-[calc(100dvh-128px)] lg:h-[calc(100dvh-92px)] min-h-[560px] w-full overflow-hidden border border-[#282C38] bg-[#050507] cut-corner">
      {/* =================================================================== */}
      {/* DESKTOP LEFT TACTICAL DRAWER (Hidden < lg so mobile stays clean)    */}
      {/* =================================================================== */}
      <aside className="hidden lg:flex flex-col h-full overflow-hidden border-r border-[#282C38] bg-[#0D0E12]">
        {/* Header & Search */}
        <div className="border-b border-[#282C38] p-4 space-y-3 bg-[#050507]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-base font-bold tracking-wider text-[#F8FAFC]">
                BBSUTSD // NAVIGATOR
              </h1>
              <p className="font-mono text-[10px] font-bold text-[#FF1E2D]">
                27.5108° N • 68.7416° E • KHAIRPUR MIRS
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestLiveGps}
              className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] font-bold cursor-pointer transition ${
                gpsMode === 'LIVE'
                  ? 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                  : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#39FF14] hover:text-[#39FF14]'
              }`}
            >
              <Radio className="h-3 w-3" />
              <span>{gpsMode === 'LIVE' ? 'LIVE GPS' : 'USE LIVE GPS'}</span>
            </button>
          </div>

          {/* Start From (Origin) Selector */}
          <div className="border border-[#282C38] bg-[#15171E] p-2.5 cut-corner-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="desktop-origin-select"
                className="font-mono text-[10px] font-bold text-[#39FF14]"
              >
                A // START LOCATION
              </label>
              {customOriginPinId !== 'AUTO_GPS' && (
                <button
                  type="button"
                  onClick={() => setCustomOriginPinId('AUTO_GPS')}
                  className="flex items-center gap-1 font-mono text-[10px] text-[#A1A7B3] hover:text-[#39FF14] cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  RESET GPS
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
              className="w-full border border-[#282C38] bg-[#050507] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#F8FAFC] outline-none focus:border-[#39FF14]"
            >
              <option value="AUTO_GPS">
                {gpsMode === 'LIVE'
                  ? 'Live Browser GPS Signal'
                  : `GPS Preset: ${presets[presetIndex]?.label ?? 'Main Entrance Gate'}`}
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
                <span className="font-mono text-[9.5px] text-[#A1A7B3]">QUICK TELEPORT:</span>
                <select
                  aria-label="Campus GPS Preset"
                  value={presetIndex}
                  onChange={(e) => onSelectPreset(Number(e.target.value))}
                  className="flex-1 border border-[#282C38] bg-[#050507] px-2 py-1 font-mono text-[10px] text-[#F8FAFC] outline-none focus:border-[#FF1E2D]"
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

          {/* Destination Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF1E2D]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="B // Search destination (VC, Library, CS Lab, Gate)..."
              className="w-full border border-[#282C38] bg-[#15171E] py-2 pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#687080] outline-none focus:border-[#FF1E2D] cut-corner-sm"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A7B3] hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTER_TABS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  className={`shrink-0 border px-2.5 py-1 font-mono text-[10px] font-bold transition cursor-pointer ${
                    active
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Boundary Status Strip */}
          {gpsError && gpsMode === 'LIVE' ? (
            <div className="flex items-center justify-between border border-[#FF1E2D] bg-[#26080D] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC]">
              <span className="flex items-center gap-1.5 truncate">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#FF1E2D]" />
                <span className="truncate">{gpsError}</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectPreset(0)}
                className="shrink-0 text-[#39FF14] underline cursor-pointer ml-2"
              >
                USE PRESET
              </button>
            </div>
          ) : boundaryStatus?.isInside === false ? (
            <div className="flex items-center gap-2 border border-[#FF1E2D]/70 bg-[#26080D] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#FF1E2D]" />
              <span>OUTSIDE CAMPUS • {formatDistance(boundaryStatus.distanceMeters)} AWAY</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 border border-[#39FF14]/50 bg-[#0B2407] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#39FF14]">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                INSIDE CAMPUS • {filteredDirectoryPins.length} PINS ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Drawer Body: Focused Pin Details & Turn-by-Turn OR Directory */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {focusedPin ? (
            <>
              {/* Pin Info Card */}
              <div className="border border-[#FF1E2D] bg-[#15171E] p-3.5 cut-corner-sm space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] font-bold">
                      <span className="border border-[#FF1E2D] bg-[#26080D] px-1.5 py-0.5 text-[#FF1E2D]">
                        {BUILDINGS[focusedPin.building].shortName.toUpperCase()}
                      </span>
                      <span className="border border-[#39FF14]/60 bg-[#0B2407] px-1.5 py-0.5 text-[#39FF14]">
                        {focusedPin.floor === 'OUTDOOR'
                          ? 'GROUNDS'
                          : FLOORS[focusedPin.floor].code}{' '}
                        • {focusedPin.roomNumber}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-base font-bold text-[#F8FAFC]">
                      {focusedPin.name}
                    </h2>
                    <p className="text-xs text-[#A1A7B3]">{focusedPin.subTitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFocusedPin(null)}
                    aria-label="Back to pin directory"
                    className="p-1 text-[#A1A7B3] hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Essential Info Rows */}
                <div className="grid grid-cols-1 gap-1.5 border-t border-[#282C38] pt-2 text-[11px]">
                  <div className="flex items-center gap-2 text-[#F8FAFC]">
                    <User className="h-3.5 w-3.5 shrink-0 text-[#FF1E2D]" />
                    <span className="truncate">{focusedPin.inCharge}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#A1A7B3]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[#FF1E2D]" />
                    <span className="truncate">{focusedPin.timings}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#A1A7B3]">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#FF1E2D]" />
                    <span className="truncate">{focusedPin.contact}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[#A1A7B3]">{focusedPin.description}</p>

                <div className="border border-[#282C38] bg-[#050507] p-2.5 text-[11px]">
                  <div className="font-mono text-[10px] font-bold text-[#39FF14]">
                    INDOOR WALK GUIDE
                  </div>
                  <p className="mt-1 text-[#F8FAFC]/90">{focusedPin.indoorGuide}</p>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomOriginPinId(focusedPin.id);
                      setActiveStepIndex(0);
                    }}
                    className="flex items-center gap-1 border border-[#282C38] bg-[#050507] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#39FF14] hover:border-[#39FF14] cursor-pointer"
                  >
                    <Navigation className="h-3 w-3" />
                    SET AS START
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPinDetail(focusedPin)}
                    className="flex items-center gap-1 bg-[#FF1E2D] px-2.5 py-1.5 font-mono text-[10px] font-bold text-white hover:bg-[#FF3B47] cursor-pointer"
                  >
                    <Info className="h-3 w-3" />
                    FULL INFO
                  </button>
                  {focusedPin.building !== 'CAMPUS_GROUNDS' &&
                    focusedPin.floor !== 'OUTDOOR' && (
                      <button
                        type="button"
                        onClick={() => onOpenIndoorPlan(focusedPin)}
                        className="flex items-center gap-1 border border-[#F8FAFC] bg-[#050507] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC] hover:border-[#39FF14] hover:text-[#39FF14] cursor-pointer"
                      >
                        <Layers className="h-3 w-3 text-[#39FF14]" />
                        FLOOR PLAN
                      </button>
                    )}
                  {(focusedPin.id === 'campus_transport_office' ||
                    focusedPin.id === 'campus_transport') && (
                    <button
                      type="button"
                      onClick={onOpenBusTimings}
                      className="flex items-center gap-1 bg-[#39FF14] px-2.5 py-1.5 font-mono text-[10px] font-bold text-[#050507] hover:brightness-110 cursor-pointer"
                    >
                      <Bus className="h-3 w-3" />
                      POINT BUSES
                    </button>
                  )}
                </div>
              </div>

              {/* Google Maps Style Turn-by-Turn Tutorial */}
              {activeRoute && (
                <div className="border border-[#39FF14]/60 bg-[#050507] p-3.5 cut-corner-sm space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <RouteIcon className="h-4 w-4 text-[#39FF14]" />
                      <div>
                        <div className="font-display text-xs font-bold text-[#F8FAFC]">
                          TURN-BY-TURN ROUTE
                        </div>
                        <div className="font-mono text-[10px] font-bold text-[#39FF14]">
                          {formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                          {activeRoute.estimatedMinutes} MIN WALK • {activeRoute.steps.length} STEPS
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fitRouteBounds(activeRoute, focusedPin)}
                      className="border border-[#282C38] bg-[#15171E] px-2 py-1 font-mono text-[9.5px] font-bold text-[#F8FAFC] hover:border-[#39FF14] cursor-pointer"
                    >
                      FIT PATH
                    </button>
                  </div>

                  {isFetchingExternalRoute && (
                    <div className="font-mono text-[10px] text-[#A1A7B3]">
                      Calculating city street route to campus gate...
                    </div>
                  )}

                  {/* Active Tutorial Step Controls */}
                  {currentTutorialStep && (
                    <div className="border border-[#FF1E2D] bg-[#26080D]/70 p-2.5 space-y-2">
                      <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#FF1E2D]">
                        <span>
                          STEP {activeStepIndex + 1} OF {activeRoute.steps.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={activeStepIndex <= 0}
                            onClick={() => {
                              const prev = Math.max(0, activeStepIndex - 1);
                              focusStepOnMap(activeRoute.steps[prev], prev);
                            }}
                            className="flex h-6 w-6 items-center justify-center border border-[#282C38] bg-[#050507] text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                            aria-label="Previous step"
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
                            className="flex h-6 w-6 items-center justify-center border border-[#282C38] bg-[#050507] text-[#F8FAFC] disabled:opacity-40 cursor-pointer"
                            aria-label="Next step"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[#FF1E2D] text-white">
                          <TurnGlyph action={currentTutorialStep.action} className="h-4 w-4" />
                        </div>
                        <div className="text-xs font-semibold text-[#F8FAFC]">
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
                          className={`flex w-full items-start gap-2.5 border p-2 text-left transition cursor-pointer ${
                            active
                              ? 'border-[#39FF14] bg-[#0B2407]'
                              : 'border-[#282C38] bg-[#15171E] hover:border-[#FF1E2D]'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                              active
                                ? 'bg-[#39FF14] text-[#050507]'
                                : 'bg-[#050507] text-[#A1A7B3] border border-[#282C38]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#F8FAFC]">
                              <TurnGlyph
                                action={step.action}
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  step.action === 'ARRIVE' ? 'text-[#FF1E2D]' : 'text-[#39FF14]'
                                }`}
                              />
                              <span>{step.instruction}</span>
                            </div>
                            <div className="mt-0.5 font-mono text-[10px] text-[#A1A7B3]">
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
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold text-[#A1A7B3]">
                <span>CAMPUS DIRECTORY ({filteredDirectoryPins.length})</span>
                <span className="text-[#39FF14]">TAP PIN ON MAP OR BELOW</span>
              </div>
              {filteredDirectoryPins.map((pin) => {
                const color = CATEGORY_COLORS[pin.category] ?? '#FF1E2D';
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => focusPinFromSearch(pin)}
                    className="flex w-full items-center gap-3 border border-[#282C38] bg-[#15171E] p-2.5 text-left transition hover:border-[#39FF14] cursor-pointer cut-corner-sm"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-[#050507]"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-xs font-bold text-[#F8FAFC]">
                        {pin.name}
                      </div>
                      <div className="truncate font-mono text-[10px] text-[#A1A7B3]">
                        {BUILDINGS[pin.building].shortName} • {pin.roomNumber}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#687080]" />
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
      <div className="relative flex-1 h-full min-h-[420px] w-full overflow-hidden">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* MOBILE TOP COMPACT BAR (< lg only — unobtrusive so map stays tappable) */}
        <div className="pointer-events-none absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-col gap-1.5 lg:hidden">
          <div className="pointer-events-auto border border-[#282C38] bg-[#050507]/92 backdrop-blur-md p-2.5 shadow-xl cut-corner-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#FF1E2D]" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search BBSUTSD pin, lab, office..."
                  className="w-full border border-[#282C38] bg-[#15171E] py-1.5 pl-8 pr-7 text-xs text-[#F8FAFC] placeholder-[#687080] outline-none focus:border-[#FF1E2D]"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1A7B3]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onRequestLiveGps}
                className={`shrink-0 flex items-center gap-1 border px-2 py-1.5 font-mono text-[10px] font-bold ${
                  gpsMode === 'LIVE'
                    ? 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                    : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
                }`}
              >
                <Radio className="h-3 w-3" />
                <span>GPS</span>
              </button>
            </div>

            {/* Compact Start-From Picker */}
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 font-mono text-[9.5px] font-bold text-[#39FF14]">
                FROM:
              </span>
              <select
                aria-label="Starting campus location"
                value={customOriginPinId}
                onChange={(e) => {
                  setCustomOriginPinId(e.target.value);
                  setActiveStepIndex(0);
                }}
                className="min-w-0 flex-1 border border-[#282C38] bg-[#15171E] px-2 py-1 font-mono text-[10px] text-[#F8FAFC] outline-none"
              >
                <option value="AUTO_GPS">
                  {gpsMode === 'LIVE'
                    ? 'Live GPS Signal'
                    : `Preset: ${presets[presetIndex]?.label ?? 'Main Gate'}`}
                </option>
                {CAMPUS_PINS.map((pin) => (
                  <option key={pin.id} value={pin.id}>
                    {pin.mapLabel || pin.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Horizontal Category Chips */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTER_TABS.map((tab) => {
              const active = selectedFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedFilter(tab.key)}
                  className={`shrink-0 border px-2.5 py-1 font-mono text-[9.5px] font-bold ${
                    active
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#050507]/90 text-[#A1A7B3]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Quick Search Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="pointer-events-auto max-h-48 overflow-y-auto border border-[#FF1E2D] bg-[#050507]/95 shadow-2xl">
              {searchSuggestions.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => focusPinFromSearch(pin)}
                  className="flex w-full items-center gap-2.5 border-b border-[#282C38] px-3 py-2 text-left hover:bg-[#15171E] last:border-b-0"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#39FF14]" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-xs font-bold text-[#F8FAFC]">
                      {pin.mapLabel || pin.name}
                    </div>
                    <div className="truncate text-[10px] text-[#A1A7B3]">
                      {pin.name} • {BUILDINGS[pin.building].shortName}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outside Campus Toast Notice */}
        {outsideNotice && (
          <div className="pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-30 border border-[#FF1E2D] bg-[#050507]/95 px-3 py-2 font-mono text-xs text-[#F8FAFC] shadow-xl">
            GPS outside BBSUTSD perimeter — map stays centered on campus.
          </div>
        )}

        {/* Right-Edge Floating Tactical Map Controls */}
        <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex flex-col gap-2">
          <MapCircleBtn
            title={isSatellite ? 'Switch to OSM Street View' : 'Switch to Satellite Imagery'}
            active={isSatellite}
            onClick={() => setIsSatellite((s) => !s)}
          >
            {isSatellite ? <Layers className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
          </MapCircleBtn>

          <MapCircleBtn title="Zoom In" onClick={() => mapRef.current?.zoomIn()}>
            <ZoomIn className="h-4 w-4" />
          </MapCircleBtn>

          <MapCircleBtn title="Zoom Out" onClick={() => mapRef.current?.zoomOut()}>
            <ZoomOut className="h-4 w-4" />
          </MapCircleBtn>

          <MapCircleBtn
            title="Recenter on My GPS"
            active={gpsMode === 'LIVE'}
            onClick={handleRecenterUser}
          >
            <LocateFixed className="h-4 w-4" />
          </MapCircleBtn>

          <MapCircleBtn
            title="Center on BBSUTSD Campus"
            danger
            onClick={() =>
              mapRef.current?.setView([BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng], 17, {
                animate: true,
              })
            }
          >
            <Crosshair className="h-4 w-4" />
          </MapCircleBtn>
        </div>

        {/* Desktop Map Top-Left Route Pill OR Bottom Legend */}
        {focusedPin && activeRoute && (
          <div className="hidden lg:flex items-center gap-3 absolute top-3 left-3 z-20 border border-[#39FF14] bg-[#050507]/94 backdrop-blur-md px-3.5 py-2 shadow-xl cut-corner-sm">
            <Footprints className="h-4 w-4 text-[#39FF14]" />
            <div className="font-mono text-[11px] font-bold text-[#F8FAFC]">
              <span className="text-[#39FF14]">{effectiveOrigin?.label}</span>
              <span className="mx-1.5 text-[#FF1E2D]">→</span>
              <span>{focusedPin.mapLabel || focusedPin.name}</span>
              <span className="ml-2 text-[#A1A7B3]">
                ({formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                {activeRoute.estimatedMinutes} MIN)
              </span>
            </div>
          </div>
        )}

        <div className="hidden lg:flex absolute bottom-3 left-3 z-20 items-center gap-3.5 border border-[#282C38] bg-[#050507]/95 px-3.5 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC] cut-corner-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF1E2D]" /> OLD
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39FF14]" /> NEW / ROUTE
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F8FAFC]" /> ROAD
          </span>
        </div>

        {/* =================================================================== */}
        {/* MOBILE BOTTOM INTERACTIVE SHEET (Pin Info + Turn-by-Turn Tutorial)  */}
        {/* =================================================================== */}
        {focusedPin ? (
          <div className="lg:hidden absolute bottom-2 left-2 right-2 z-20 border border-[#FF1E2D] bg-[#050507]/96 backdrop-blur-md shadow-2xl cut-corner-sm">
            {/* Sheet Top Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#282C38] px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9.5px] font-bold">
                  <span className="border border-[#FF1E2D] bg-[#15171E] px-1.5 py-0.5 text-[#FF1E2D]">
                    {BUILDINGS[focusedPin.building].shortName.toUpperCase()} • {focusedPin.roomNumber}
                  </span>
                  {activeRoute && (
                    <span className="text-[#39FF14]">
                      {formatDistance(activeRoute.totalDistanceMeters)} •{' '}
                      {activeRoute.estimatedMinutes} MIN
                    </span>
                  )}
                </div>
                <h3 className="mt-1 truncate font-display text-sm font-bold text-[#F8FAFC]">
                  {focusedPin.name}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileSheetExpanded((v) => !v)}
                  aria-label={mobileSheetExpanded ? 'Collapse sheet' : 'Expand sheet'}
                  className="flex h-8 w-8 items-center justify-center border border-[#282C38] bg-[#15171E] text-[#F8FAFC]"
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
                  className="flex h-8 w-8 items-center justify-center border border-[#282C38] bg-[#15171E] text-[#A1A7B3]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {mobileSheetExpanded && (
              <div className="p-3 space-y-2.5 max-h-[46dvh] overflow-y-auto">
                {/* Mobile Sub-tabs: DIRECTIONS vs INFO */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab('DIRECTIONS')}
                    className={`py-1.5 font-mono text-[10px] font-bold border ${
                      mobileSheetTab === 'DIRECTIONS'
                        ? 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                        : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
                    }`}
                  >
                    DIRECTIONS ({activeRoute?.steps.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSheetTab('INFO')}
                    className={`py-1.5 font-mono text-[10px] font-bold border ${
                      mobileSheetTab === 'INFO'
                        ? 'border-[#FF1E2D] bg-[#26080D] text-[#FF1E2D]'
                        : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
                    }`}
                  >
                    LOCATION INFO
                  </button>
                </div>

                {mobileSheetTab === 'DIRECTIONS' && activeRoute ? (
                  <div className="space-y-2">
                    {currentTutorialStep && (
                      <div className="flex items-center gap-2 border border-[#FF1E2D] bg-[#26080D]/80 p-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#FF1E2D] text-white">
                          <TurnGlyph action={currentTutorialStep.action} className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[9px] font-bold text-[#FF1E2D]">
                            STEP {activeStepIndex + 1}/{activeRoute.steps.length}
                          </div>
                          <div className="text-xs font-semibold text-[#F8FAFC]">
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
                            className="flex h-7 w-7 items-center justify-center border border-[#282C38] bg-[#050507] text-white disabled:opacity-35"
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
                            className="flex h-7 w-7 items-center justify-center border border-[#282C38] bg-[#050507] text-white disabled:opacity-35"
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
                          className={`flex w-full items-center gap-2 border px-2 py-1.5 text-left text-[11px] ${
                            idx === activeStepIndex
                              ? 'border-[#39FF14] bg-[#0B2407] text-[#F8FAFC]'
                              : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
                          }`}
                        >
                          <span className="font-mono text-[10px] font-bold text-[#39FF14]">
                            {idx + 1}.
                          </span>
                          <TurnGlyph action={step.action} className="h-3.5 w-3.5 shrink-0" />
                          <span className="flex-1">{step.instruction}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <p className="text-[#A1A7B3]">
                      <strong className="text-[#F8FAFC]">In-Charge:</strong> {focusedPin.inCharge} •{' '}
                      {focusedPin.timings}
                    </p>
                    <p className="text-[#A1A7B3]">{focusedPin.description}</p>
                    <div className="border border-[#282C38] bg-[#15171E] p-2 text-[11px]">
                      <span className="font-mono font-bold text-[#39FF14]">INDOOR: </span>
                      <span className="text-[#F8FAFC]">{focusedPin.indoorGuide}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenPinDetail(focusedPin)}
                    className="flex flex-1 items-center justify-center gap-1 bg-[#FF1E2D] px-2.5 py-2 font-display text-xs font-bold text-white"
                  >
                    <Info className="h-3.5 w-3.5" />
                    DETAILS
                  </button>
                  {focusedPin.building !== 'CAMPUS_GROUNDS' &&
                    focusedPin.floor !== 'OUTDOOR' && (
                      <button
                        type="button"
                        onClick={() => onOpenIndoorPlan(focusedPin)}
                        className="flex flex-1 items-center justify-center gap-1 border border-[#F8FAFC] bg-[#0D0E12] px-2.5 py-2 font-display text-xs font-bold text-[#F8FAFC]"
                      >
                        <Layers className="h-3.5 w-3.5 text-[#39FF14]" />
                        FLOOR
                      </button>
                    )}
                  {(focusedPin.id === 'campus_transport_office' ||
                    focusedPin.id === 'campus_transport') && (
                    <button
                      type="button"
                      onClick={onOpenBusTimings}
                      className="flex flex-1 items-center justify-center gap-1 bg-[#39FF14] px-2.5 py-2 font-display text-xs font-bold text-[#050507]"
                    >
                      <Bus className="h-3.5 w-3.5" />
                      BUSES
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 border border-[#282C38] bg-[#050507]/95 px-3 py-1.5 font-mono text-[9.5px] font-bold text-[#F8FAFC] cut-corner-sm">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#FF1E2D]" /> OLD
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#39FF14]" /> NEW
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#F8FAFC]" /> ROAD
            </span>
            <span className="text-[#39FF14]">TAP ANY PIN</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MapCircleBtn({
  title,
  active,
  danger,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border shadow-lg transition cursor-pointer ${
        active
          ? 'border-[#39FF14] bg-[#39FF14] text-[#050507]'
          : danger
          ? 'border-[#FF1E2D] bg-[#050507]/95 text-[#FF1E2D] hover:bg-[#26080D]'
          : 'border-[#282C38] bg-[#050507]/95 text-[#F8FAFC] hover:border-[#39FF14]'
      }`}
    >
      {children}
    </button>
  );
}

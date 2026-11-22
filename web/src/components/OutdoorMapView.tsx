import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Bus,
  Compass,
  Crosshair,
  Footprints,
  Info,
  Layers,
  LocateFixed,
  Map as MapIcon,
  Radio,
  Search,
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
  NEW_COMPLEX_ZONE,
  OLD_COMPLEX_ZONE,
  RESTRICT_BOUNDS,
} from '../data/campusData';
import type { GpsMode } from '../hooks/useGeolocation';
import type { CampusPin, LatLng, UserLocation } from '../types/campus';
import {
  calculateDistanceMeters,
  estimateWalkMinutes,
  evaluateCampusContainment,
  formatDistance,
  searchPins,
} from '../utils/geo';

type MapFilterTab = 'ALL' | 'OFFICES' | 'LABS_WORKSHOPS' | 'TRANSPORT' | 'AMENITIES';

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
  const [osmBoundary, setOsmBoundary] = useState<LatLng[] | null>(null);
  const [osmBuildings, setOsmBuildings] = useState<
    { coords: LatLng[]; centerLat: number; centerLng: number }[]
  >([]);
  const [osmRoads, setOsmRoads] = useState<LatLng[][]>([]);
  const [outsideNotice, setOutsideNotice] = useState(false);

  const searchSuggestions = useMemo(() => {
    if (!searchText.trim()) return [];
    return searchPins(CAMPUS_PINS, searchText).slice(0, 6);
  }, [searchText]);

  const boundaryStatus = useMemo(() => {
    if (!userLocation) return null;
    return evaluateCampusContainment(
      userLocation.latitude,
      userLocation.longitude,
      osmBoundary
    );
  }, [userLocation, osmBoundary]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const bounds = L.latLngBounds(
      [RESTRICT_BOUNDS.south, RESTRICT_BOUNDS.west],
      [RESTRICT_BOUNDS.north, RESTRICT_BOUNDS.east]
    );

    const map = L.map(mapContainerRef.current, {
      center: [BBSUTSD_CENTER.lat, BBSUTSD_CENTER.lng],
      zoom: 17,
      minZoom: 16,
      maxZoom: 19,
      maxBounds: bounds,
      maxBoundsViscosity: 0.88,
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
    const markersGroup = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);
    const guideGroup = L.layerGroup().addTo(map);

    map.on('click', () => {
      setFocusedPin(null);
    });

    mapRef.current = map;
    satLayerRef.current = sat;
    streetLayerRef.current = street;
    geometryLayerGroupRef.current = geoGroup;
    markersLayerGroupRef.current = markersGroup;
    userLayerGroupRef.current = userGroup;
    guideLayerGroupRef.current = guideGroup;

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
        // Fallback smoothly to local curated zones & verified coordinates
      });

    return () => {
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

    // Old Complex (#FF1E2D) & New Complex (#39FF14)
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

    // OSM Building footprints
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

    // Dividing Road Highlight + OSM Roads
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

    // Complex Badges
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

  // 4. Render Labeled Campus Pins
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
      const html = `<div class="campus-pin${isSelected ? ' is-selected' : ''}" style="--pin-color:${color}">
        <div class="campus-pin-label">${escapeHtml(pin.mapLabel || pin.name)}</div>
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
        zIndexOffset: isSelected ? 850 : 200,
      }).addTo(group);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setFocusedPin(pin);
        mapRef.current?.setView([pin.latitude, pin.longitude], 18, { animate: true });
      });
    });
  }, [selectedFilter, searchText, focusedPin]);

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

  // 6. Render Guide Vector Line from User to Focused Pin
  useEffect(() => {
    const group = guideLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!focusedPin || !userLocation) return;

    const dist = calculateDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      focusedPin.latitude,
      focusedPin.longitude
    );
    if (dist > 3000) return;

    L.polyline(
      [
        [userLocation.latitude, userLocation.longitude],
        [focusedPin.latitude, focusedPin.longitude],
      ],
      {
        color: '#39FF14',
        weight: 3.5,
        opacity: 0.95,
        dashArray: '6, 8',
        interactive: false,
      }
    ).addTo(group);
  }, [focusedPin, userLocation]);

  // 7. Handle incoming navigation target from other tabs
  useEffect(() => {
    if (!navTargetPin) return;
    setFocusedPin(navTargetPin);
    setSelectedFilter('ALL');
    setSearchText('');
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

  const focusPinOnMap = (pin: CampusPin) => {
    setFocusedPin(pin);
    setSelectedFilter('ALL');
    setSearchText('');
    mapRef.current?.setView([pin.latitude, pin.longitude], 18, { animate: true });
  };

  const activeDistance =
    focusedPin && userLocation
      ? calculateDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          focusedPin.latitude,
          focusedPin.longitude
        )
      : null;

  return (
    <div className="relative h-[calc(100vh-132px)] lg:h-[calc(100vh-88px)] min-h-[540px] w-full overflow-hidden border border-[#282C38] bg-[#050507] cut-corner">
      {/* Leaflet Canvas */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Top Tactical HUD */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 z-20 flex flex-col gap-2.5 max-w-2xl">
        <div className="pointer-events-auto border border-[#282C38] bg-[#050507]/92 backdrop-blur-md p-3.5 shadow-2xl cut-corner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="font-display text-sm sm:text-base font-bold tracking-wider text-[#F8FAFC]">
                BBSUTSD // CAMPUS RADAR
              </h1>
              <p className="font-mono text-[10px] font-bold text-[#FF1E2D]">
                27.5108° N • 68.7416° E • KHAIRPUR MIRS
              </p>
            </div>

            {/* GPS Mode & Campus Preset Selector */}
            <div className="flex flex-wrap items-center gap-2">
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

              <select
                aria-label="Simulate campus GPS preset"
                value={gpsMode === 'SIMULATED' ? presetIndex : -1}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if (idx >= 0) onSelectPreset(idx);
                }}
                className="border border-[#282C38] bg-[#15171E] px-2 py-1 font-mono text-[10px] font-bold text-[#F8FAFC] outline-none focus:border-[#FF1E2D]"
              >
                {gpsMode === 'LIVE' && <option value={-1}>Preset Teleport...</option>}
                {presets.map((p, idx) => (
                  <option key={p.label} value={idx}>
                    PIN: {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF1E2D]" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Find VC Office, Civil Labs, Workshops, Point Parking, Canteen..."
              className="w-full border border-[#282C38] bg-[#15171E] py-2 pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#687080] outline-none focus:border-[#FF1E2D] cut-corner-sm"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A7B3] hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Boundary Status Bar */}
          <div className="mt-2.5">
            {gpsError && gpsMode === 'LIVE' ? (
              <div className="flex items-center justify-between border border-[#FF1E2D] bg-[#26080D] px-3 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC]">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#FF1E2D]" />
                  {gpsError}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectPreset(0)}
                  className="text-[#39FF14] underline cursor-pointer"
                >
                  USE GATE PRESET
                </button>
              </div>
            ) : boundaryStatus?.isInside === false ? (
              <div className="flex items-center gap-2 border border-[#FF1E2D]/70 bg-[#26080D] px-3 py-1.5 font-mono text-[10px] font-bold text-[#F8FAFC]">
                <AlertTriangle className="h-3.5 w-3.5 text-[#FF1E2D]" />
                <span>
                  OUTSIDE CAMPUS BOUNDS • {formatDistance(boundaryStatus.distanceMeters)} AWAY
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 border border-[#39FF14]/60 bg-[#0B2407] px-3 py-1.5 font-mono text-[10px] font-bold text-[#39FF14]">
                <Compass className="h-3.5 w-3.5" />
                <span>
                  INSIDE BBSUTSD CAMPUS
                  {userLocation?.accuracyMeters
                    ? ` (±${Math.round(userLocation.accuracyMeters)}M)`
                    : ''}
                  {userLocation?.isSimulated ? ` • ${userLocation.label.toUpperCase()}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => {
            const active = selectedFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedFilter(tab.key)}
                className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] font-bold transition cursor-pointer cut-corner-sm ${
                  active
                    ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                    : 'border-[#282C38] bg-[#050507]/90 text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quick Search Autocomplete Dropdown */}
        {searchSuggestions.length > 0 && (
          <div className="pointer-events-auto max-h-56 overflow-y-auto border border-[#FF1E2D] bg-[#050507]/95 shadow-2xl cut-corner-sm">
            {searchSuggestions.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => focusPinOnMap(pin)}
                className="flex w-full items-center gap-3 border-b border-[#282C38] px-3.5 py-2.5 text-left transition hover:bg-[#15171E] cursor-pointer last:border-b-0"
              >
                <Compass className="h-4 w-4 shrink-0 text-[#39FF14]" />
                <div className="min-w-0">
                  <div className="truncate font-display text-xs font-bold text-[#F8FAFC]">
                    {pin.mapLabel || pin.name}
                  </div>
                  <div className="truncate text-[11px] text-[#A1A7B3]">
                    {pin.name} • {BUILDINGS[pin.building].shortName}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {outsideNotice && (
          <div className="pointer-events-auto border border-[#FF1E2D] bg-[#050507]/95 px-3 py-2 text-xs text-[#F8FAFC] cut-corner-sm">
            GPS outside BBSUTSD perimeter — map stays anchored on campus.
          </div>
        )}
      </div>

      {/* Right-Edge Floating Tactical Controls */}
      <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex flex-col gap-2.5">
        <MapCircleBtn
          title={isSatellite ? 'Switch to OSM Street View' : 'Switch to Satellite Imagery'}
          active={isSatellite}
          onClick={() => setIsSatellite((s) => !s)}
        >
          {isSatellite ? <Layers className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
        </MapCircleBtn>

        <MapCircleBtn title="Zoom In" onClick={() => mapRef.current?.zoomIn()}>
          <ZoomIn className="h-5 w-5" />
        </MapCircleBtn>

        <MapCircleBtn title="Zoom Out" onClick={() => mapRef.current?.zoomOut()}>
          <ZoomOut className="h-5 w-5" />
        </MapCircleBtn>

        <MapCircleBtn
          title="Recenter on My GPS"
          active={gpsMode === 'LIVE'}
          onClick={handleRecenterUser}
        >
          <LocateFixed className="h-5 w-5" />
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
          <Crosshair className="h-5 w-5" />
        </MapCircleBtn>
      </div>

      {/* Bottom Selected Landmark HUD Card or Legend */}
      {focusedPin ? (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[440px] z-20 border border-[#FF1E2D] bg-[#050507]/96 backdrop-blur-md p-4 shadow-2xl cut-corner">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-bold">
                <span className="border border-[#FF1E2D] bg-[#15171E] px-2 py-0.5 text-[#FF1E2D]">
                  {BUILDINGS[focusedPin.building].shortName.toUpperCase()} • {focusedPin.roomNumber}
                </span>
                {activeDistance !== null && (
                  <span className="flex items-center gap-1 text-[#39FF14]">
                    <Footprints className="h-3.5 w-3.5" />
                    {formatDistance(activeDistance)} ({estimateWalkMinutes(activeDistance)} MIN)
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-display text-base font-bold text-[#F8FAFC]">
                {focusedPin.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-[#A1A7B3]">
                {focusedPin.subTitle} • {focusedPin.inCharge}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFocusedPin(null)}
              aria-label="Dismiss selected pin"
              className="p-1 text-[#A1A7B3] hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(focusedPin.id === 'campus_transport_office' ||
              focusedPin.id === 'campus_transport') && (
              <button
                type="button"
                onClick={onOpenBusTimings}
                className="flex flex-1 items-center justify-center gap-1.5 bg-[#39FF14] px-3 py-2.5 font-display text-xs font-bold text-[#050507] transition hover:brightness-110 cursor-pointer cut-corner-sm"
              >
                <Bus className="h-4 w-4" />
                <span>POINT BUSES</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenPinDetail(focusedPin)}
              className="flex flex-1 items-center justify-center gap-1.5 bg-[#FF1E2D] px-3 py-2.5 font-display text-xs font-bold text-white transition hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
            >
              <Info className="h-4 w-4" />
              <span>DETAILS</span>
            </button>

            {focusedPin.building !== 'CAMPUS_GROUNDS' &&
              focusedPin.floor !== 'OUTDOOR' && (
                <button
                  type="button"
                  onClick={() => onOpenIndoorPlan(focusedPin)}
                  className="flex flex-1 items-center justify-center gap-1.5 border border-[#F8FAFC] bg-[#0D0E12] px-3 py-2.5 font-display text-xs font-bold text-[#F8FAFC] transition hover:border-[#39FF14] hover:text-[#39FF14] cursor-pointer cut-corner-sm"
                >
                  <Layers className="h-4 w-4 text-[#39FF14]" />
                  <span>FLOOR</span>
                </button>
              )}
          </div>
        </div>
      ) : (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3.5 border border-[#282C38] bg-[#050507]/95 px-4 py-2 font-mono text-[10px] font-bold text-[#F8FAFC] cut-corner-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF1E2D]" /> OLD
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39FF14]" /> NEW
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F8FAFC]" /> ROAD
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#39FF14] animate-pulse" /> GPS
          </span>
        </div>
      )}
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
      className={`flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition cursor-pointer ${
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

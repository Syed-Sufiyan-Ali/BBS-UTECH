import { useMemo, useRef, useState } from 'react';
import {
  Compass,
  Footprints,
  Info,
  Route,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { BUILDINGS, CAMPUS_PINS, FLOORS } from '../data/campusData';
import type { BuildingKey, CampusPin, FloorKey } from '../types/campus';

interface IndoorMapViewProps {
  building: BuildingKey;
  floor: FloorKey;
  selectedPin: CampusPin | null;
  onSelectBuilding: (building: BuildingKey) => void;
  onSelectFloor: (floor: FloorKey) => void;
  onSelectPin: (pin: CampusPin | null) => void;
  onOpenPinDetail: (pin: CampusPin) => void;
}

const INDOOR_BUILDINGS: BuildingKey[] = ['OLD_BUILDING', 'NEW_BUILDING'];
const INDOOR_FLOORS: FloorKey[] = ['GROUND', 'FIRST', 'SECOND'];

export function IndoorMapView({
  building,
  floor,
  selectedPin,
  onSelectBuilding,
  onSelectFloor,
  onSelectPin,
  onOpenPinDetail,
}: IndoorMapViewProps) {
  const [showRoute, setShowRoute] = useState(true);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number }>({
    active: false,
    startX: 0,
    startY: 0,
  });

  const floorPins = useMemo(
    () =>
      CAMPUS_PINS.filter((p) => p.building === building && p.floor === floor),
    [building, floor]
  );

  const resetTransform = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const getPinColor = (pin: CampusPin): string => {
    switch (pin.category) {
      case 'ADMIN':
        return '#B3261E';
      case 'ACADEMIC':
        return '#334155';
      case 'LAB':
      case 'LIBRARY':
        return '#0F9D58';
      case 'STUDENT_SERVICE':
        return '#0B57D0';
      default:
        return '#0B57D0';
    }
  };

  // Convert 0..1 normalized indoor coordinates to SVG viewBox (0..1000 x 0..640)
  const toSvg = (nx: number, ny: number) => ({
    x: 60 + nx * 880,
    y: 45 + ny * 550,
  });

  const entranceSvg = toSvg(0.5, 0.9);
  const corridorY = toSvg(0.5, 0.5).y;
  const targetSvg = selectedPin ? toSvg(selectedPin.indoorX, selectedPin.indoorY) : null;

  return (
    <div className="flex flex-col gap-4 pb-24 lg:pb-10">
      {/* Building Segmented Control + Floor Pills + Route Toggle */}
      <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-[#EFF3F8] p-1">
            {INDOOR_BUILDINGS.map((bld) => {
              const active = building === bld;
              return (
                <button
                  key={bld}
                  type="button"
                  onClick={() => {
                    onSelectBuilding(bld);
                    resetTransform();
                  }}
                  className={`rounded-full px-4 py-2 font-display text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#0B57D0] text-white shadow-xs'
                      : 'text-[#444746] hover:text-[#111827]'
                  }`}
                >
                  {bld === 'OLD_BUILDING' ? 'Old Building' : 'New Complex'}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#5F6368]">Floor:</span>
            {INDOOR_FLOORS.map((fl) => {
              const active = floor === fl;
              const meta = FLOORS[fl];
              return (
                <button
                  key={fl}
                  type="button"
                  onClick={() => {
                    onSelectFloor(fl);
                    resetTransform();
                  }}
                  className={`rounded-full px-3.5 py-1.5 font-display text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#D3E3FD] text-[#041E49]'
                      : 'bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {meta.code} • {meta.displayName.split(' ')[0]}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowRoute((r) => !r)}
              className={`ml-1 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-xs font-semibold transition cursor-pointer ${
                showRoute
                  ? 'bg-[#E6F4EA] text-[#137333]'
                  : 'bg-[#EFF3F8] text-[#5F6368]'
              }`}
            >
              <Route className="h-3.5 w-3.5" />
              <span>{showRoute ? 'Path On' : 'Path Off'}</span>
            </button>
          </div>
        </div>

        {/* Selected Room Banner */}
        {selectedPin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#CBE6D3] bg-[#E6F4EA] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F9D58] text-white">
                <Footprints className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFFFFF] px-2 py-0.5 font-mono text-[11px] font-bold text-[#0B57D0]">
                    {selectedPin.roomNumber}
                  </span>
                  <span className="font-display text-sm font-bold text-[#111827]">
                    {selectedPin.name}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#1E4620]">{selectedPin.indoorGuide}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenPinDetail(selectedPin)}
              className="flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-4 py-2 font-display text-xs font-semibold text-white transition hover:bg-[#0842A0] cursor-pointer"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Full Info</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Split View: Architectural Light Drafting Canvas + Floor Directory */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div
          className="relative h-[430px] sm:h-[520px] overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-[#F8FAFC] shadow-xs select-none"
          onWheel={(e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.12 : 0.9;
            setScale((s) => Math.min(2.8, Math.max(0.75, Number((s * factor).toFixed(2)))));
          }}
          onMouseDown={(e) => {
            dragRef.current = {
              active: true,
              startX: e.clientX - offset.x,
              startY: e.clientY - offset.y,
            };
          }}
          onMouseMove={(e) => {
            if (!dragRef.current.active) return;
            setOffset({
              x: e.clientX - dragRef.current.startX,
              y: e.clientY - dragRef.current.startY,
            });
          }}
          onMouseUp={() => {
            dragRef.current.active = false;
          }}
          onMouseLeave={() => {
            dragRef.current.active = false;
          }}
        >
          {/* Floating Pixel Floor Pill Watermark */}
          <div className="pointer-events-none absolute top-3.5 left-3.5 z-10 rounded-full border border-[#DCE2EC] bg-[#FFFFFF]/95 px-3.5 py-1.5 font-display text-xs font-bold text-[#111827] shadow-xs">
            {BUILDINGS[building].shortName} • {FLOORS[floor].displayName}
          </div>

          <svg
            viewBox="0 0 1000 640"
            className="h-full w-full cursor-grab active:cursor-grabbing"
          >
            <g
              transform={`translate(${offset.x} ${offset.y}) translate(500 320) scale(${scale}) translate(-500 -320)`}
            >
              {/* Clean Architectural Drafting Grid */}
              <defs>
                <pattern id="bpGridLight" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="1000" height="640" fill="url(#bpGridLight)" />

              {/* Building Outer Shell */}
              <rect
                x={toSvg(0.12, 0.12).x}
                y={toSvg(0.12, 0.12).y}
                width={toSvg(0.88, 0.88).x - toSvg(0.12, 0.12).x}
                height={toSvg(0.88, 0.88).y - toSvg(0.12, 0.12).y}
                rx="18"
                fill="#FFFFFF"
                stroke="#0B57D0"
                strokeOpacity="0.85"
                strokeWidth="3"
              />

              {/* Horizontal & Vertical Corridors */}
              <rect
                x={toSvg(0.12, 0.44).x}
                y={toSvg(0.12, 0.44).y}
                width={toSvg(0.88, 0.56).x - toSvg(0.12, 0.44).x}
                height={toSvg(0.88, 0.56).y - toSvg(0.12, 0.44).y}
                fill="#EFF3F8"
              />
              <rect
                x={toSvg(0.44, 0.12).x}
                y={toSvg(0.44, 0.12).y}
                width={toSvg(0.56, 0.88).x - toSvg(0.44, 0.12).x}
                height={toSvg(0.56, 0.88).y - toSvg(0.44, 0.12).y}
                fill="#EFF3F8"
              />

              {/* Inner Room Partition Walls */}
              <g stroke="#CBD5E1" strokeWidth="2.5">
                <line x1={toSvg(0.28, 0.12).x} y1={toSvg(0.28, 0.12).y} x2={toSvg(0.28, 0.44).x} y2={toSvg(0.28, 0.44).y} />
                <line x1={toSvg(0.12, 0.44).x} y1={toSvg(0.12, 0.44).y} x2={toSvg(0.44, 0.44).x} y2={toSvg(0.44, 0.44).y} />
                <line x1={toSvg(0.72, 0.12).x} y1={toSvg(0.72, 0.12).y} x2={toSvg(0.72, 0.44).x} y2={toSvg(0.72, 0.44).y} />
                <line x1={toSvg(0.56, 0.44).x} y1={toSvg(0.56, 0.44).y} x2={toSvg(0.88, 0.44).x} y2={toSvg(0.88, 0.44).y} />
                <line x1={toSvg(0.28, 0.56).x} y1={toSvg(0.28, 0.56).y} x2={toSvg(0.28, 0.88).x} y2={toSvg(0.28, 0.88).y} />
                <line x1={toSvg(0.12, 0.56).x} y1={toSvg(0.12, 0.56).y} x2={toSvg(0.44, 0.56).x} y2={toSvg(0.44, 0.56).y} />
                <line x1={toSvg(0.72, 0.56).x} y1={toSvg(0.72, 0.56).y} x2={toSvg(0.72, 0.88).x} y2={toSvg(0.72, 0.88).y} />
                <line x1={toSvg(0.56, 0.56).x} y1={toSvg(0.56, 0.56).y} x2={toSvg(0.88, 0.56).x} y2={toSvg(0.56, 0.56).y} />
              </g>

              {/* Central Staircase Core */}
              <rect
                x={toSvg(0.45, 0.7).x}
                y={toSvg(0.45, 0.7).y}
                width={toSvg(0.55, 0.82).x - toSvg(0.45, 0.7).x}
                height={toSvg(0.55, 0.82).y - toSvg(0.45, 0.7).y}
                rx="8"
                fill="#FCE8E6"
                stroke="#B3261E"
                strokeWidth="2"
              />
              <text
                x={toSvg(0.5, 0.765).x}
                y={toSvg(0.5, 0.765).y}
                textAnchor="middle"
                fill="#B3261E"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
              >
                STAIRS
              </text>

              {/* Main Entrance Porch */}
              <rect
                x={toSvg(0.42, 0.88).x}
                y={toSvg(0.42, 0.88).y}
                width={toSvg(0.58, 0.94).x - toSvg(0.42, 0.88).x}
                height={toSvg(0.58, 0.94).y - toSvg(0.42, 0.88).y}
                rx="6"
                fill="#0F9D58"
              />
              <text
                x={toSvg(0.5, 0.975).x}
                y={toSvg(0.5, 0.975).y}
                textAnchor="middle"
                fill="#137333"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
              >
                MAIN ENTRANCE / FOYER
              </text>

              {/* Google Maps Style Walkable Indoor Route */}
              {showRoute && targetSvg && (
                <g>
                  <polyline
                    points={`${entranceSvg.x},${entranceSvg.y} ${entranceSvg.x},${corridorY} ${targetSvg.x},${corridorY} ${targetSvg.x},${targetSvg.y}`}
                    fill="none"
                    stroke="#D3E3FD"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={`${entranceSvg.x},${entranceSvg.y} ${entranceSvg.x},${corridorY} ${targetSvg.x},${corridorY} ${targetSvg.x},${targetSvg.y}`}
                    fill="none"
                    stroke="#0B57D0"
                    strokeWidth="4.5"
                    strokeDasharray="10 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={entranceSvg.x} cy={entranceSvg.y} r="7" fill="#0F9D58" />
                  <circle cx={entranceSvg.x} cy={entranceSvg.y} r="3" fill="#FFFFFF" />
                </g>
              )}

              {/* Room Pins */}
              {floorPins.map((pin) => {
                const pos = toSvg(pin.indoorX, pin.indoorY);
                const isSelected = selectedPin?.id === pin.id;
                const color = getPinColor(pin);
                return (
                  <g
                    key={pin.id}
                    onClick={() => onSelectPin(pin)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <>
                        <circle cx={pos.x} cy={pos.y} r="28" fill="#0B57D0" fillOpacity="0.18" />
                        <circle cx={pos.x} cy={pos.y} r="19" fill="#0B57D0" fillOpacity="0.3" />
                      </>
                    )}
                    <circle cx={pos.x} cy={pos.y + 2} r="13" fill="#0F172A" fillOpacity="0.15" />
                    <circle cx={pos.x} cy={pos.y} r="12.5" fill="#FFFFFF" />
                    <circle cx={pos.x} cy={pos.y} r="9.5" fill={isSelected ? '#0B57D0' : color} />
                    <circle cx={pos.x} cy={pos.y} r="3" fill="#FFFFFF" />
                    <rect
                      x={pos.x - 58}
                      y={pos.y - 36}
                      width="116"
                      height="20"
                      rx="10"
                      fill={isSelected ? '#0B57D0' : '#FFFFFF'}
                      stroke={isSelected ? '#0B57D0' : '#DCE2EC'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 23}
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#111827'}
                      fontSize="10"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                    >
                      {pin.roomNumber} • {pin.mapLabel.slice(0, 10)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Floating Pixel Zoom Pills */}
          <div className="absolute right-3.5 bottom-3.5 z-10 flex flex-col gap-2">
            <button
              type="button"
              title="Zoom In"
              onClick={() => setScale((s) => Math.min(2.8, Number((s * 1.2).toFixed(2))))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#FFFFFF] text-[#111827] shadow-md hover:bg-[#EFF3F8] cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Zoom Out"
              onClick={() => setScale((s) => Math.max(0.75, Number((s * 0.82).toFixed(2))))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-[#FFFFFF] text-[#111827] shadow-md hover:bg-[#EFF3F8] cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Reset View"
              onClick={resetTransform}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D3E3FD] text-[#041E49] shadow-md hover:bg-[#C2D7FC] cursor-pointer"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Floor Directory List */}
        <div className="rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-[#5F6368]">
              Floor Directory ({floorPins.length})
            </span>
            <span className="rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#0B57D0]">
              Tap to route
            </span>
          </div>

          <div className="mt-3 space-y-2 overflow-y-auto max-h-[450px] pr-1">
            {floorPins.map((pin) => {
              const active = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => onSelectPin(pin)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition cursor-pointer ${
                    active
                      ? 'border-[#0B57D0] bg-[#E8F0FE]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#0B57D0]/50 hover:bg-[#FFFFFF]'
                  }`}
                >
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold ${
                      active
                        ? 'bg-[#0B57D0] text-white'
                        : 'bg-[#FFFFFF] text-[#0B57D0] border border-[#DCE2EC]'
                    }`}
                  >
                    {pin.roomNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-[#111827]">
                      {pin.name}
                    </div>
                    <div className="truncate text-xs text-[#5F6368]">{pin.subTitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

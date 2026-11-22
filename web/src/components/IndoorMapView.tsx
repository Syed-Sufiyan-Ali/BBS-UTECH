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
        return '#FF1E2D';
      case 'ACADEMIC':
        return '#F8FAFC';
      case 'LAB':
      case 'LIBRARY':
        return '#39FF14';
      case 'STUDENT_SERVICE':
        return '#FF6B76';
      default:
        return '#FF1E2D';
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
      {/* Building Tabs + Floor Chips + Route Toggle */}
      <div className="border border-[#282C38] bg-[#0D0E12] p-4 cut-corner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
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
                  className={`border px-4 py-2 font-display text-xs font-bold tracking-wider transition cursor-pointer cut-corner-sm ${
                    active
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                  }`}
                >
                  {bld === 'OLD_BUILDING' ? 'OLD BUILDING' : 'NEW COMPLEX'}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[#A1A7B3]">LVL:</span>
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
                  className={`border px-3 py-1.5 font-mono text-[11px] font-bold transition cursor-pointer cut-corner-sm ${
                    active
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#050507] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                  }`}
                >
                  {meta.code} • {meta.displayName.split(' ')[0].toUpperCase()}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowRoute((r) => !r)}
              className={`ml-1 flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] font-bold transition cursor-pointer cut-corner-sm ${
                showRoute
                  ? 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                  : 'border-[#282C38] bg-[#050507] text-[#A1A7B3]'
              }`}
            >
              <Route className="h-3.5 w-3.5" />
              <span>{showRoute ? 'PATH ON' : 'PATH OFF'}</span>
            </button>
          </div>
        </div>

        {/* Selected Room Banner */}
        {selectedPin && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[#39FF14]/70 bg-[#050507] px-4 py-3 cut-corner-sm">
            <div className="flex items-center gap-3 min-w-0">
              <Footprints className="h-5 w-5 shrink-0 text-[#39FF14]" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#FF1E2D]">
                    {selectedPin.roomNumber}
                  </span>
                  <span className="font-display text-sm font-bold text-[#F8FAFC]">
                    {selectedPin.name}
                  </span>
                </div>
                <p className="text-xs text-[#A1A7B3]">{selectedPin.indoorGuide}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenPinDetail(selectedPin)}
              className="flex items-center gap-1.5 border border-[#39FF14] bg-[#0B2407] px-3 py-1.5 font-mono text-xs font-bold text-[#39FF14] hover:brightness-125 cursor-pointer cut-corner-sm"
            >
              <Info className="h-3.5 w-3.5" />
              <span>FULL INFO</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Split View: Interactive Blueprint Canvas + Floor Directory */}
      <div className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        {/* Architectural SVG Blueprint Canvas */}
        <div
          className="relative h-[430px] sm:h-[520px] overflow-hidden border border-[#282C38] bg-[#07080B] cut-corner select-none"
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
          {/* Watermark */}
          <div className="pointer-events-none absolute top-3 left-3 z-10 border border-[#FF1E2D]/70 bg-[#050507]/90 px-3 py-1.5 font-mono text-[11px] font-bold text-[#F8FAFC] cut-corner-sm">
            {BUILDINGS[building].shortName.toUpperCase()} // {FLOORS[floor].displayName.toUpperCase()}
          </div>

          {/* Interactive SVG */}
          <svg
            viewBox="0 0 1000 640"
            className="h-full w-full cursor-grab active:cursor-grabbing"
          >
            <g
              transform={`translate(${offset.x} ${offset.y}) translate(500 320) scale(${scale}) translate(-500 -320)`}
            >
              {/* Subtle Grid */}
              <defs>
                <pattern id="bpGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#15171E"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="1000" height="640" fill="url(#bpGrid)" />

              {/* Building Outer Shell */}
              <rect
                x={toSvg(0.12, 0.12).x}
                y={toSvg(0.12, 0.12).y}
                width={toSvg(0.88, 0.88).x - toSvg(0.12, 0.12).x}
                height={toSvg(0.88, 0.88).y - toSvg(0.12, 0.12).y}
                rx="12"
                fill="#0E1015"
                stroke="#FF1E2D"
                strokeOpacity="0.8"
                strokeWidth="3"
              />

              {/* Horizontal & Vertical Corridors */}
              <rect
                x={toSvg(0.12, 0.44).x}
                y={toSvg(0.12, 0.44).y}
                width={toSvg(0.88, 0.56).x - toSvg(0.12, 0.44).x}
                height={toSvg(0.88, 0.56).y - toSvg(0.12, 0.44).y}
                fill="#171A22"
              />
              <rect
                x={toSvg(0.44, 0.12).x}
                y={toSvg(0.44, 0.12).y}
                width={toSvg(0.56, 0.88).x - toSvg(0.44, 0.12).x}
                height={toSvg(0.56, 0.88).y - toSvg(0.44, 0.12).y}
                fill="#171A22"
              />

              {/* Inner Room Partition Walls */}
              <g stroke="#323746" strokeWidth="2.5">
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
                rx="6"
                fill="#26080D"
                stroke="#FF1E2D"
                strokeWidth="2.2"
              />
              <text
                x={toSvg(0.5, 0.765).x}
                y={toSvg(0.5, 0.765).y}
                textAnchor="middle"
                fill="#FF1E2D"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
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
                fill="#39FF14"
              />
              <text
                x={toSvg(0.5, 0.975).x}
                y={toSvg(0.5, 0.975).y}
                textAnchor="middle"
                fill="#39FF14"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                MAIN ENTRANCE / FOYER
              </text>

              {/* Neon Green Indoor Path Route */}
              {showRoute && targetSvg && (
                <g>
                  <polyline
                    points={`${entranceSvg.x},${entranceSvg.y} ${entranceSvg.x},${corridorY} ${targetSvg.x},${corridorY} ${targetSvg.x},${targetSvg.y}`}
                    fill="none"
                    stroke="#39FF14"
                    strokeOpacity="0.25"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={`${entranceSvg.x},${entranceSvg.y} ${entranceSvg.x},${corridorY} ${targetSvg.x},${corridorY} ${targetSvg.x},${targetSvg.y}`}
                    fill="none"
                    stroke="#39FF14"
                    strokeWidth="4"
                    strokeDasharray="12 8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={entranceSvg.x} cy={entranceSvg.y} r="7" fill="#39FF14" />
                  <circle cx={entranceSvg.x} cy={entranceSvg.y} r="3" fill="#050507" />
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
                        <circle cx={pos.x} cy={pos.y} r="28" fill="#39FF14" fillOpacity="0.32" />
                        <circle cx={pos.x} cy={pos.y} r="20" fill="#FF1E2D" fillOpacity="0.45" />
                      </>
                    )}
                    <circle cx={pos.x} cy={pos.y + 2} r="14" fill="#000" fillOpacity="0.6" />
                    <circle cx={pos.x} cy={pos.y} r="13" fill="#F8FAFC" />
                    <circle cx={pos.x} cy={pos.y} r="10" fill={color} />
                    <circle cx={pos.x} cy={pos.y} r="3.5" fill="#050507" />
                    <rect
                      x={pos.x - 56}
                      y={pos.y - 34}
                      width="112"
                      height="18"
                      rx="3"
                      fill="#050507"
                      fillOpacity="0.92"
                      stroke={isSelected ? '#39FF14' : color}
                      strokeWidth="1.2"
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 22}
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="700"
                    >
                      {pin.roomNumber} • {pin.mapLabel.slice(0, 10)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom Controls */}
          <div className="absolute right-3 bottom-3 z-10 flex flex-col gap-2">
            <button
              type="button"
              title="Zoom In"
              onClick={() => setScale((s) => Math.min(2.8, Number((s * 1.2).toFixed(2))))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#282C38] bg-[#050507]/95 text-[#F8FAFC] hover:border-[#39FF14] cursor-pointer"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Zoom Out"
              onClick={() => setScale((s) => Math.max(0.75, Number((s * 0.82).toFixed(2))))}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#282C38] bg-[#050507]/95 text-[#F8FAFC] hover:border-[#39FF14] cursor-pointer"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Reset View"
              onClick={resetTransform}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#39FF14]/60 bg-[#050507]/95 text-[#39FF14] hover:border-[#39FF14] cursor-pointer"
            >
              <Compass className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Floor Directory List */}
        <div className="border border-[#282C38] bg-[#0D0E12] p-4 cut-corner flex flex-col">
          <div className="flex items-center justify-between border-b border-[#282C38] pb-3">
            <span className="font-mono text-xs font-bold text-[#A1A7B3]">
              FLOOR DIRECTORY ({floorPins.length})
            </span>
            <span className="font-mono text-[10px] font-bold text-[#39FF14]">
              TAP ROOM TO ROUTE
            </span>
          </div>

          <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[450px] pr-1">
            {floorPins.map((pin) => {
              const active = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => onSelectPin(pin)}
                  className={`flex w-full items-center gap-3 border p-3 text-left transition cursor-pointer cut-corner-sm ${
                    active
                      ? 'border-[#FF1E2D] bg-[#26080D]'
                      : 'border-[#282C38] bg-[#15171E] hover:border-[#39FF14]'
                  }`}
                >
                  <span
                    className={`shrink-0 px-2 py-1 font-mono text-[10px] font-bold ${
                      active
                        ? 'bg-[#FF1E2D] text-white'
                        : 'bg-[#050507] text-[#39FF14]'
                    }`}
                  >
                    {pin.roomNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-bold text-[#F8FAFC]">
                      {pin.name}
                    </div>
                    <div className="truncate text-xs text-[#A1A7B3]">{pin.subTitle}</div>
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

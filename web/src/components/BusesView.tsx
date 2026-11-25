import { useEffect, useMemo, useState } from 'react';
import {
  Bus,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { BUS_POINT_ROUTES } from '../data/campusData';
import type { BusPointRoute } from '../types/campus';

interface BusesViewProps {
  selectedBusPoint: number | null;
  onSelectBusPoint: (point: number | null) => void;
  onLocatePinById: (pinId: string) => void;
}

export function BusesView({
  selectedBusPoint,
  onSelectBusPoint,
  onLocatePinById,
}: BusesViewProps) {
  const [busQuery, setBusQuery] = useState('');

  const filteredBusRoutes = useMemo(() => {
    const q = busQuery.trim().toLowerCase();
    return BUS_POINT_ROUTES.filter((route) => {
      const matchesPt =
        selectedBusPoint === null || route.pointNumber === selectedBusPoint;
      const matchesQ =
        !q ||
        route.busTitle.toLowerCase().includes(q) ||
        route.busNumber.toLowerCase().includes(q) ||
        route.corridorSummary.toLowerCase().includes(q) ||
        route.citiesCovered.some((c) => c.toLowerCase().includes(q)) ||
        route.stops.some(
          (s) =>
            s.stopName.toLowerCase().includes(q) ||
            s.cityArea.toLowerCase().includes(q) ||
            s.morningPickup.toLowerCase().includes(q)
        );
      return matchesPt && matchesQ;
    });
  }, [selectedBusPoint, busQuery]);

  return (
    <div className="space-y-5 pb-24 lg:pb-12">
      {/* Transport Office Banner + Filters */}
      <div className="nutty-card rounded-[28px] border border-[#E6DDD0] bg-[#FFFFFF] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full border border-[#DFCBB4] bg-[#F6ECE0] px-3 py-1 text-[11px] font-semibold text-[#7C4D2B]">
              Transport Office • Next to Boys Hostel
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold text-[#1F1812]">
              BBS-UTECH Official Bus &amp; Coaster Timetables
            </h1>
            <p className="mt-0.5 text-xs text-[#7D7166]">
              Bus No. 01–05, Hino (GS-9526) &amp; Coaster (GSF-325) • Transport Office: 0304-3482840
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-4 py-2 font-mono text-xs font-bold text-[#137333]">
              <Clock className="h-4 w-4" />
              <span>In 08:25 AM • Out 03:30 PM</span>
            </div>
            <button
              type="button"
              onClick={() => onLocatePinById('campus_transport')}
              className="nutty-btn-primary flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-4 py-2 font-display text-xs font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
            >
              <MapPin className="h-4 w-4" />
              <span>Map Pin</span>
            </button>
          </div>
        </div>

        {/* City Search + 7-Bus Filter Pills */}
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_1.15fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C4D2B]" />
            <input
              type="text"
              value={busQuery}
              onChange={(e) => setBusQuery(e.target.value)}
              placeholder="Search city or stop (Sukkur, Gambat, Chondko, Sobhodero, Thari Mirwah...)"
              className="w-full rounded-full border border-[#DFCBB4] bg-[#FAF7F2] py-2.5 pl-10 pr-9 text-xs text-[#1F1812] placeholder-[#7D7166] shadow-xs outline-none focus:border-[#7C4D2B] focus:bg-[#FFFFFF]"
            />
            {busQuery && (
              <button
                type="button"
                onClick={() => setBusQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D7166] hover:text-[#1F1812] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectBusPoint(null)}
              className={`nutty-chip rounded-full border px-3.5 py-2 font-display text-xs font-semibold cursor-pointer ${
                selectedBusPoint === null
                  ? 'border-[#7C4D2B] bg-[#7C4D2B] text-[#FAF7F2]'
                  : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
              }`}
            >
              All 7 Routes
            </button>
            {BUS_POINT_ROUTES.map((route) => {
              const pt = route.pointNumber;
              const active = selectedBusPoint === pt;
              const chipLabel =
                pt <= 5
                  ? `Bus 0${pt}`
                  : pt === 6
                  ? 'Hino (GS-9526)'
                  : 'Coaster (GSF-325)';
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => onSelectBusPoint(active ? null : pt)}
                  className={`nutty-chip rounded-full border px-3.5 py-2 font-display text-xs font-semibold cursor-pointer ${
                    active
                      ? 'border-[#0F9D58] bg-[#E6F4EA] text-[#137333]'
                      : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
                  }`}
                >
                  {chipLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredBusRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-10 text-center">
          <Bus className="h-10 w-10 text-[#0B57D0]" />
          <div className="mt-3 font-display text-sm font-bold text-[#111827]">
            No bus route matches &ldquo;{busQuery}&rdquo;
          </div>
          <p className="mt-1 text-xs text-[#5F6368]">
            Try Sukkur, Gambat, Hingorja, Ranipur, Pir Jo Goth, Rohri, or Thari Mirwah.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBusRoutes.map((route) => (
            <BusRouteCard
              key={route.pointNumber}
              route={route}
              highlightQuery={busQuery.trim().toLowerCase()}
              defaultExpanded={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BusRouteCard({
  route,
  highlightQuery,
  defaultExpanded,
}: {
  route: BusPointRoute;
  highlightQuery: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <div
      className={`nutty-card rounded-[24px] border bg-[#FFFFFF] p-5 ${
        expanded ? 'border-[#A66B3F]/60' : 'border-[#E6DDD0]'
      }`}
    >
      <div
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#7C4D2B] px-3 py-1 font-mono text-xs font-bold text-[#FAF7F2]">
            {route.pointNumber <= 5
              ? `Bus No. 0${route.pointNumber}`
              : route.pointNumber === 6
              ? 'HINO Bus'
              : 'City Coaster'}
          </span>
          <span className="rounded-full bg-[#E6F4EA] px-3 py-1 font-mono text-[11px] font-bold text-[#137333]">
            {route.busNumber}
          </span>
        </div>

        <button
          type="button"
          aria-label={expanded ? 'Collapse bus route' : 'Expand bus route'}
          className="nutty-chip flex h-9 w-9 items-center justify-center rounded-full border border-[#DFCBB4] bg-[#F6ECE0] text-[#7C4D2B] cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <h2 className="mt-2.5 font-display text-lg font-bold text-[#1F1812]">
        {route.busTitle}
      </h2>
      <p className="mt-0.5 text-xs text-[#7D7166]">{route.corridorSummary}</p>

      {/* Starts / Arrival / Return */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#E6DDD0] bg-[#FAF7F2] p-3.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5F6368]">
            Starts
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#111827]">
            {route.morningStartTime}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5F6368]">
            Arrival
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#137333]">
            {route.campusArrivalTime}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5F6368]">
            Return
          </div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#B3261E]">
            {route.afternoonDepartureTime}
          </div>
        </div>
      </div>

      {/* City Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {route.citiesCovered.map((city) => {
          const matched =
            highlightQuery.length > 0 && city.toLowerCase().includes(highlightQuery);
          return (
            <span
              key={city}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                matched
                  ? 'bg-[#0F9D58] text-white'
                  : 'bg-[#EFF3F8] text-[#444746]'
              }`}
            >
              {city}
            </span>
          );
        })}
      </div>

      {/* Stops Timeline */}
      {expanded && (
        <div className="mt-4 border-t border-[#E2E8F0] pt-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-[#0B57D0]">
              Stops Timeline ({route.stops.length})
            </span>
            <span className="text-[#137333]">
              {route.driverOrIncharge} • {route.contactPhone}
            </span>
          </div>

          <div className="grid gap-1.5 md:grid-cols-2">
            {route.stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === route.stops.length - 1;
              const isMatched =
                highlightQuery.length > 0 &&
                (stop.stopName.toLowerCase().includes(highlightQuery) ||
                  stop.cityArea.toLowerCase().includes(highlightQuery));

              return (
                <div
                  key={`${route.pointNumber}-${stop.stopName}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 ${
                    isMatched
                      ? 'bg-[#E6F4EA] border border-[#0F9D58]/40'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-bold ${
                        isFirst
                          ? 'bg-[#0B57D0] text-white'
                          : isLast
                          ? 'bg-[#0F9D58] text-white'
                          : 'bg-[#FFFFFF] text-[#444746] border border-[#DCE2EC]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#111827]">
                        {stop.stopName}
                      </div>
                      <div className="truncate text-[11px] text-[#5F6368]">
                        {stop.note ? `${stop.cityArea} • ${stop.note}` : stop.cityArea}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
                      isLast
                        ? 'bg-[#E6F4EA] text-[#137333]'
                        : 'bg-[#FFFFFF] text-[#111827] border border-[#E2E8F0]'
                    }`}
                  >
                    <Clock className="h-3 w-3 text-[#0B57D0]" />
                    {stop.morningPickup}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

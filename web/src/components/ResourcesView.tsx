import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Bus,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Layers,
  Mail,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react';
import {
  ACADEMIC_RESOURCES,
  BUS_POINT_ROUTES,
  CAMPUS_NOTICES,
  FACULTY_MEMBERS,
} from '../data/campusData';
import type {
  AcademicResource,
  BusPointRoute,
  CampusNotice,
  ResourcesSubTab,
} from '../types/campus';

interface ResourcesViewProps {
  activeSubTab: ResourcesSubTab;
  selectedBusPoint: number | null;
  onChangeSubTab: (tab: ResourcesSubTab) => void;
  onSelectBusPoint: (point: number | null) => void;
  onLocatePinById: (pinId: string) => void;
}

const SUB_TABS: { key: ResourcesSubTab; label: string }[] = [
  { key: 'ACADEMIC_HUB', label: 'Academic Hub' },
  { key: 'POINT_BUSES', label: 'Point Buses (7)' },
  { key: 'FACULTY', label: 'Faculty' },
  { key: 'NOTICES', label: 'Notices' },
];

export function ResourcesView({
  activeSubTab,
  selectedBusPoint,
  onChangeSubTab,
  onSelectBusPoint,
  onLocatePinById,
}: ResourcesViewProps) {
  const [busQuery, setBusQuery] = useState('');
  const [facultyQuery, setFacultyQuery] = useState('');
  const [modalResource, setModalResource] = useState<AcademicResource | null>(null);
  const [modalNotice, setModalNotice] = useState<CampusNotice | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalResource(null);
        setModalNotice(null);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

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

  const filteredFaculty = useMemo(() => {
    const q = facultyQuery.trim().toLowerCase();
    if (!q) return FACULTY_MEMBERS;
    return FACULTY_MEMBERS.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.designation.toLowerCase().includes(q)
    );
  }, [facultyQuery]);

  return (
    <div className="space-y-5 pb-24 lg:pb-12">
      {/* Header + Sub-tabs */}
      <div className="rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs">
        <h1 className="font-display text-2xl font-bold text-[#111827]">
          BBS-UTECH Campus Hub
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-[#0B57D0]">
          7-Route Bus Fleet • Portals • Faculty Directory • Campus Bulletins
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUB_TABS.map((tab) => {
            const active = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeSubTab(tab.key)}
                className={`rounded-full px-4 py-2 font-display text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-[#D3E3FD] text-[#041E49]'
                    : 'bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ACADEMIC HUB */}
      {activeSubTab === 'ACADEMIC_HUB' && (
        <div className="grid gap-4 md:grid-cols-2">
          {ACADEMIC_RESOURCES.map((item) => {
            const isTransport = item.category === 'Transport';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'res_bus_schedule') {
                    onChangeSubTab('POINT_BUSES');
                  } else {
                    setModalResource(item);
                  }
                }}
                className="flex items-center justify-between gap-4 rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 text-left shadow-xs transition hover:border-[#0B57D0] hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isTransport
                        ? 'bg-[#E6F4EA] text-[#137333]'
                        : 'bg-[#E8F0FE] text-[#0B57D0]'
                    }`}
                  >
                    {item.category === 'Portals' ? (
                      <ExternalLink className="h-5 w-5" />
                    ) : item.category === 'Transport' ? (
                      <Bus className="h-5 w-5" />
                    ) : item.category === 'Freshmen Guide' ? (
                      <HelpCircle className="h-5 w-5" />
                    ) : (
                      <BookOpen className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                        isTransport
                          ? 'bg-[#E6F4EA] text-[#137333]'
                          : 'bg-[#E8F0FE] text-[#0B57D0]'
                      }`}
                    >
                      {item.category}
                    </span>
                    <h3 className="mt-1.5 font-display text-base font-bold text-[#111827]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#5F6368] line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#5F6368]" />
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: POINT BUSES (1-5) */}
      {activeSubTab === 'POINT_BUSES' && (
        <div className="space-y-4">
          {/* Transport Office Banner */}
          <div className="rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-[#FCE8E6] px-3 py-1 text-[11px] font-semibold text-[#B3261E]">
                  Transport Office • Next to Boys Hostel
                </span>
                <h2 className="mt-2 font-display text-xl font-bold text-[#111827]">
                  BBS-UTECH Official 7-Route Bus Fleet
                </h2>
                <p className="mt-0.5 text-xs text-[#5F6368]">
                  Transport Office • Points 01–05, Hino (GS-9526) &amp; Coaster (GSF-325) • In-Charge: 0304-3482840
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-4 py-2 font-mono text-xs font-bold text-[#137333]">
                  <Clock className="h-4 w-4" />
                  <span>In 08:25 AM • Out 03:30 PM</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLocatePinById('campus_transport_office')}
                  className="flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-4 py-2 font-display text-xs font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Map Pin</span>
                </button>
              </div>
            </div>

            {/* City Search + 7-Bus Filter Pills */}
            <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_1.15fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B57D0]" />
                <input
                  type="text"
                  value={busQuery}
                  onChange={(e) => setBusQuery(e.target.value)}
                  placeholder="Search city or stop (Sukkur, Gambat, Chondko, Sobhodero, Thari Mirwah...)"
                  className="w-full rounded-full border border-[#DCE2EC] bg-[#F8FAFC] py-2.5 pl-10 pr-9 text-xs text-[#111827] placeholder-[#747775] outline-none focus:border-[#0B57D0] focus:bg-[#FFFFFF]"
                />
                {busQuery && (
                  <button
                    type="button"
                    onClick={() => setBusQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#111827] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectBusPoint(null)}
                  className={`rounded-full px-3.5 py-2 font-display text-xs font-semibold cursor-pointer ${
                    selectedBusPoint === null
                      ? 'bg-[#0B57D0] text-white'
                      : 'bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0]'
                  }`}
                >
                  All 7
                </button>
                {BUS_POINT_ROUTES.map((route) => {
                  const pt = route.pointNumber;
                  const active = selectedBusPoint === pt;
                  const chipLabel =
                    pt <= 5 ? `Bus 0${pt}` : pt === 6 ? 'Hino' : 'Coaster';
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => onSelectBusPoint(active ? null : pt)}
                      className={`rounded-full px-3.5 py-2 font-display text-xs font-semibold cursor-pointer ${
                        active
                          ? 'bg-[#E6F4EA] text-[#137333] border border-[#0F9D58]'
                          : 'bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0]'
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
                  defaultExpanded={
                    filteredBusRoutes.length === 1 ||
                    busQuery.trim().length > 0 ||
                    route.pointNumber === 1 ||
                    route.pointNumber === 3
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FACULTY */}
      {activeSubTab === 'FACULTY' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B57D0]" />
            <input
              type="text"
              value={facultyQuery}
              onChange={(e) => setFacultyQuery(e.target.value)}
              placeholder="Search professor, chairman, or department..."
              className="w-full rounded-full border border-[#DCE2EC] bg-[#FFFFFF] py-3 pl-11 pr-10 text-sm text-[#111827] placeholder-[#747775] shadow-xs outline-none focus:border-[#0B57D0]"
            />
            {facultyQuery && (
              <button
                type="button"
                onClick={() => setFacultyQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5F6368] hover:text-[#111827] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="font-display text-xs font-bold uppercase tracking-wider text-[#0B57D0]">
            Faculty Directory ({filteredFaculty.length})
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredFaculty.map((member) => (
              <div
                key={member.id}
                className="rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F0FE] text-[#0B57D0]">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#111827]">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#5F6368]">
                      {member.designation} • {member.department}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#444746]">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#0F9D58]" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-[#0B57D0]" />
                    {member.phoneExt}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#EFF3F8] px-3.5 py-2.5">
                  <span className="truncate text-xs font-medium text-[#111827]">
                    {member.roomName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLocatePinById(member.officePinId)}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[#0B57D0] px-3 py-1 font-display text-[11px] font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
                  >
                    <Layers className="h-3 w-3" />
                    <span>Locate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: NOTICES */}
      {activeSubTab === 'NOTICES' && (
        <div className="grid gap-4 md:grid-cols-2">
          {CAMPUS_NOTICES.map((notice) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => setModalNotice(notice)}
              className={`rounded-[24px] border p-5 text-left transition hover:shadow-md cursor-pointer ${
                notice.isHighPriority
                  ? 'border-[#F2B8B5] bg-[#FCE8E6]/60'
                  : 'border-[#E2E8F0] bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-3 py-0.5 text-[11px] font-semibold ${
                    notice.isHighPriority
                      ? 'bg-[#B3261E] text-white'
                      : 'bg-[#E6F4EA] text-[#137333]'
                  }`}
                >
                  {notice.isHighPriority ? 'Priority Notice' : notice.category}
                </span>
                <span className="font-mono text-xs text-[#5F6368]">
                  {notice.date}
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-[#111827]">
                {notice.title}
              </h3>
              <p className="mt-1.5 text-xs text-[#444746] leading-relaxed">
                {notice.summary}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Academic Resource Detail Modal */}
      {modalResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-xs p-4"
          onClick={() => setModalResource(null)}
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-block rounded-full bg-[#E8F0FE] px-3 py-1 text-[11px] font-semibold text-[#0B57D0]">
              {modalResource.category}
            </span>
            <h3 className="mt-3 font-display text-xl font-bold text-[#111827]">
              {modalResource.title}
            </h3>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#444746] max-h-72 overflow-y-auto">
              {modalResource.details}
            </pre>
            <div className="mt-6 flex justify-end gap-2">
              {modalResource.externalUrl && (
                <a
                  href={modalResource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#0B57D0] px-5 py-2.5 font-display text-xs font-semibold text-white hover:bg-[#0842A0]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{modalResource.actionText}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setModalResource(null)}
                className="rounded-full bg-[#EFF3F8] px-5 py-2.5 font-display text-xs font-semibold text-[#111827] hover:bg-[#E2E8F0] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {modalNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-xs p-4"
          onClick={() => setModalNotice(null)}
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  modalNotice.isHighPriority
                    ? 'bg-[#FCE8E6] text-[#B3261E]'
                    : 'bg-[#E6F4EA] text-[#137333]'
                }`}
              >
                {modalNotice.category}
              </span>
              <span className="font-mono text-xs text-[#5F6368]">
                {modalNotice.date}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-[#111827]">
              {modalNotice.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#444746]">
              {modalNotice.summary}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalNotice(null)}
                className="rounded-full bg-[#0B57D0] px-5 py-2.5 font-display text-xs font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
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

  return (
    <div
      className={`rounded-[24px] border bg-[#FFFFFF] p-5 shadow-xs ${
        expanded ? 'border-[#0B57D0]/50' : 'border-[#E2E8F0]'
      }`}
    >
      <div
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#0B57D0] px-3 py-1 font-mono text-xs font-bold text-white">
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
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF3F8] text-[#0B57D0] cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <h3 className="mt-2.5 font-display text-lg font-bold text-[#111827]">
        {route.busTitle}
      </h3>
      <p className="mt-0.5 text-xs text-[#5F6368]">{route.corridorSummary}</p>

      {/* Starts / Arrival / Return */}
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#EFF3F8] p-3.5">
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

          <div className="space-y-1.5">
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

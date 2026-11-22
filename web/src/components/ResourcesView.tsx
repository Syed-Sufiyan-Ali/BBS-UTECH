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
  { key: 'ACADEMIC_HUB', label: 'ACADEMIC HUB' },
  { key: 'POINT_BUSES', label: 'POINT BUSES (1–5)' },
  { key: 'FACULTY', label: 'FACULTY' },
  { key: 'NOTICES', label: 'NOTICES' },
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
      <div className="border border-[#282C38] bg-[#0D0E12] p-5 cut-corner">
        <h1 className="font-display text-xl font-bold tracking-wider text-[#F8FAFC]">
          BBSUTSD // CAMPUS HUB
        </h1>
        <p className="mt-0.5 font-mono text-[11px] font-bold text-[#39FF14]">
          5-POINT BUSES • PORTALS • FACULTY DIRECTORY • BULLETINS
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUB_TABS.map((tab) => {
            const active = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeSubTab(tab.key)}
                className={`border px-4 py-2 font-display text-xs font-bold tracking-wider transition cursor-pointer cut-corner-sm ${
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
                className="flex items-center justify-between gap-4 border border-[#282C38] bg-[#0D0E12] p-5 text-left transition hover:border-[#FF1E2D] cursor-pointer cut-corner"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border cut-corner-sm ${
                      isTransport
                        ? 'border-[#39FF14]/60 bg-[#0B2407] text-[#39FF14]'
                        : 'border-[#FF1E2D]/60 bg-[#26080D] text-[#FF1E2D]'
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
                      className={`inline-block border border-[#282C38] bg-[#15171E] px-2 py-0.5 font-mono text-[10px] font-bold ${
                        isTransport ? 'text-[#39FF14]' : 'text-[#FF1E2D]'
                      }`}
                    >
                      {item.category.toUpperCase()}
                    </span>
                    <h3 className="mt-1.5 font-display text-base font-bold text-[#F8FAFC]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#A1A7B3] line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-[#A1A7B3]" />
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: POINT BUSES (1-5) */}
      {activeSubTab === 'POINT_BUSES' && (
        <div className="space-y-4">
          {/* Transport Office Banner */}
          <div className="border border-[#FF1E2D]/70 border-l-4 border-l-[#FF1E2D] bg-[#0D0E12] p-5 cut-corner">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-block border border-[#FF1E2D] bg-[#26080D] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#FF1E2D]">
                  TRANSPORT OFFICE // NEXT TO BOYS HOSTEL
                </span>
                <h2 className="mt-2 font-display text-lg font-bold text-[#F8FAFC]">
                  BBSUTSD 5-POINT BUS FLEET
                </h2>
                <p className="mt-0.5 text-xs text-[#A1A7B3]">
                  In-Charge: Engr. Sameeullah Khan / Imran Gilal • Contact: 0304-3482840
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 border border-[#39FF14]/60 bg-[#0B2407] px-3.5 py-2.5 font-mono text-xs font-bold text-[#39FF14] cut-corner-sm">
                  <Clock className="h-4 w-4" />
                  <span>IN 08:25 AM • OUT 03:30 PM</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLocatePinById('campus_transport_office')}
                  className="flex items-center gap-1.5 border border-[#39FF14] bg-[#050507] px-3.5 py-2.5 font-mono text-xs font-bold text-[#39FF14] hover:bg-[#0B2407] cursor-pointer cut-corner-sm"
                >
                  <MapPin className="h-4 w-4" />
                  <span>MAP PIN</span>
                </button>
              </div>
            </div>

            {/* City Search + Point 1-5 Filter Chips */}
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF1E2D]" />
                <input
                  type="text"
                  value={busQuery}
                  onChange={(e) => setBusQuery(e.target.value)}
                  placeholder="Search city or stop (Sukkur, Gambat, Hingorja, Pir Jo Goth, Rohri...)"
                  className="w-full border border-[#282C38] bg-[#15171E] py-2.5 pl-10 pr-9 text-xs text-[#F8FAFC] placeholder-[#687080] outline-none focus:border-[#FF1E2D] cut-corner-sm"
                />
                {busQuery && (
                  <button
                    type="button"
                    onClick={() => setBusQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A7B3] hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectBusPoint(null)}
                  className={`border px-3 py-2 font-mono text-[11px] font-bold cursor-pointer cut-corner-sm ${
                    selectedBusPoint === null
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:text-white'
                  }`}
                >
                  ALL 5
                </button>
                {[1, 2, 3, 4, 5].map((pt) => {
                  const active = selectedBusPoint === pt;
                  return (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => onSelectBusPoint(active ? null : pt)}
                      className={`border px-3 py-2 font-mono text-[11px] font-bold cursor-pointer cut-corner-sm ${
                        active
                          ? 'border-[#39FF14] bg-[#39FF14] text-[#050507]'
                          : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                      }`}
                    >
                      POINT {pt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredBusRoutes.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-[#282C38] bg-[#0D0E12] p-10 text-center cut-corner">
              <Bus className="h-10 w-10 text-[#FF1E2D]/70" />
              <div className="mt-3 font-display text-sm font-bold text-[#F8FAFC]">
                NO POINT ROUTE MATCHES &ldquo;{busQuery}&rdquo;
              </div>
              <p className="mt-1 text-xs text-[#A1A7B3]">
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
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF1E2D]" />
            <input
              type="text"
              value={facultyQuery}
              onChange={(e) => setFacultyQuery(e.target.value)}
              placeholder="Search professor, chairman, or department..."
              className="w-full border border-[#282C38] bg-[#0D0E12] py-3 pl-10 pr-10 text-sm text-[#F8FAFC] placeholder-[#687080] outline-none focus:border-[#FF1E2D] cut-corner-sm"
            />
            {facultyQuery && (
              <button
                type="button"
                onClick={() => setFacultyQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A7B3] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="font-mono text-xs font-bold text-[#39FF14]">
            FACULTY DIRECTORY ({filteredFaculty.length})
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredFaculty.map((member) => (
              <div
                key={member.id}
                className="border border-[#282C38] bg-[#0D0E12] p-5 cut-corner"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#FF1E2D]/60 bg-[#26080D] text-[#FF1E2D] cut-corner-sm">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#F8FAFC]">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#A1A7B3]">
                      {member.designation} • {member.department}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#F8FAFC]/90">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#39FF14]" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="h-3.5 w-3.5 text-[#FF1E2D]" />
                    {member.phoneExt}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border border-[#282C38] bg-[#15171E] px-3 py-2 cut-corner-sm">
                  <span className="truncate text-xs text-[#F8FAFC]">
                    {member.roomName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLocatePinById(member.officePinId)}
                    className="flex shrink-0 items-center gap-1 bg-[#FF1E2D] px-2.5 py-1 font-mono text-[10px] font-bold text-white hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
                  >
                    <Layers className="h-3 w-3" />
                    <span>LOCATE</span>
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
              className={`border p-5 text-left transition hover:brightness-110 cursor-pointer cut-corner ${
                notice.isHighPriority
                  ? 'border-[#FF1E2D] bg-[#26080D]'
                  : 'border-[#282C38] bg-[#0D0E12]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                    notice.isHighPriority
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                  }`}
                >
                  {notice.isHighPriority ? 'URGENT NOTICE' : notice.category.toUpperCase()}
                </span>
                <span className="font-mono text-[11px] text-[#A1A7B3]">
                  {notice.date}
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-[#F8FAFC]">
                {notice.title}
              </h3>
              <p className="mt-1.5 text-xs text-[#A1A7B3] leading-relaxed">
                {notice.summary}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Academic Resource Detail Modal */}
      {modalResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setModalResource(null)}
        >
          <div
            className="w-full max-w-lg border border-[#282C38] border-t-2 border-t-[#FF1E2D] bg-[#0D0E12] p-6 cut-corner"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="inline-block border border-[#FF1E2D] bg-[#26080D] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#FF1E2D]">
              {modalResource.category.toUpperCase()}
            </span>
            <h3 className="mt-3 font-display text-xl font-bold text-[#F8FAFC]">
              {modalResource.title}
            </h3>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#F8FAFC]/90 max-h-72 overflow-y-auto">
              {modalResource.details}
            </pre>
            <div className="mt-6 flex justify-end gap-2">
              {modalResource.externalUrl && (
                <a
                  href={modalResource.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-[#FF1E2D] px-4 py-2 font-display text-xs font-bold text-white hover:bg-[#FF3B47] cut-corner-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{modalResource.actionText.toUpperCase()}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setModalResource(null)}
                className="border border-[#282C38] bg-[#15171E] px-4 py-2 font-mono text-xs font-bold text-[#39FF14] hover:border-[#39FF14] cursor-pointer cut-corner-sm"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Detail Modal */}
      {modalNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setModalNotice(null)}
        >
          <div
            className="w-full max-w-lg border border-[#282C38] border-t-2 border-t-[#FF1E2D] bg-[#0D0E12] p-6 cut-corner"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span
                className={`border px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                  modalNotice.isHighPriority
                    ? 'border-[#FF1E2D] bg-[#26080D] text-[#FF1E2D]'
                    : 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                }`}
              >
                {modalNotice.category.toUpperCase()}
              </span>
              <span className="font-mono text-xs text-[#A1A7B3]">
                {modalNotice.date}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-[#F8FAFC]">
              {modalNotice.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#F8FAFC]/90">
              {modalNotice.summary}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalNotice(null)}
                className="bg-[#FF1E2D] px-5 py-2 font-display text-xs font-bold text-white hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
              >
                UNDERSTOOD
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
      className={`border bg-[#0D0E12] p-5 cut-corner ${
        expanded ? 'border-[#FF1E2D]/70' : 'border-[#282C38]'
      }`}
    >
      <div
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[#FF1E2D] px-2.5 py-1 font-mono text-xs font-bold text-white">
            POINT 0{route.pointNumber}
          </span>
          <span className="border border-[#39FF14]/60 bg-[#0B2407] px-2.5 py-1 font-mono text-[11px] font-bold text-[#39FF14]">
            {route.busNumber}
          </span>
        </div>

        <button
          type="button"
          aria-label={expanded ? 'Collapse bus route' : 'Expand bus route'}
          className="text-[#39FF14] cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      <h3 className="mt-2.5 font-display text-lg font-bold text-[#F8FAFC]">
        {route.busTitle}
      </h3>
      <p className="mt-0.5 text-xs text-[#A1A7B3]">{route.corridorSummary}</p>

      {/* Starts / Arrival / Return */}
      <div className="mt-3 grid grid-cols-3 gap-2 border border-[#282C38] bg-[#15171E] p-3 cut-corner-sm">
        <div>
          <div className="font-mono text-[9.5px] font-bold text-[#687080]">STARTS</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#F8FAFC]">
            {route.morningStartTime}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9.5px] font-bold text-[#687080]">ARRIVAL</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#39FF14]">
            {route.campusArrivalTime}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9.5px] font-bold text-[#687080]">RETURN</div>
          <div className="font-mono text-xs sm:text-sm font-bold text-[#FF1E2D]">
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
              className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${
                matched
                  ? 'border-[#39FF14] bg-[#0B2407] text-[#39FF14]'
                  : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
              }`}
            >
              {city.toUpperCase()}
            </span>
          );
        })}
      </div>

      {/* Stops Timeline */}
      {expanded && (
        <div className="mt-4 border-t border-[#282C38] pt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] font-bold">
            <span className="text-[#FF1E2D]">
              STOPS TIMELINE ({route.stops.length})
            </span>
            <span className="text-[#39FF14]">
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
                  className={`flex items-center justify-between gap-3 px-2.5 py-2 cut-corner-sm ${
                    isMatched ? 'bg-[#0B2407] border border-[#39FF14]/50' : 'bg-[#15171E]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[10px] font-bold ${
                        isFirst
                          ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                          : isLast
                          ? 'border-[#39FF14] bg-[#39FF14] text-[#050507]'
                          : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#F8FAFC]">
                        {stop.stopName}
                      </div>
                      <div className="truncate text-[11px] text-[#A1A7B3]">
                        {stop.note ? `${stop.cityArea} • ${stop.note}` : stop.cityArea}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`flex shrink-0 items-center gap-1 border px-2 py-1 font-mono text-[10.5px] font-bold ${
                      isLast
                        ? 'border-[#39FF14]/70 bg-[#0B2407] text-[#39FF14]'
                        : 'border-[#282C38] bg-[#15171E] text-[#F8FAFC]'
                    }`}
                  >
                    <Clock className="h-3 w-3 text-[#FF1E2D]" />
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

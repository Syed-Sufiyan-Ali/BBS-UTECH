import { useMemo, useState } from 'react';
import {
  Building2,
  Bus,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Megaphone,
  Navigation,
  Search,
  X,
} from 'lucide-react';
import {
  BUILDINGS,
  CAMPUS_NOTICES,
  CAMPUS_PINS,
  FLOORS,
  FRESHMAN_GUIDES,
} from '../data/campusData';
import type {
  AppTab,
  BuildingKey,
  CampusPin,
  ClassScheduleItem,
  UserLocation,
} from '../types/campus';
import { searchPins } from '../utils/geo';

interface HomeViewProps {
  userLocation: UserLocation | null;
  nextClass: ClassScheduleItem | null;
  savedDept: string;
  savedSem: number;
  savedSec: string;
  onNavigateTab: (tab: AppTab) => void;
  onSelectPin: (pin: CampusPin) => void;
  onLocatePinIndoor: (pin: CampusPin) => void;
  onLocatePinById: (pinId: string) => void;
  onOpenIndoorBuilding: (building: BuildingKey) => void;
  onOpenBusTimings: () => void;
  onOpenNotices: () => void;
}

export function HomeView({
  userLocation,
  nextClass,
  savedDept,
  savedSem,
  savedSec,
  onNavigateTab,
  onSelectPin,
  onLocatePinIndoor,
  onLocatePinById,
  onOpenIndoorBuilding,
  onOpenBusTimings,
  onOpenNotices,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuide, setExpandedGuide] = useState<number | null>(0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchPins(CAMPUS_PINS, searchQuery);
  }, [searchQuery]);

  return (
    <div className="space-y-8 pb-24 lg:pb-12">
      {/* Hero Command Header */}
      <section className="relative overflow-hidden border border-[#282C38] bg-gradient-to-br from-[#050507] via-[#140609] to-[#0D0E12] p-6 sm:p-8 cut-corner">
        <div className="absolute top-0 left-0 h-1 w-2/5 bg-[#FF1E2D]" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-block border border-[#FF1E2D] bg-[#26080D] px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[#FF1E2D]">
              BBSUTSD // KHAIRPUR MIRS
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-wide text-[#F8FAFC]">
              WELCOME, ENGINEER
            </h1>
            <p className="text-sm sm:text-base text-[#A1A7B3]">
              Live campus GPS radar, Old &amp; New Complex blueprints, department labs,
              class timetables, and 5-Point bus schedules — unified in one tactical hub.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="flex h-16 w-16 items-center justify-center border-2 border-[#39FF14] bg-[#15171E] cut-corner-sm shadow-[0_0_25px_rgba(57,255,20,0.18)]">
              <GraduationCap className="h-8 w-8 text-[#39FF14]" />
            </div>
            <div className="font-mono text-xs">
              <div className="text-[#39FF14] font-bold">{CAMPUS_PINS.length} VERIFIED PINS</div>
              <div className="text-[#A1A7B3]">5 BUS POINTS ACTIVE</div>
              <div className="text-[#FF1E2D] font-bold">27.5108° N, 68.7416° E</div>
            </div>
          </div>
        </div>

        {/* Instant Search + GPS Telemetry */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#FF1E2D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search VC Office, Labs, Workshops, Canteen, Transport, Bus Point..."
              className="w-full border border-[#282C38] bg-[#15171E] py-3 pl-10 pr-10 text-sm text-[#F8FAFC] placeholder-[#687080] outline-none transition focus:border-[#FF1E2D] cut-corner-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A7B3] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('OUTDOOR_MAP')}
            className="flex items-center justify-between border border-[#39FF14]/55 bg-[#0B2407] px-4 py-3 text-left transition hover:border-[#39FF14] cursor-pointer cut-corner-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass className="h-4 w-4 shrink-0 text-[#39FF14]" />
              <span className="truncate font-mono text-xs text-[#F8FAFC]">
                GPS // {userLocation?.label ?? 'SCANNING SATELLITES...'}
              </span>
            </div>
            <span className="ml-2 shrink-0 font-mono text-xs font-bold text-[#39FF14]">
              OPEN MAP →
            </span>
          </button>
        </div>
      </section>

      {/* Live Search Results */}
      {searchQuery.trim() && (
        <section className="space-y-3">
          <div className="font-mono text-xs font-bold text-[#39FF14]">
            MATCHING LANDMARKS ({searchResults.length})
          </div>
          {searchResults.length === 0 ? (
            <div className="border border-[#282C38] bg-[#0D0E12] p-6 text-sm text-[#A1A7B3] cut-corner-sm">
              No campus pin matches &ldquo;{searchQuery}&rdquo;. Try searching VC Office,
              Civil Lab, CS Lab, Library, Canteen, or Transport Office.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.map((pin) => (
                <div
                  key={pin.id}
                  onClick={() => onSelectPin(pin)}
                  className="flex items-center justify-between gap-3 border border-[#282C38] bg-[#0D0E12] p-4 transition hover:border-[#FF1E2D] cursor-pointer cut-corner-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 border border-[#FF1E2D]/60 bg-[#26080D] px-2 py-1 font-mono text-[10px] font-bold text-[#FF1E2D]">
                      {pin.roomNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold text-[#F8FAFC]">
                        {pin.name}
                      </div>
                      <div className="truncate text-xs text-[#A1A7B3]">
                        {BUILDINGS[pin.building].shortName} • {FLOORS[pin.floor].displayName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocatePinIndoor(pin);
                    }}
                    title="Locate Pin"
                    className="shrink-0 border border-[#282C38] bg-[#15171E] p-2 text-[#39FF14] hover:border-[#39FF14] cursor-pointer"
                  >
                    <Layers className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Next Session + Quick Launch Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Next Class Card */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 bg-[#FF1E2D]" />
              <h2 className="font-display text-sm font-bold tracking-widest text-[#F8FAFC]">
                NEXT SESSION
              </h2>
            </div>
            <span className="border border-[#282C38] bg-[#15171E] px-2.5 py-1 font-mono text-[10px] font-bold text-[#39FF14]">
              {savedDept} • S{savedSem}-{savedSec}
            </span>
          </div>

          {nextClass ? (
            <div className="relative border border-[#282C38] border-l-4 border-l-[#FF1E2D] bg-[#0D0E12] p-5 cut-corner">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                    nextClass.isLab
                      ? 'border-[#39FF14]/60 bg-[#0B2407] text-[#39FF14]'
                      : 'border-[#FF1E2D]/60 bg-[#26080D] text-[#FF1E2D]'
                  }`}
                >
                  {nextClass.subjectCode}
                  {nextClass.isLab ? ' // LAB' : ''}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#F8FAFC]">
                  <Clock className="h-3.5 w-3.5 text-[#39FF14]" />
                  {nextClass.timeSlot}
                </span>
              </div>

              <h3 className="mt-3 font-display text-xl font-bold text-[#F8FAFC]">
                {nextClass.subjectTitle}
              </h3>
              <p className="mt-1 text-xs text-[#A1A7B3]">
                Instructor // {nextClass.instructor}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-[#282C38] bg-[#15171E] px-3.5 py-2.5 cut-corner-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
                  <MapPin className="h-4 w-4 text-[#39FF14]" />
                  <span>{nextClass.roomLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLocatePinById(nextClass.locationPinId)}
                  className="flex items-center gap-1.5 bg-[#FF1E2D] px-3 py-1.5 font-display text-xs font-bold text-white transition hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>ROUTE</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#39FF14]/45 bg-[#0D0E12] p-6 cut-corner">
              <div className="font-display text-base font-bold text-[#F8FAFC]">
                ALL SESSIONS CLEARED
              </div>
              <p className="mt-1 text-xs text-[#A1A7B3]">
                Head to the Central Digital Library or inspect engineering workshops.
              </p>
            </div>
          )}
        </section>

        {/* Quick Launch 2x2 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 bg-[#39FF14]" />
            <h2 className="font-display text-sm font-bold tracking-widest text-[#F8FAFC]">
              QUICK LAUNCH
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <QuickLaunchCard
              code="01"
              title="OLD BUILDING"
              subtitle="VC, Exam, Registrar & Finance"
              accent="red"
              icon={<Building2 className="h-5 w-5 text-[#FF1E2D]" />}
              onClick={() => onOpenIndoorBuilding('OLD_BUILDING')}
            />
            <QuickLaunchCard
              code="02"
              title="NEW COMPLEX"
              subtitle="CS/AI Labs, Library & Auditorium"
              accent="green"
              icon={<Layers className="h-5 w-5 text-[#39FF14]" />}
              onClick={() => onOpenIndoorBuilding('NEW_BUILDING')}
            />
            <QuickLaunchCard
              code="03"
              title="CAMPUS GPS"
              subtitle="Complexes, pins & live radar"
              accent="green"
              icon={<Navigation className="h-5 w-5 text-[#39FF14]" />}
              onClick={() => onNavigateTab('OUTDOOR_MAP')}
            />
            <QuickLaunchCard
              code="04"
              title="BUS POINTS"
              subtitle="Point 1–5 cities & timings"
              accent="red"
              icon={<Bus className="h-5 w-5 text-[#FF1E2D]" />}
              onClick={onOpenBusTimings}
            />
          </div>
        </section>
      </div>

      {/* Freshmen 101 + Bulletins */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Freshmen 101 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#39FF14]" />
            <h2 className="font-display text-sm font-bold tracking-widest text-[#F8FAFC]">
              FRESHMEN 101 // ONBOARDING
            </h2>
          </div>

          <div className="space-y-2.5">
            {FRESHMAN_GUIDES.map((item, idx) => {
              const isOpen = expandedGuide === idx;
              return (
                <div
                  key={item.title}
                  className={`border bg-[#0D0E12] transition cut-corner-sm ${
                    isOpen ? 'border-[#39FF14]/70' : 'border-[#282C38]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGuide(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
                  >
                    <div>
                      <div
                        className={`font-mono text-xs font-bold ${
                          isOpen ? 'text-[#39FF14]' : 'text-[#F8FAFC]'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-[#A1A7B3]">{item.location}</div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#39FF14]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#A1A7B3]" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#282C38] px-4 py-3 text-xs leading-relaxed text-[#F8FAFC]/85">
                      {item.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Live Bulletins */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#FF1E2D]" />
              <h2 className="font-display text-sm font-bold tracking-widest text-[#F8FAFC]">
                LIVE BULLETINS
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenNotices}
              className="font-mono text-xs font-bold text-[#39FF14] hover:underline cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>

          <div className="space-y-3">
            {CAMPUS_NOTICES.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={onOpenNotices}
                className={`w-full border p-4 text-left transition hover:brightness-110 cursor-pointer cut-corner-sm ${
                  notice.isHighPriority
                    ? 'border-[#FF1E2D]/70 bg-[#26080D]'
                    : 'border-[#282C38] bg-[#0D0E12]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span
                    className={`font-bold ${
                      notice.isHighPriority ? 'text-[#FF1E2D]' : 'text-[#39FF14]'
                    }`}
                  >
                    {notice.isHighPriority
                      ? `URGENT // ${notice.category.toUpperCase()}`
                      : notice.category.toUpperCase()}
                  </span>
                  <span className="text-[#A1A7B3]">{notice.date}</span>
                </div>
                <h3 className="mt-1.5 font-display text-sm font-bold text-[#F8FAFC]">
                  {notice.title}
                </h3>
                <p className="mt-1 text-xs text-[#A1A7B3] line-clamp-2">
                  {notice.summary}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickLaunchCard({
  code,
  title,
  subtitle,
  accent,
  icon,
  onClick,
}: {
  code: string;
  title: string;
  subtitle: string;
  accent: 'red' | 'green';
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group border border-[#282C38] bg-[#0D0E12] p-4 text-left transition hover:border-[#FF1E2D] cursor-pointer cut-corner"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center border bg-[#15171E] cut-corner-sm ${
            accent === 'red' ? 'border-[#FF1E2D]/60' : 'border-[#39FF14]/60'
          }`}
        >
          {icon}
        </div>
        <span
          className={`font-mono text-xs font-bold ${
            accent === 'red' ? 'text-[#FF1E2D]' : 'text-[#39FF14]'
          }`}
        >
          {code}
        </span>
      </div>
      <div className="mt-4 font-display text-sm font-bold tracking-wide text-[#F8FAFC] group-hover:text-white">
        {title}
      </div>
      <div className="mt-0.5 text-xs text-[#A1A7B3]">{subtitle}</div>
    </button>
  );
}

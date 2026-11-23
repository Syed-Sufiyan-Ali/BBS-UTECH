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
  Sparkles,
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

  const todayDateLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-7 pb-24 lg:pb-12">
      {/* Pixel "At a Glance" University Card */}
      <section className="relative overflow-hidden rounded-[28px] border border-[#E2E8F0] bg-gradient-to-br from-[#FFFFFF] via-[#F8FAFF] to-[#EEF4FF] p-6 sm:p-8 shadow-[0_2px_16px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-semibold text-[#0B57D0]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{todayDateLabel} • BBS-UTECH Khairpur Mirs</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#111827]">
              Good to see you, Engineer
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#444746]">
              Walkable campus turn-by-turn directions, Old &amp; New Complex floor blueprints,
              department labs, timetables, and 5-Point city buses in one clean workspace.
            </p>
          </div>

          <div className="flex items-center gap-3.5 self-start lg:self-center rounded-2xl border border-[#DCE2EC] bg-[#FFFFFF]/90 px-4 py-3 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D3E3FD] text-[#0B57D0]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="text-xs leading-5">
              <div className="font-display font-bold text-[#111827]">
                {CAMPUS_PINS.length} Campus Pins
              </div>
              <div className="text-[#137333] font-semibold">5 Bus Points Active</div>
              <div className="font-mono text-[11px] text-[#5F6368]">27.5108° N, 68.7416° E</div>
            </div>
          </div>
        </div>

        {/* Pixel Pill Search + Live GPS Pill */}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0B57D0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search VC Office, Labs, Workshops, Canteen, Transport, Bus Point..."
              className="w-full rounded-full border border-[#DCE2EC] bg-[#FFFFFF] py-3.5 pl-11 pr-11 text-sm text-[#111827] placeholder-[#747775] shadow-xs outline-none transition focus:border-[#0B57D0] focus:ring-2 focus:ring-[#D3E3FD]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#EFF3F8] text-[#444746] hover:bg-[#E2E8F0] hover:text-[#111827] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('OUTDOOR_MAP')}
            className="flex items-center justify-between rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-5 py-3.5 text-left transition hover:bg-[#D7EFE0] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass className="h-4 w-4 shrink-0 text-[#137333]" />
              <span className="truncate text-xs font-semibold text-[#111827]">
                {userLocation?.label ?? 'Locating campus anchor...'}
              </span>
            </div>
            <span className="ml-3 shrink-0 font-display text-xs font-bold text-[#137333]">
              Open Map →
            </span>
          </button>
        </div>
      </section>

      {/* Live Search Results */}
      {searchQuery.trim() && (
        <section className="space-y-3">
          <div className="font-display text-xs font-bold uppercase tracking-wider text-[#0B57D0]">
            Matching Landmarks ({searchResults.length})
          </div>
          {searchResults.length === 0 ? (
            <div className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 text-sm text-[#5F6368]">
              No campus pin matches &ldquo;{searchQuery}&rdquo;. Try searching VC Office,
              Civil Lab, CS Lab, Library, Canteen, or Transport Office.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.map((pin) => (
                <div
                  key={pin.id}
                  onClick={() => onSelectPin(pin)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-4 shadow-xs transition hover:border-[#0B57D0] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 rounded-full bg-[#E8F0FE] px-2.5 py-1 font-mono text-[11px] font-bold text-[#0B57D0]">
                      {pin.roomNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-bold text-[#111827]">
                        {pin.name}
                      </div>
                      <div className="truncate text-xs text-[#5F6368]">
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF3F8] text-[#0B57D0] transition hover:bg-[#D3E3FD] cursor-pointer"
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
            <h2 className="font-display text-sm font-bold tracking-tight text-[#111827]">
              Next Session
            </h2>
            <span className="rounded-full bg-[#EFF3F8] px-3 py-1 font-mono text-[11px] font-semibold text-[#444746]">
              {savedDept} • S{savedSem}-{savedSec}
            </span>
          </div>

          {nextClass ? (
            <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold ${
                    nextClass.isLab
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : 'bg-[#E8F0FE] text-[#0B57D0]'
                  }`}
                >
                  {nextClass.subjectCode}
                  {nextClass.isLab ? ' • Lab' : ''}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#444746]">
                  <Clock className="h-3.5 w-3.5 text-[#0B57D0]" />
                  {nextClass.timeSlot}
                </span>
              </div>

              <h3 className="mt-3 font-display text-xl font-bold text-[#111827]">
                {nextClass.subjectTitle}
              </h3>
              <p className="mt-1 text-xs text-[#5F6368]">
                Instructor: {nextClass.instructor}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EFF3F8] px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                  <MapPin className="h-4 w-4 text-[#0B57D0]" />
                  <span>{nextClass.roomLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLocatePinById(nextClass.locationPinId)}
                  className="flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-4 py-1.5 font-display text-xs font-semibold text-white transition hover:bg-[#0842A0] cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Locate</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-[#CBE6D3] bg-[#E6F4EA]/70 p-6">
              <div className="font-display text-base font-bold text-[#137333]">
                All sessions completed for today
              </div>
              <p className="mt-1 text-xs text-[#1E4620]">
                Visit the Central Digital Library or explore campus labs on the map.
              </p>
            </div>
          )}
        </section>

        {/* Quick Launch 2x2 */}
        <section className="space-y-3">
          <h2 className="font-display text-sm font-bold tracking-tight text-[#111827]">
            Quick Access
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <QuickLaunchCard
              badge="Old Complex"
              title="Old Building"
              subtitle="VC, Exam, Registrar & Finance"
              tone="crimson"
              icon={<Building2 className="h-5 w-5" />}
              onClick={() => onOpenIndoorBuilding('OLD_BUILDING')}
            />
            <QuickLaunchCard
              badge="New Complex"
              title="New Building"
              subtitle="CS/AI Labs, Library & Auditorium"
              tone="blue"
              icon={<Layers className="h-5 w-5" />}
              onClick={() => onOpenIndoorBuilding('NEW_BUILDING')}
            />
            <QuickLaunchCard
              badge="Directions"
              title="Campus GPS"
              subtitle="Walkable turn-by-turn routes"
              tone="emerald"
              icon={<Navigation className="h-5 w-5" />}
              onClick={() => onNavigateTab('OUTDOOR_MAP')}
            />
            <QuickLaunchCard
              badge="Transit"
              title="Bus Points 1–5"
              subtitle="City stops & morning timings"
              tone="blue"
              icon={<Bus className="h-5 w-5" />}
              onClick={onOpenBusTimings}
            />
          </div>
        </section>
      </div>

      {/* Freshmen 101 + Notices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Freshmen 101 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#0B57D0]" />
            <h2 className="font-display text-sm font-bold tracking-tight text-[#111827]">
              Freshmen Onboarding Guide
            </h2>
          </div>

          <div className="space-y-2.5">
            {FRESHMAN_GUIDES.map((item, idx) => {
              const isOpen = expandedGuide === idx;
              return (
                <div
                  key={item.title}
                  className={`rounded-2xl border bg-[#FFFFFF] transition ${
                    isOpen ? 'border-[#0B57D0]/50 shadow-xs' : 'border-[#E2E8F0]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedGuide(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
                  >
                    <div>
                      <div
                        className={`font-display text-sm font-bold ${
                          isOpen ? 'text-[#0B57D0]' : 'text-[#111827]'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="mt-0.5 text-xs text-[#5F6368]">{item.location}</div>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFF3F8] text-[#444746]">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#0B57D0]" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#E2E8F0] px-4 py-3 text-xs leading-relaxed text-[#444746]">
                      {item.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Campus Notices */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#B3261E]" />
              <h2 className="font-display text-sm font-bold tracking-tight text-[#111827]">
                Campus Notices
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenNotices}
              className="rounded-full bg-[#E8F0FE] px-3 py-1 font-display text-xs font-semibold text-[#0B57D0] hover:bg-[#D3E3FD] cursor-pointer"
            >
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {CAMPUS_NOTICES.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={onOpenNotices}
                className={`w-full rounded-2xl border p-4 text-left transition hover:shadow-sm cursor-pointer ${
                  notice.isHighPriority
                    ? 'border-[#F2B8B5] bg-[#FCE8E6]/60'
                    : 'border-[#E2E8F0] bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-semibold ${
                      notice.isHighPriority
                        ? 'bg-[#B3261E] text-white'
                        : 'bg-[#E6F4EA] text-[#137333]'
                    }`}
                  >
                    {notice.isHighPriority
                      ? `Priority • ${notice.category}`
                      : notice.category}
                  </span>
                  <span className="font-mono text-[#5F6368]">{notice.date}</span>
                </div>
                <h3 className="mt-2 font-display text-sm font-bold text-[#111827]">
                  {notice.title}
                </h3>
                <p className="mt-1 text-xs text-[#444746] line-clamp-2">
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
  badge,
  title,
  subtitle,
  tone,
  icon,
  onClick,
}: {
  badge: string;
  title: string;
  subtitle: string;
  tone: 'blue' | 'emerald' | 'crimson';
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const iconTone =
    tone === 'crimson'
      ? 'bg-[#FCE8E6] text-[#B3261E]'
      : tone === 'emerald'
      ? 'bg-[#E6F4EA] text-[#137333]'
      : 'bg-[#E8F0FE] text-[#0B57D0]';

  const badgeTone =
    tone === 'crimson'
      ? 'text-[#B3261E]'
      : tone === 'emerald'
      ? 'text-[#137333]'
      : 'text-[#0B57D0]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[24px] border border-[#E2E8F0] bg-[#FFFFFF] p-4 text-left shadow-xs transition hover:border-[#0B57D0] hover:shadow-md cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconTone}`}>
          {icon}
        </div>
        <span className={`font-mono text-[10.5px] font-semibold ${badgeTone}`}>
          {badge}
        </span>
      </div>
      <div className="mt-4 font-display text-sm font-bold text-[#111827] group-hover:text-[#0B57D0]">
        {title}
      </div>
      <div className="mt-0.5 text-xs text-[#5F6368]">{subtitle}</div>
    </button>
  );
}

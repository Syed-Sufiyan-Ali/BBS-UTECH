import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Compass,
  GraduationCap,
  Map as MapIcon,
  MapPin,
  Navigation,
  Route,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  BUILDINGS,
  CAMPUS_PINS,
  FLOORS,
  SCHEDULE_DEPARTMENTS,
} from '../data/campusData';
import type {
  AppTab,
  CampusPin,
  ClassScheduleItem,
  UserLocation,
} from '../types/campus';
import { searchPins } from '../utils/geo';

interface HomeViewProps {
  userLocation: UserLocation | null;
  nextClass: ClassScheduleItem | null;
  onNavigateTab: (tab: AppTab) => void;
  onSelectPin: (pin: CampusPin) => void;
  onLocatePinOnMap: (pin: CampusPin) => void;
  onLocatePinById: (pinId: string) => void;
  onOpenBusTimings: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HomeView({
  userLocation,
  nextClass,
  onNavigateTab,
  onSelectPin,
  onLocatePinOnMap,
  onLocatePinById,
  onOpenBusTimings,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchPins(CAMPUS_PINS, searchQuery).slice(0, 6);
  }, [searchQuery]);

  const modules = [
    {
      id: 'map',
      eyebrow: '01 • LIVE GPS NAVIGATION',
      title: 'Interactive Campus Map',
      description:
        'Follow real-time GPS shortest walking routes from your exact current location to any campus block, lab, or office with step-by-step turn directions.',
      tags: ['Live GPS Tracking', 'Shortest Path', 'Zoom-Reveal Labels'],
      icon: MapIcon,
      accentBg: 'bg-[#E8F0FE]',
      accentText: 'text-[#0B57D0]',
      borderHover: 'hover:border-[#0B57D0]/50',
      cta: 'Open Campus Map',
      action: () => onNavigateTab('OUTDOOR_MAP'),
    },
    {
      id: 'schedule',
      eyebrow: '02 • ACADEMIC SCHEDULE',
      title: 'Department Timetables',
      description:
        'Browse structured weekly lecture and lab timetables across departments with instructor details and instant one-tap GPS routing straight to the block.',
      tags: ['Weekly Timetable', 'Lab Sessions', 'Map Pinpoint'],
      icon: CalendarDays,
      accentBg: 'bg-[#E6F4EA]',
      accentText: 'text-[#137333]',
      borderHover: 'hover:border-[#0F9D58]/50',
      cta: 'View Timetable',
      action: () => onNavigateTab('SCHEDULE'),
    },
    {
      id: 'buses',
      eyebrow: '03 • CITY TRANSIT FLEET',
      title: 'Bus & Coaster Timetables',
      description:
        'Check all 7 official morning transport routes (Bus 01–05, Hino GS-9526 & Coaster GSF-325) across Khairpur, Hingorja, Sukkur, Chondko, Sobhodero & Thari Mirwah.',
      tags: ['7 Bus & Coaster Routes', 'Stop Timings', 'Driver Contacts'],
      icon: Bus,
      accentBg: 'bg-[#FCE8E6]',
      accentText: 'text-[#B3261E]',
      borderHover: 'hover:border-[#B3261E]/45',
      cta: 'View Bus Timetables',
      action: () => onOpenBusTimings(),
    },
  ];

  const campusZones = [
    {
      badge: 'West of Dividing Road',
      title: 'Old Academic & Admin Complex',
      summary:
        'Executive governance including the Vice Chancellor Secretariat, Registrar, Examinations Branch, Finance, Admissions Directorate, and Engineering Technology labs & workshops.',
      tone: 'border-[#F2B8B5] bg-[#FCE8E6]/45',
      badgeTone: 'bg-[#FCE8E6] text-[#B3261E]',
      cta: 'Locate on Map',
      onClick: () => onLocatePinById('gate_main'),
    },
    {
      badge: 'Central Campus Spine',
      title: 'Campus Dividing Road',
      summary:
        'Main pedestrian and vehicle artery connecting Main Gates, Campus Masjid, University Canteen, Hostels, and the Points Stop terminal.',
      tone: 'border-[#D3E3FD] bg-[#E8F0FE]/45',
      badgeTone: 'bg-[#E8F0FE] text-[#0B57D0]',
      cta: 'Trace Route on Map',
      onClick: () => onNavigateTab('OUTDOOR_MAP'),
    },
    {
      badge: 'East of Dividing Road',
      title: 'New Academic & Skill Complex',
      summary:
        'Modern Computer Science & Artificial Intelligence labs, Skill Development Directorate, Central Digital Library, Medical Unit, Smart Classrooms, Auditorium, and Sports Grounds.',
      tone: 'border-[#CBE6D3] bg-[#E6F4EA]/45',
      badgeTone: 'bg-[#E6F4EA] text-[#137333]',
      cta: 'Locate on Map',
      onClick: () => onLocatePinById('new_1_smart_class'),
    },
  ];

  return (
    <div className="space-y-14 pb-24 lg:pb-16">
      {/* =================================================================== */}
      {/* 1. HERO SECTION: CLEAN EDITORIAL LANDING + ANIMATED CAMPUS PREVIEW   */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden rounded-[32px] border border-[#E6DDD0] bg-gradient-to-br from-[#FFFFFF] via-[#FAF7F2] to-[#F6ECE0] p-6 sm:p-10 lg:p-12 shadow-[0_14px_38px_-10px_rgba(74,44,21,0.12)]">
        {/* Soft Warm Almond & Emerald Ambient Aura */}
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#DFCBB4]/50 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#E6F4EA]/70 blur-3xl"
        />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          {/* Hero Editorial Copy */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="inline-flex items-center gap-2 rounded-full border border-[#DFCBB4] bg-[#FFFFFF]/95 px-3.5 py-1.5 text-xs font-semibold text-[#7C4D2B] shadow-[0_3px_10px_-2px_rgba(74,44,21,0.1)]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#A66B3F]" />
              <span>BBS-UTECH Khairpur Mirs • Official Smart Campus Companion</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT }}
              className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1F1812] leading-[1.12]"
            >
              Navigate every lab, hall, and bus route at{' '}
              <span className="text-[#7C4D2B]">BBS-UTECH</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: EASE_OUT }}
              className="max-w-xl text-sm sm:text-base leading-relaxed text-[#5C5147]"
            >
              This platform is the unified digital guide for{' '}
              <strong className="font-semibold text-[#1F1812]">
                The Benazir Bhutto Shaheed University of Technology &amp; Skill Development
              </strong>
              —built to help students, faculty, and campus visitors find buildings with live GPS
              shortest-path walking routes, check department class timetables, and inspect all 7
              official university bus and coaster routes without guesswork.
            </motion.p>

            {/* Primary Pill CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: EASE_OUT }}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigateTab('OUTDOOR_MAP')}
                className="nutty-btn-primary inline-flex items-center gap-2 rounded-full bg-[#0B57D0] px-6 py-3.5 font-display text-sm font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>Launch Campus Map</span>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenBusTimings}
                className="nutty-btn inline-flex items-center gap-2 rounded-full border border-[#DFCBB4] bg-[#FFFFFF] px-5 py-3.5 font-display text-sm font-semibold text-[#1F1812] hover:bg-[#F6ECE0] hover:border-[#A66B3F] cursor-pointer"
              >
                <Bus className="h-4 w-4 text-[#7C4D2B]" />
                <span>Bus &amp; Coaster (7)</span>
              </motion.button>
            </motion.div>

            {/* Lightweight Quick Landmark Finder Pill */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32, ease: EASE_OUT }}
              className="relative max-w-xl"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C4D2B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick search: Central Library, Labs, ATM, Mosque..."
                className="w-full rounded-full border border-[#DFCBB4] bg-[#FFFFFF]/95 py-3 pl-11 pr-10 text-xs sm:text-sm text-[#1F1812] placeholder-[#7D7166] shadow-[0_4px_14px_-3px_rgba(74,44,21,0.1)] outline-none transition focus:border-[#7C4D2B] focus:ring-2 focus:ring-[#F6ECE0]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="nutty-chip absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#F6ECE0] text-[#7C4D2B] hover:bg-[#EAE1D4] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              <AnimatePresence>
                {searchQuery.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-xl"
                  >
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-xs text-[#5F6368]">
                        No landmark found matching &ldquo;{searchQuery}&rdquo;. Try Central Library,
                        Main Gates, Mosque, or Points Stop.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F1F5F9]">
                        {searchResults.map((pin) => (
                          <div
                            key={pin.id}
                            onClick={() => onSelectPin(pin)}
                            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="shrink-0 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-[#0B57D0]">
                                {pin.roomNumber}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate font-display text-xs font-bold text-[#111827]">
                                  {pin.name}
                                </div>
                                <div className="truncate text-[11px] text-[#5F6368]">
                                  {BUILDINGS[pin.building].shortName} •{' '}
                                  {FLOORS[pin.floor].displayName}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLocatePinOnMap(pin);
                              }}
                              className="shrink-0 rounded-full bg-[#EFF3F8] px-3 py-1 text-[11px] font-semibold text-[#0B57D0] hover:bg-[#D3E3FD] cursor-pointer"
                            >
                              Directions
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column: Animated Architectural Route Preview Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: EASE_OUT }}
            onClick={() => onNavigateTab('OUTDOOR_MAP')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onNavigateTab('OUTDOOR_MAP');
            }}
            aria-label="Open interactive live campus map"
            className="nutty-card nutty-card-interactive group relative rounded-[28px] border border-[#DFCBB4] bg-[#FFFFFF] p-5 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#F3EDE4]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0F9D58] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0F9D58]" />
                </span>
                <span className="font-display text-xs font-bold text-[#1F1812]">
                  Live Campus Routing Preview
                </span>
              </div>
              <span className="rounded-full border border-[#DFCBB4] bg-[#F6ECE0] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#7C4D2B]">
                {userLocation ? 'GPS Ready' : '27.51°N 68.74°E'}
              </span>
            </div>

            {/* Animated SVG Campus Route Topology */}
            <div className="relative my-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <svg viewBox="0 0 360 210" className="w-full h-auto" aria-hidden="true">
                <defs>
                  <pattern id="pixelGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
                <rect width="360" height="210" fill="url(#pixelGrid)" rx="12" />

                {/* Old Complex Block (Crimson) */}
                <rect
                  x="28"
                  y="30"
                  width="110"
                  height="64"
                  rx="12"
                  fill="#FCE8E6"
                  stroke="#B3261E"
                  strokeWidth="1.5"
                />
                <text x="83" y="59" textAnchor="middle" fill="#B3261E" fontSize="10" fontWeight="700">
                  OLD COMPLEX
                </text>
                <text x="83" y="74" textAnchor="middle" fill="#7F1D1D" fontSize="8.5">
                  VC &amp; Admin Block
                </text>

                {/* New Complex Block (Emerald) */}
                <rect
                  x="208"
                  y="112"
                  width="124"
                  height="68"
                  rx="12"
                  fill="#E6F4EA"
                  stroke="#0F9D58"
                  strokeWidth="1.5"
                />
                <text x="270" y="142" textAnchor="middle" fill="#137333" fontSize="10" fontWeight="700">
                  NEW COMPLEX
                </text>
                <text x="270" y="157" textAnchor="middle" fill="#14532D" fontSize="8.5">
                  CS/AI Labs &amp; Library
                </text>

                {/* Dividing Road Spine */}
                <line
                  x1="34"
                  y1="176"
                  x2="318"
                  y2="34"
                  stroke="#CBD5E1"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <line
                  x1="34"
                  y1="176"
                  x2="318"
                  y2="34"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />

                {/* Animated Shortest Path Trace */}
                <motion.path
                  d="M 52 167 L 176 105 L 222 128 L 266 128"
                  fill="none"
                  stroke="#0B57D0"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    repeatDelay: 1.1,
                    ease: 'easeInOut',
                  }}
                />

                {/* Live Origin Node */}
                <circle cx="52" cy="167" r="7" fill="#0F9D58" stroke="#FFFFFF" strokeWidth="2.5" />
                <text x="52" y="191" textAnchor="middle" fill="#111827" fontSize="8.5" fontWeight="700">
                  Live You
                </text>

                {/* Junction Turn Marker */}
                <circle cx="176" cy="105" r="5" fill="#FFFFFF" stroke="#0B57D0" strokeWidth="2.5" />

                {/* Destination Marker */}
                <motion.circle
                  cx="266"
                  cy="128"
                  r="8"
                  fill="#0B57D0"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            {/* Compact Telemetry Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-[#F8FAFC] px-2 py-2.5">
                <div className="font-display text-base font-extrabold text-[#111827]">
                  {CAMPUS_PINS.length}
                </div>
                <div className="text-[10.5px] font-medium text-[#5F6368]">Campus Pins</div>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-2 py-2.5">
                <div className="font-display text-base font-extrabold text-[#0B57D0]">
                  {SCHEDULE_DEPARTMENTS.length}
                </div>
                <div className="text-[10.5px] font-medium text-[#5F6368]">Departments</div>
              </div>
              <div className="rounded-2xl bg-[#F8FAFC] px-2 py-2.5">
                <div className="font-display text-base font-extrabold text-[#137333]">7</div>
                <div className="text-[10.5px] font-medium text-[#5F6368]">Bus Routes</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. SORTED 3-PILLAR PLATFORM OVERVIEW (NO CLUTTER)                   */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0B57D0]">
              <Route className="h-3.5 w-3.5" />
              <span>Inside The Website</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
              Sorted into three focused campus tools
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-[#5F6368]">
            Each module lives in its own dedicated view so you can jump straight to directions,
            classes, or bus timetables without clutter.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <motion.button
                key={mod.id}
                type="button"
                onClick={mod.action}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                className={`nutty-card nutty-card-interactive group flex flex-col justify-between rounded-[28px] border border-[#E6DDD0] bg-[#FFFFFF] p-6 text-left cursor-pointer ${mod.borderHover}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-105 ${mod.accentBg} ${mod.accentText}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-[10.5px] font-bold tracking-wide text-[#7D7166]">
                      {mod.eyebrow}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-xl font-bold text-[#1F1812] group-hover:text-[#7C4D2B] transition-colors">
                    {mod.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#5C5147]">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F3EDE4]">
                  <div className="flex flex-wrap gap-1.5">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#E6DDD0] bg-[#FAF7F2] px-2.5 py-1 text-[10.5px] font-semibold text-[#5C5147]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 font-display text-xs font-bold text-[#7C4D2B]">
                    {mod.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. CAMPUS ARCHITECTURE & ZONES EXPLAINER                            */}
      {/* =================================================================== */}
      <section className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="space-y-1.5"
        >
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#137333]">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>University Grounds</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            How the BBS-UTECH campus is organized
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-[#5F6368]">
            Located on Hami Road in Khairpur Mirs, the campus is anchored around two academic
            complexes linked by the central dividing road.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {campusZones.map((zone, idx) => (
            <motion.div
              key={zone.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: idx * 0.08, ease: EASE_OUT }}
              className={`nutty-card nutty-card-interactive flex flex-col justify-between rounded-[26px] border p-6 ${zone.tone}`}
            >
              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 font-mono text-[10.5px] font-bold ${zone.badgeTone}`}
                >
                  {zone.badge}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-[#1F1812]">
                  {zone.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#5C5147]">
                  {zone.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={zone.onClick}
                className="nutty-btn mt-5 inline-flex items-center gap-1.5 self-start rounded-full border border-[#DFCBB4] bg-[#FFFFFF] px-4 py-2 font-display text-xs font-semibold text-[#1F1812] hover:bg-[#F6ECE0] cursor-pointer"
              >
                <span>{zone.cta}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#7C4D2B]" />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. MINIMALIST BOTTOM ACTION STRIP                                   */}
      {/* =================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="nutty-card flex flex-col gap-4 rounded-[28px] border border-[#DFCBB4] bg-gradient-to-r from-[#FFFFFF] via-[#FAF7F2] to-[#F6ECE0] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-display text-lg font-bold text-[#1F1812]">
            <Compass className="h-5 w-5 text-[#7C4D2B]" />
            <span>Need directions right now?</span>
          </div>
          <p className="text-xs sm:text-sm text-[#5C5147]">
            {nextClass
              ? `Next scheduled session on file: ${nextClass.subjectTitle} (${nextClass.roomLabel}). Open the map or bus timings anytime.`
              : 'Jump directly into live campus GPS navigation or inspect all 7 official university bus & coaster schedules.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenBusTimings}
            className="nutty-btn inline-flex items-center gap-1.5 rounded-full border border-[#DFCBB4] bg-[#FFFFFF] px-4 py-2.5 font-display text-xs font-semibold text-[#1F1812] hover:bg-[#F6ECE0] cursor-pointer"
          >
            <Bus className="h-3.5 w-3.5 text-[#7C4D2B]" />
            <span>Bus Timetables (7)</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('OUTDOOR_MAP')}
            className="nutty-btn-primary inline-flex items-center gap-1.5 rounded-full bg-[#0B57D0] px-5 py-2.5 font-display text-xs font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Start Navigation</span>
          </button>
        </div>
      </motion.section>
    </div>
  );
}

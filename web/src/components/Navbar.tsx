import {
  CalendarDays,
  Compass,
  GraduationCap,
  Home,
  Layers,
  Map as MapIcon,
  Radio,
} from 'lucide-react';
import type { AppTab, UserLocation } from '../types/campus';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userLocation: UserLocation | null;
}

const NAV_ITEMS: { id: AppTab; label: string; shortLabel: string; icon: typeof Home }[] = [
  { id: 'HOME', label: 'Command Home', shortLabel: 'Home', icon: Home },
  { id: 'OUTDOOR_MAP', label: 'Campus GPS Map', shortLabel: 'Campus GPS', icon: MapIcon },
  { id: 'INDOOR_MAP', label: 'Indoor Blueprints', shortLabel: 'Blueprints', icon: Layers },
  { id: 'SCHEDULE', label: 'Class Timetable', shortLabel: 'Timetable', icon: CalendarDays },
  { id: 'RESOURCES', label: 'Hub & 5-Point Buses', shortLabel: 'Campus Hub', icon: GraduationCap },
];

export function Navbar({ activeTab, onSelectTab, userLocation }: NavbarProps) {
  return (
    <>
      {/* Top Tactical Header (Desktop + Mobile) */}
      <header className="sticky top-0 z-40 border-b border-[#282C38] bg-[#050507]/95 backdrop-blur-md">
        <div className="h-[3px] w-full bg-gradient-to-r from-[#FF1E2D] via-[#FF1E2D]/50 to-[#39FF14]" />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onSelectTab('HOME')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center bg-[#15171E] border border-[#FF1E2D] cut-corner-sm transition group-hover:border-[#39FF14]">
              <Compass className="h-5 w-5 text-[#FF1E2D] transition group-hover:text-[#39FF14]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-wider text-[#F8FAFC]">
                  BBSUTSD
                </span>
                <span className="border border-[#FF1E2D] bg-[#26080D] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#FF1E2D]">
                  WEB // 2.0
                </span>
              </div>
              <p className="font-mono text-[10px] tracking-wide text-[#A1A7B3]">
                KHAIRPUR MIRS • SMART CAMPUS NAVIGATION
              </p>
            </div>
          </button>

          {/* Desktop Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Primary Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 font-display text-xs font-bold tracking-wider uppercase transition cursor-pointer cut-corner-sm border ${
                    isActive
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white shadow-[0_0_20px_rgba(255,30,45,0.35)]'
                      : 'border-[#282C38] bg-[#0D0E12] text-[#A1A7B3] hover:border-[#39FF14] hover:text-[#F8FAFC]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Live Telemetry Pill */}
          <button
            type="button"
            onClick={() => onSelectTab('OUTDOOR_MAP')}
            className="hidden sm:flex items-center gap-2 border border-[#39FF14]/50 bg-[#0B2407] px-3 py-1.5 font-mono text-[11px] font-bold text-[#39FF14] transition hover:border-[#39FF14] cursor-pointer cut-corner-sm"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="max-w-[180px] truncate">
              {userLocation ? userLocation.label : 'GPS STANDBY'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Dock */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[#282C38] bg-[#050507]/95 backdrop-blur-md"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono font-bold transition cursor-pointer ${
                  isActive
                    ? 'text-[#FF1E2D] border-t-2 border-[#FF1E2D] bg-[#26080D]/40'
                    : 'text-[#A1A7B3] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#39FF14]' : ''}`} />
                <span className="truncate max-w-full px-1">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

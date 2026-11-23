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
  { id: 'HOME', label: 'At a Glance', shortLabel: 'Home', icon: Home },
  { id: 'OUTDOOR_MAP', label: 'Campus Map', shortLabel: 'Map', icon: MapIcon },
  { id: 'INDOOR_MAP', label: 'Floor Plans', shortLabel: 'Floors', icon: Layers },
  { id: 'SCHEDULE', label: 'Timetable', shortLabel: 'Schedule', icon: CalendarDays },
  { id: 'RESOURCES', label: 'Campus Hub & Buses', shortLabel: 'Hub', icon: GraduationCap },
];

export function Navbar({ activeTab, onSelectTab, userLocation }: NavbarProps) {
  return (
    <>
      {/* Pixel Material You Top App Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-[#FFFFFF]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onSelectTab('HOME')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#E8F0FE] text-[#0B57D0] transition group-hover:bg-[#D3E3FD]">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight text-[#111827]">
                  BBS-UTECH
                </span>
                <span className="rounded-full bg-[#E8F0FE] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#0B57D0]">
                  CAMPUS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#5F6368]">
                Khairpur Mirs • Smart Navigation
              </p>
            </div>
          </button>

          {/* Desktop Pixel Pill Navigation */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-full bg-[#EFF3F8] p-1"
            aria-label="Primary Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-[#D3E3FD] text-[#041E49] shadow-xs'
                      : 'text-[#444746] hover:bg-white/70 hover:text-[#111827]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Live GPS Status Pill */}
          <button
            type="button"
            onClick={() => onSelectTab('OUTDOOR_MAP')}
            className="hidden sm:flex items-center gap-2 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-3.5 py-2 text-xs font-semibold text-[#137333] transition hover:bg-[#D7EFE0] cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="max-w-[180px] truncate">
              {userLocation ? userLocation.label : 'GPS Standby'}
            </span>
          </button>
        </div>
      </header>

      {/* Pixel Material You Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[#E2E8F0] bg-[#FFFFFF]/95 backdrop-blur-xl pb-safe"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-5 px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition cursor-pointer"
              >
                <div
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    isActive
                      ? 'bg-[#D3E3FD] text-[#041E49]'
                      : 'text-[#444746]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`truncate max-w-full px-1 font-display ${
                    isActive ? 'font-bold text-[#041E49]' : 'text-[#5F6368]'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

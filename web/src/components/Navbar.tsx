import {
  Bus,
  CalendarDays,
  Home,
  Map as MapIcon,
  Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { AppTab, UserLocation } from '../types/campus';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  userLocation: UserLocation | null;
}

const NAV_ITEMS: { id: AppTab; label: string; shortLabel: string; icon: typeof Home }[] = [
  { id: 'HOME', label: 'Overview', shortLabel: 'Home', icon: Home },
  { id: 'OUTDOOR_MAP', label: 'Campus Map', shortLabel: 'Map', icon: MapIcon },
  { id: 'SCHEDULE', label: 'Timetable', shortLabel: 'Schedule', icon: CalendarDays },
  { id: 'BUSES', label: 'Bus Timetables', shortLabel: 'Buses', icon: Bus },
];

export function Navbar({ activeTab, onSelectTab, userLocation }: NavbarProps) {
  return (
    <>
      {/* Minimalist Warm-Nutty Top App Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E6DDD0] bg-[#FFFFFF]/92 backdrop-blur-xl shadow-[0_2px_14px_-4px_rgba(74,44,21,0.08)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => onSelectTab('HOME')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="nutty-btn flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#7C4D2B] bg-[#4A2C15] shadow-[0_4px_12px_-2px_rgba(74,44,21,0.28)] transition-transform duration-300 group-hover:scale-105">
              <img
                src="/bbsutsd-logo.png"
                alt="BBSUTSD Signature Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-bold tracking-tight text-[#1F1812]">
                  BBS-UTECH
                </span>
                <span className="rounded-full border border-[#DFCBB4] bg-[#F6ECE0] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#7C4D2B]">
                  CAMPUS
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#7D7166]">
                Khairpur Mirs • Smart Navigation
              </p>
            </div>
          </button>

          {/* Desktop Pill Navigation */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-full border border-[#E6DDD0] bg-[#F3EDE4] p-1 shadow-[inset_0_1px_3px_rgba(74,44,21,0.06)]"
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
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-[#7C4D2B]'
                      : 'text-[#5C5147] hover:text-[#1F1812] hover:-translate-y-0.5'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktopNavPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full border border-[#DFCBB4] bg-[#FFFFFF] shadow-[0_3px_10px_-2px_rgba(74,44,21,0.16)]"
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>

          {/* Live GPS Status Pill */}
          <button
            type="button"
            onClick={() => onSelectTab('OUTDOOR_MAP')}
            className="nutty-btn hidden sm:flex items-center gap-2 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-3.5 py-2 text-xs font-semibold text-[#137333] hover:bg-[#D7EFE0] cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="max-w-[180px] truncate">
              {userLocation ? userLocation.label : 'GPS Standby'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[#E6DDD0] bg-[#FFFFFF]/96 backdrop-blur-xl pb-safe shadow-[0_-4px_16px_-4px_rgba(74,44,21,0.1)]"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-4 px-1 py-1.5">
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
                  className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'text-[#7C4D2B]' : 'text-[#5C5147]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobileNavPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-full border border-[#DFCBB4] bg-[#F6ECE0] shadow-xs"
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                </div>
                <span
                  className={`truncate max-w-full px-1 font-display ${
                    isActive ? 'font-bold text-[#7C4D2B]' : 'text-[#7D7166]'
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

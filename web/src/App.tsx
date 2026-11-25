import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { BusesView } from './components/BusesView';
import { HomeView } from './components/HomeView';
import { Navbar } from './components/Navbar';
import { OutdoorMapView } from './components/OutdoorMapView';
import { PinDetailModal } from './components/PinDetailModal';
import { ScheduleView } from './components/ScheduleView';
import { CAMPUS_PINS, CLASS_SCHEDULES } from './data/campusData';
import { useGeolocation } from './hooks/useGeolocation';
import type { AppTab, CampusPin } from './types/campus';
import { getCurrentMinutes, getTodayDayName } from './utils/geo';

interface SavedSchedulePref {
  dept: string;
  sem: number;
  sec: string;
}

const PREF_STORAGE_KEY = 'bbsutsd.schedule.pref.v1';

function loadSavedPref(): SavedSchedulePref {
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedSchedulePref>;
      if (parsed.dept && typeof parsed.sem === 'number' && parsed.sec) {
        return { dept: parsed.dept, sem: parsed.sem, sec: parsed.sec };
      }
    }
  } catch {
    // ignore storage errors
  }
  return {
    dept: 'Computer Systems Engineering',
    sem: 1,
    sec: 'A',
  };
}

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');
  const [detailPin, setDetailPin] = useState<CampusPin | null>(null);
  const [navTargetPin, setNavTargetPin] = useState<CampusPin | null>(null);
  const [selectedBusPoint, setSelectedBusPoint] = useState<number | null>(null);
  const [savedPref, setSavedPref] = useState<SavedSchedulePref>(loadSavedPref);

  const geo = useGeolocation();

  useEffect(() => {
    try {
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(savedPref));
    } catch {
      // ignore storage errors
    }
  }, [savedPref]);

  const nextClass = useMemo(() => {
    const today = getTodayDayName();
    const nowMin = getCurrentMinutes();
    const todayClasses = CLASS_SCHEDULES.filter(
      (c) =>
        c.department === savedPref.dept &&
        c.semester === savedPref.sem &&
        c.section.toLowerCase() === savedPref.sec.toLowerCase() &&
        c.dayName === today
    ).sort((a, b) => a.startMinutes - b.startMinutes);

    return todayClasses.find((c) => c.endMinutes >= nowMin) ?? todayClasses[0] ?? null;
  }, [savedPref]);

  const locatePinOutdoor = useCallback((pin: CampusPin) => {
    setNavTargetPin(pin);
    setDetailPin(null);
    setActiveTab('OUTDOOR_MAP');
  }, []);

  const locatePinById = useCallback(
    (pinId: string) => {
      const pin = CAMPUS_PINS.find((p) => p.id === pinId);
      if (pin) locatePinOutdoor(pin);
    },
    [locatePinOutdoor]
  );

  const openBusTimings = useCallback((pointNumber: number | null = null) => {
    setDetailPin(null);
    setSelectedBusPoint(pointNumber);
    setActiveTab('BUSES');
  }, []);

  const clearNavTarget = useCallback(() => {
    setNavTargetPin(null);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#FAF7F2] text-[#1F1812]">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userLocation={geo.currentLocation}
        />

        <main
          className={`mx-auto max-w-7xl ${
            activeTab === 'OUTDOOR_MAP'
              ? 'px-2 sm:px-6 pt-2 sm:pt-3 pb-[74px] lg:pb-3'
              : 'px-3 sm:px-6 pt-4'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'HOME' && (
                <HomeView
                  userLocation={geo.currentLocation}
                  nextClass={nextClass}
                  onNavigateTab={setActiveTab}
                  onSelectPin={setDetailPin}
                  onLocatePinOnMap={locatePinOutdoor}
                  onLocatePinById={locatePinById}
                  onOpenBusTimings={() => openBusTimings(null)}
                />
              )}

              {activeTab === 'OUTDOOR_MAP' && (
                <OutdoorMapView
                  userLocation={geo.currentLocation}
                  gpsMode={geo.gpsMode}
                  isAcquiringGps={geo.isAcquiring}
                  presetIndex={geo.presetIndex}
                  presets={geo.presets}
                  gpsError={geo.gpsError}
                  navTargetPin={navTargetPin}
                  onClearNavTarget={clearNavTarget}
                  onRequestLiveGps={geo.requestLiveGps}
                  onSelectPreset={geo.selectPresetLocation}
                  onOpenPinDetail={setDetailPin}
                  onOpenBusTimings={() => openBusTimings(null)}
                />
              )}

              {activeTab === 'SCHEDULE' && (
                <ScheduleView
                  savedDept={savedPref.dept}
                  savedSem={savedPref.sem}
                  savedSec={savedPref.sec}
                  onSavePreference={(dept, sem, sec) => setSavedPref({ dept, sem, sec })}
                  onLocatePinById={locatePinById}
                  onOpenBusTimings={() => openBusTimings(null)}
                />
              )}

              {activeTab === 'BUSES' && (
                <BusesView
                  selectedBusPoint={selectedBusPoint}
                  onSelectBusPoint={setSelectedBusPoint}
                  onLocatePinById={locatePinById}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <PinDetailModal
          pin={detailPin}
          userLocation={geo.currentLocation}
          onClose={() => setDetailPin(null)}
          onNavigateOutdoor={locatePinOutdoor}
          onOpenBusTimings={() => openBusTimings(null)}
        />
      </div>
    </MotionConfig>
  );
}

export default App;

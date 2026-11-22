import { useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Clock,
  Layers,
  MapPin,
  User,
} from 'lucide-react';
import { CLASS_SCHEDULES, SCHEDULE_DEPARTMENTS } from '../data/campusData';
import { getCurrentMinutes, getTodayDayName } from '../utils/geo';

interface ScheduleViewProps {
  savedDept: string;
  savedSem: number;
  savedSec: string;
  onSavePreference: (dept: string, semester: number, section: string) => void;
  onLocatePinById: (pinId: string) => void;
}

const DAYS: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export function ScheduleView({
  savedDept,
  savedSem,
  savedSec,
  onSavePreference,
  onLocatePinById,
}: ScheduleViewProps) {
  const [selectedDept, setSelectedDept] = useState(savedDept);
  const [selectedSem, setSelectedSem] = useState(savedSem);
  const [selectedSec, setSelectedSec] = useState(savedSec);
  const [selectedDay, setSelectedDay] = useState(getTodayDayName());

  const currentMinutes = getCurrentMinutes();
  const isCurrentSaved =
    selectedDept === savedDept && selectedSem === savedSem && selectedSec === savedSec;

  const filteredClasses = useMemo(
    () =>
      CLASS_SCHEDULES.filter(
        (item) =>
          item.department === selectedDept &&
          item.semester === selectedSem &&
          item.section.toLowerCase() === selectedSec.toLowerCase() &&
          item.dayName === selectedDay
      ).sort((a, b) => a.startMinutes - b.startMinutes),
    [selectedDept, selectedSem, selectedSec, selectedDay]
  );

  return (
    <div className="space-y-5 pb-24 lg:pb-12">
      {/* Header + Filters */}
      <div className="border border-[#282C38] bg-[#0D0E12] p-5 cut-corner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-wider text-[#F8FAFC]">
              CLASS SCHEDULE
            </h1>
            <p className="font-mono text-[11px] font-bold text-[#39FF14]">
              BBSUTSD // FALL 2026 TIMETABLE
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSavePreference(selectedDept, selectedSem, selectedSec)}
            className={`flex items-center gap-2 border px-3.5 py-2 font-mono text-xs font-bold transition cursor-pointer cut-corner-sm ${
              isCurrentSaved
                ? 'border-[#39FF14] bg-[#39FF14] text-[#050507]'
                : 'border-[#FF1E2D] bg-[#15171E] text-[#F8FAFC] hover:bg-[#26080D]'
            }`}
          >
            {isCurrentSaved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4 text-[#FF1E2D]" />
            )}
            <span>{isCurrentSaved ? 'MY TIMETABLE' : 'SAVE MINE'}</span>
          </button>
        </div>

        {/* Department Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-[#282C38] pb-3">
          {SCHEDULE_DEPARTMENTS.map((dept) => {
            const active = selectedDept === dept.name;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => setSelectedDept(dept.name)}
                className={`border px-3.5 py-1.5 font-display text-xs font-bold tracking-wider transition cursor-pointer cut-corner-sm ${
                  active
                    ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                    : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                }`}
              >
                {dept.code} • {dept.name}
              </button>
            );
          })}
        </div>

        {/* Semester + Section + Day Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[#687080]">SEM:</span>
            {[1, 2, 3, 4].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSelectedSem(sem)}
                className={`border px-3 py-1 font-mono text-xs font-bold cursor-pointer cut-corner-sm ${
                  selectedSem === sem
                    ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                    : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:text-white'
                }`}
              >
                S{sem}
              </button>
            ))}

            <span className="ml-2 font-mono text-[11px] font-bold text-[#687080]">SEC:</span>
            {['A', 'B'].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSec(sec)}
                className={`border px-3 py-1 font-mono text-xs font-bold cursor-pointer cut-corner-sm ${
                  selectedSec === sec
                    ? 'border-[#39FF14] bg-[#39FF14] text-[#050507]'
                    : 'border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:text-white'
                }`}
              >
                SEC {sec}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const active = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`border px-3.5 py-1.5 font-display text-xs font-bold tracking-wider cursor-pointer cut-corner-sm ${
                    active
                      ? 'border-[#FF1E2D] bg-[#FF1E2D] text-white'
                      : 'border-[#282C38] bg-[#050507] text-[#A1A7B3] hover:border-[#39FF14] hover:text-white'
                  }`}
                >
                  {day.slice(0, 3).toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-[#282C38] bg-[#0D0E12] p-12 text-center cut-corner">
          <CalendarDays className="h-12 w-12 text-[#FF1E2D]/70" />
          <div className="mt-3 font-display text-base font-bold text-[#F8FAFC]">
            NO SESSIONS ON {selectedDay.toUpperCase()}
          </div>
          <p className="mt-1 text-xs text-[#A1A7B3]">
            Use this slot for Central Digital Library study or engineering workshops.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClasses.map((item) => {
            const isOngoing =
              item.startMinutes <= currentMinutes && item.endMinutes >= currentMinutes;
            const isUpcoming = item.startMinutes > currentMinutes;

            return (
              <div
                key={item.id}
                className={`border p-5 cut-corner ${
                  isOngoing
                    ? 'border-[#39FF14] bg-[#0B2407]'
                    : 'border-[#282C38] bg-[#0D0E12]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                        item.isLab
                          ? 'border-[#39FF14]/60 bg-[#0B2407] text-[#39FF14]'
                          : 'border-[#FF1E2D]/60 bg-[#26080D] text-[#FF1E2D]'
                      }`}
                    >
                      {item.subjectCode}
                    </span>
                    {item.isLab && (
                      <span className="border border-[#FF1E2D]/60 bg-[#26080D] px-2 py-0.5 font-mono text-[10px] font-bold text-[#FF1E2D]">
                        LAB
                      </span>
                    )}
                  </div>

                  {isOngoing ? (
                    <span className="bg-[#39FF14] px-2 py-0.5 font-mono text-[10px] font-bold text-[#050507]">
                      LIVE NOW
                    </span>
                  ) : isUpcoming ? (
                    <span className="font-mono text-[10px] font-bold text-[#A1A7B3]">
                      UPCOMING
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-[#F8FAFC]">
                  {item.subjectTitle}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#A1A7B3]">
                  <span className="flex items-center gap-1.5 font-mono font-bold text-[#F8FAFC]">
                    <Clock className="h-3.5 w-3.5 text-[#39FF14]" />
                    {item.timeSlot}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#A1A7B3]" />
                    {item.instructor}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border border-[#282C38] bg-[#15171E] px-3.5 py-2.5 cut-corner-sm">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#F8FAFC]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#FF1E2D]" />
                    {item.roomLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => onLocatePinById(item.locationPinId)}
                    className="flex shrink-0 items-center gap-1.5 bg-[#FF1E2D] px-3 py-1.5 font-mono text-[11px] font-bold text-white transition hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>LOCATE</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

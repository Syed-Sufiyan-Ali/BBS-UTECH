import { useMemo, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Bus,
  CalendarDays,
  Clock,
  MapPin,
  Navigation,
  User,
} from 'lucide-react';
import { CAMPUS_PINS, CLASS_SCHEDULES, SCHEDULE_DEPARTMENTS } from '../data/campusData';
import { getCurrentMinutes, getTodayDayName } from '../utils/geo';

interface ScheduleViewProps {
  savedDept: string;
  savedSem: number;
  savedSec: string;
  onSavePreference: (dept: string, semester: number, section: string) => void;
  onLocatePinById: (pinId: string) => void;
  onOpenBusTimings?: () => void;
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
  onOpenBusTimings,
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
      {/* Header + Filter Chips */}
      <div className="nutty-card rounded-[28px] border border-[#E6DDD0] bg-[#FFFFFF] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#1F1812]">
              Class Timetable
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-[#7C4D2B]">
              BBS-UTECH • Fall 2026 Academic Schedule
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenBusTimings && (
              <button
                type="button"
                onClick={onOpenBusTimings}
                className="nutty-btn flex items-center gap-2 rounded-full border border-[#CBE6D3] bg-[#E6F4EA] px-4 py-2 font-display text-xs font-semibold text-[#137333] hover:bg-[#D7EFE0] cursor-pointer"
              >
                <Bus className="h-4 w-4" />
                <span>Bus &amp; Coaster Timetables (7)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSavePreference(selectedDept, selectedSem, selectedSec)}
              className={`nutty-btn flex items-center gap-2 rounded-full border px-4 py-2 font-display text-xs font-semibold cursor-pointer ${
                isCurrentSaved
                  ? 'bg-[#E6F4EA] text-[#137333] border-[#CBE6D3]'
                  : 'bg-[#7C4D2B] text-[#FAF7F2] border-[#7C4D2B] hover:bg-[#663E21]'
              }`}
            >
              {isCurrentSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
              <span>{isCurrentSaved ? 'Saved as My Timetable' : 'Save Timetable'}</span>
            </button>
          </div>
        </div>

        {/* Department Chips */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-[#F3EDE4] pb-4">
          {SCHEDULE_DEPARTMENTS.map((dept) => {
            const active = selectedDept === dept.name;
            return (
              <button
                key={dept.code}
                type="button"
                onClick={() => setSelectedDept(dept.name)}
                className={`nutty-chip rounded-full border px-4 py-1.5 font-display text-xs font-semibold cursor-pointer ${
                  active
                    ? 'border-[#7C4D2B] bg-[#F6ECE0] text-[#7C4D2B]'
                    : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
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
            <span className="text-xs font-semibold text-[#7D7166]">Sem:</span>
            {[1, 2, 3, 4].map((sem) => (
              <button
                key={sem}
                type="button"
                onClick={() => setSelectedSem(sem)}
                className={`nutty-chip rounded-full border px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer ${
                  selectedSem === sem
                    ? 'border-[#7C4D2B] bg-[#7C4D2B] text-[#FAF7F2]'
                    : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
                }`}
              >
                S{sem}
              </button>
            ))}

            <span className="ml-2 text-xs font-semibold text-[#7D7166]">Sec:</span>
            {['A', 'B'].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSec(sec)}
                className={`nutty-chip rounded-full border px-3 py-1.5 font-mono text-xs font-semibold cursor-pointer ${
                  selectedSec === sec
                    ? 'border-[#CBE6D3] bg-[#E6F4EA] text-[#137333]'
                    : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
                }`}
              >
                Sec {sec}
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
                  className={`nutty-chip rounded-full border px-3.5 py-1.5 font-display text-xs font-semibold cursor-pointer ${
                    active
                      ? 'border-[#0B57D0] bg-[#0B57D0] text-white'
                      : 'border-[#E6DDD0] bg-[#FAF7F2] text-[#5C5147] hover:bg-[#F3EDE4]'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-12 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0FE] text-[#0B57D0]">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div className="mt-3 font-display text-base font-bold text-[#111827]">
            No classes scheduled on {selectedDay}
          </div>
          <p className="mt-1 text-xs text-[#5F6368]">
            Use this free slot for Central Digital Library study or engineering labs.
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
                className={`nutty-card rounded-[24px] border p-5 ${
                  isOngoing
                    ? 'border-[#0F9D58] bg-[#E6F4EA]/50'
                    : 'border-[#E6DDD0] bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold ${
                        item.isLab
                          ? 'bg-[#E6F4EA] text-[#137333]'
                          : 'bg-[#F6ECE0] text-[#7C4D2B]'
                      }`}
                    >
                      {item.subjectCode}
                    </span>
                    {item.isLab && (
                      <span className="rounded-full bg-[#FCE8E6] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#B3261E]">
                        LAB
                      </span>
                    )}
                  </div>

                  {isOngoing ? (
                    <span className="rounded-full bg-[#0F9D58] px-3 py-0.5 font-mono text-[10px] font-bold text-white">
                      LIVE NOW
                    </span>
                  ) : isUpcoming ? (
                    <span className="font-mono text-[11px] font-semibold text-[#7D7166]">
                      Upcoming
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 font-display text-lg font-bold text-[#1F1812]">
                  {item.subjectTitle}
                </h3>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#5C5147]">
                  <span className="flex items-center gap-1.5 font-mono font-semibold text-[#1F1812]">
                    <Clock className="h-3.5 w-3.5 text-[#7C4D2B]" />
                    {item.timeSlot}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-[#7D7166]" />
                    {item.instructor}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E6DDD0] bg-[#FAF7F2] px-4 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-[#1F1812]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#7C4D2B]" />
                    {item.roomLabel}
                  </span>
                  {CAMPUS_PINS.some((p) => p.id === item.locationPinId) ? (
                    <button
                      type="button"
                      onClick={() => onLocatePinById(item.locationPinId)}
                      className="nutty-btn-primary flex shrink-0 items-center gap-1.5 rounded-full bg-[#0B57D0] px-3.5 py-1.5 font-display text-xs font-semibold text-white hover:bg-[#0842A0] cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Locate on Map</span>
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-[#FFFFFF] border border-[#DFCBB4] px-3 py-1 text-[11px] font-medium text-[#7D7166]">
                      Pin pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

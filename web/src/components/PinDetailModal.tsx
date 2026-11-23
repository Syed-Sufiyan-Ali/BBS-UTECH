import { useEffect } from 'react';
import {
  Bus,
  Clock,
  Footprints,
  MapPin,
  Navigation,
  Phone,
  User,
  X,
} from 'lucide-react';
import { BUILDINGS, FLOORS } from '../data/campusData';
import type { CampusPin, UserLocation } from '../types/campus';
import { calculateDistanceMeters, estimateWalkMinutes, formatDistance } from '../utils/geo';

interface PinDetailModalProps {
  pin: CampusPin | null;
  userLocation: UserLocation | null;
  onClose: () => void;
  onNavigateOutdoor: (pin: CampusPin) => void;
  onOpenBusTimings: () => void;
}

export function PinDetailModal({
  pin,
  userLocation,
  onClose,
  onNavigateOutdoor,
  onOpenBusTimings,
}: PinDetailModalProps) {
  useEffect(() => {
    if (!pin) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [pin, onClose]);

  if (!pin) return null;

  const distMeters = userLocation
    ? calculateDistanceMeters(
        userLocation.latitude,
        userLocation.longitude,
        pin.latitude,
        pin.longitude
      )
    : null;

  const isTransportPin =
    pin.id === 'campus_transport_office' || pin.id === 'campus_transport';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F172A]/40 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pin.name}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pixel drag handle on mobile */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#CBD5E1] sm:hidden" />

        {/* Badges + Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold">
            <span className="rounded-full bg-[#E8F0FE] px-3 py-1 text-[#0B57D0]">
              {BUILDINGS[pin.building].shortName}
            </span>
            <span className="rounded-full bg-[#E6F4EA] px-3 py-1 text-[#137333]">
              {pin.floor === 'OUTDOOR' ? 'Grounds' : FLOORS[pin.floor].code}
            </span>
            <span className="rounded-full bg-[#EFF3F8] px-3 py-1 text-[#444746]">
              {pin.roomNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close landmark details"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF3F8] text-[#444746] transition hover:bg-[#E2E8F0] hover:text-[#111827] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold text-[#111827]">
          {pin.name}
        </h2>
        <p className="mt-1 text-sm text-[#5F6368]">{pin.subTitle}</p>

        {/* Distance Strip */}
        {distMeters !== null && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#CBE6D3] bg-[#E6F4EA] px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F9D58] text-white">
              <Navigation className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#137333]">
                {formatDistance(distMeters)} away • {estimateWalkMinutes(distMeters)} min walk
              </div>
              <div className="text-xs text-[#1E4620]">
                From {userLocation?.isSimulated ? 'selected preset' : 'live GPS'} ({userLocation?.label})
              </div>
            </div>
          </div>
        )}

        <div className="my-5 border-t border-[#E2E8F0]" />

        {/* Officer / Hours / Contact */}
        <div className="space-y-3.5 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#0B57D0]">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#5F6368]">
                In-Charge / Officer
              </div>
              <div className="font-semibold text-[#111827]">{pin.inCharge}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#0B57D0]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#5F6368]">
                Office Hours
              </div>
              <div className="font-semibold text-[#111827]">{pin.timings}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E8F0FE] text-[#0B57D0]">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#5F6368]">
                Contact &amp; Extension
              </div>
              <div className="font-semibold text-[#111827]">{pin.contact}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#0B57D0]">
            About This Location
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#444746]">{pin.description}</p>
        </div>

        {/* Indoor Route Guide */}
        <div className="mt-4 rounded-2xl bg-[#EFF3F8] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B57D0]">
            <Footprints className="h-4 w-4" />
            <span>Indoor Walk Guide</span>
          </div>
          <p className="mt-1.5 text-sm text-[#111827]">{pin.indoorGuide}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-2.5">
          {isTransportPin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBusTimings();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0F9D58] px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-[#0B8043] cursor-pointer shadow-xs"
            >
              <Bus className="h-4 w-4" />
              <span>View Bus &amp; Coaster Timings (7 Routes)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateOutdoor(pin);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0B57D0] px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-[#0842A0] cursor-pointer shadow-xs"
          >
            <MapPin className="h-4 w-4" />
            <span>Directions on Campus Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}

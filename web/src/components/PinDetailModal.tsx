import { useEffect } from 'react';
import {
  Bus,
  Clock,
  Footprints,
  Layers,
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
  onNavigateIndoor: (pin: CampusPin) => void;
  onNavigateOutdoor: (pin: CampusPin) => void;
  onOpenBusTimings: () => void;
}

export function PinDetailModal({
  pin,
  userLocation,
  onClose,
  onNavigateIndoor,
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

  const isIndoorCapable = pin.building !== 'CAMPUS_GROUNDS' && pin.floor !== 'OUTDOOR';
  const isTransportPin =
    pin.id === 'campus_transport_office' || pin.id === 'campus_transport';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pin.name}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0D0E12] border border-[#282C38] border-t-2 border-t-[#FF1E2D] sm:cut-corner p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badges + Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold">
            <span className="border border-[#FF1E2D] bg-[#26080D] px-2 py-0.5 text-[#FF1E2D]">
              {BUILDINGS[pin.building].shortName.toUpperCase()}
            </span>
            <span className="border border-[#39FF14]/70 bg-[#0B2407] px-2 py-0.5 text-[#39FF14]">
              {pin.floor === 'OUTDOOR' ? 'GROUNDS' : FLOORS[pin.floor].code}
            </span>
            <span className="border border-[#282C38] bg-[#15171E] px-2 py-0.5 text-[#F8FAFC]">
              {pin.roomNumber}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close landmark details"
            className="flex h-9 w-9 items-center justify-center border border-[#282C38] bg-[#15171E] text-[#A1A7B3] hover:border-[#FF1E2D] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-2xl font-bold text-[#F8FAFC]">
          {pin.name}
        </h2>
        <p className="mt-1 text-sm text-[#A1A7B3]">{pin.subTitle}</p>

        {/* Distance Strip */}
        {distMeters !== null && (
          <div className="mt-4 flex items-center gap-3 border border-[#39FF14]/60 bg-[#0B2407] px-4 py-3 cut-corner-sm">
            <Navigation className="h-5 w-5 shrink-0 text-[#39FF14]" />
            <div>
              <div className="font-mono text-xs font-bold text-[#39FF14]">
                {formatDistance(distMeters)} away • {estimateWalkMinutes(distMeters)} min walk
              </div>
              <div className="text-xs text-[#F8FAFC]/80">
                From your {userLocation?.isSimulated ? 'selected preset' : 'live GPS'} ({userLocation?.label})
              </div>
            </div>
          </div>
        )}

        <div className="my-5 border-t border-[#282C38]" />

        {/* Officer / Hours / Contact */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-[#FF1E2D]" />
            <div>
              <div className="font-mono text-[10px] font-bold text-[#A1A7B3]">
                IN-CHARGE // OFFICER
              </div>
              <div className="font-semibold text-[#F8FAFC]">{pin.inCharge}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#FF1E2D]" />
            <div>
              <div className="font-mono text-[10px] font-bold text-[#A1A7B3]">
                OFFICE HOURS
              </div>
              <div className="font-semibold text-[#F8FAFC]">{pin.timings}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#FF1E2D]" />
            <div>
              <div className="font-mono text-[10px] font-bold text-[#A1A7B3]">
                CONTACT &amp; EXT
              </div>
              <div className="font-semibold text-[#F8FAFC]">{pin.contact}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-5">
          <div className="font-mono text-[11px] font-bold text-[#FF1E2D]">DETAILS</div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#A1A7B3]">{pin.description}</p>
        </div>

        {/* Indoor Route Guide */}
        <div className="mt-4 border border-[#282C38] bg-[#15171E] p-4 cut-corner-sm">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#39FF14]">
            <Footprints className="h-4 w-4" />
            <span>INDOOR ROUTE GUIDE</span>
          </div>
          <p className="mt-1.5 text-sm text-[#F8FAFC]/90">{pin.indoorGuide}</p>
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
              className="flex w-full items-center justify-center gap-2 bg-[#39FF14] px-4 py-3 font-display text-sm font-bold text-[#050507] transition hover:brightness-110 cursor-pointer cut-corner-sm"
            >
              <Bus className="h-4 w-4" />
              <span>VIEW POINT 1–5 BUS TIMINGS</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {isIndoorCapable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateIndoor(pin);
                }}
                className="flex items-center justify-center gap-2 bg-[#FF1E2D] px-4 py-3 font-display text-sm font-bold text-white transition hover:bg-[#FF3B47] cursor-pointer cut-corner-sm"
              >
                <Layers className="h-4 w-4" />
                <span>OPEN INDOOR PLAN</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateOutdoor(pin);
              }}
              className={`flex items-center justify-center gap-2 border border-[#F8FAFC] bg-[#050507] px-4 py-3 font-display text-sm font-bold text-[#F8FAFC] transition hover:border-[#39FF14] hover:text-[#39FF14] cursor-pointer cut-corner-sm ${
                !isIndoorCapable ? 'sm:col-span-2' : ''
              }`}
            >
              <MapPin className="h-4 w-4 text-[#39FF14]" />
              <span>LOCATE ON CAMPUS GPS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

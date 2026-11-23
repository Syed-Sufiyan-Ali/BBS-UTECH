import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESET_USER_LOCATIONS } from '../data/campusData';
import type { UserLocation } from '../types/campus';

export type GpsMode = 'LIVE' | 'SIMULATED';

export function useGeolocation() {
  const [gpsMode, setGpsMode] = useState<GpsMode>('LIVE');
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [liveLocation, setLiveLocation] = useState<UserLocation | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const requestLiveGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Browser Geolocation is unavailable. Select a campus preset to preview directions.');
      setGpsMode('LIVE');
      setIsWatching(false);
      return;
    }

    setGpsError(null);
    setGpsMode('LIVE');
    setIsWatching(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isSimulated: false,
          label: 'Your Live Location',
          accuracyMeters: pos.coords.accuracy,
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message || 'Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isSimulated: false,
          label: 'Your Live Location',
          accuracyMeters: pos.coords.accuracy,
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message || 'GPS signal unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
  }, []);

  const selectPresetLocation = useCallback(
    (index: number) => {
      stopWatching();
      setGpsError(null);
      setGpsMode('SIMULATED');
      setPresetIndex(index);
    },
    [stopWatching]
  );

  // Automatically track the user's real live browser location on startup
  useEffect(() => {
    requestLiveGps();
    return () => {
      stopWatching();
    };
  }, [requestLiveGps, stopWatching]);

  const currentLocation: UserLocation | null =
    gpsMode === 'LIVE'
      ? liveLocation
      : PRESET_USER_LOCATIONS[presetIndex] ?? PRESET_USER_LOCATIONS[0];

  return {
    gpsMode,
    presetIndex,
    currentLocation,
    gpsError,
    isWatching,
    isAcquiring: gpsMode === 'LIVE' && liveLocation === null && gpsError === null,
    requestLiveGps,
    selectPresetLocation,
    presets: PRESET_USER_LOCATIONS,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { PRESET_USER_LOCATIONS } from '../data/campusData';
import type { UserLocation } from '../types/campus';

export type GpsMode = 'LIVE' | 'SIMULATED';

export function useGeolocation() {
  const [gpsMode, setGpsMode] = useState<GpsMode>('SIMULATED');
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
      setGpsError('Browser Geolocation is unavailable. Using Campus GPS preset.');
      setGpsMode('SIMULATED');
      return;
    }

    setGpsError(null);
    setGpsMode('LIVE');
    setIsWatching(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isSimulated: false,
          label: 'Live Browser GPS',
          accuracyMeters: pos.coords.accuracy,
        });
      },
      (err) => {
        setGpsError(err.message || 'Location permission denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          isSimulated: false,
          label: 'Live Browser GPS',
          accuracyMeters: pos.coords.accuracy,
        });
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message || 'GPS signal unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
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

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

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
    requestLiveGps,
    selectPresetLocation,
    presets: PRESET_USER_LOCATIONS,
  };
}

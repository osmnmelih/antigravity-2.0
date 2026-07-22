import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps `navigator.geolocation.watchPosition` and exposes start/stop controls
 * plus the current position and error state. Behavior (alerts, options, error
 * handling) is preserved exactly from the original inline implementation.
 * Optimised with coordinate filtering to prevent battery drain from rapid re-renders.
 */
export function useGpsWatcher() {
  const [userPos, setUserPos] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const watchId = useRef(null);
  const lastPosRef = useRef(null);
  const lastTimeRef = useRef(0);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS unavailable');
      return;
    }

    const successHandler = pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const now = Date.now();

      if (lastPosRef.current) {
        const dLat = lat - lastPosRef.current.lat;
        const dLng = lng - lastPosRef.current.lng;
        // Simple fast distance square approximation in meters (1 degree latitude ~ 111111m)
        const distSq = (dLat * dLat + dLng * dLng) * 1.23e10;
        const timePassed = now - lastTimeRef.current;

        // Skip re-rendering if they moved less than 1.5m and less than 3 seconds passed
        if (distSq < 2.25 && timePassed < 3000) {
          return;
        }
      }

      lastPosRef.current = { lat, lng };
      lastTimeRef.current = now;
      setUserPos({ lat, lng });
      setGpsError('');
    };

    const errorHandler = err => {
      console.warn("watchPosition high accuracy failed, trying normal accuracy:", err);
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      watchId.current = navigator.geolocation.watchPosition(
        successHandler,
        finalErrorHandler,
        { enableHighAccuracy: false, maximumAge: 25000, timeout: 25000 }
      );
    };

    const finalErrorHandler = err => {
      console.warn("watchPosition final error:", err);
      setGpsError('GPS unavailable');
      if (err.code === 1) {
        alert("Konum izni reddedildi! Lütfen telefonunuzun tarayıcı ayarlarından (Safari/Chrome -> Konum Servisleri -> İzin Ver) konum erişimini etkinleştirin.");
      }
    };

    watchId.current = navigator.geolocation.watchPosition(
      successHandler,
      errorHandler,
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 12000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    lastPosRef.current = null;
    lastTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopGPS(), [stopGPS]);

  return { userPos, gpsError, startGPS, stopGPS };
}

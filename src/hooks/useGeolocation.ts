import { useState, useEffect } from "react";
import { logger } from "../lib/logger";

interface Location {
  lat: number;
  lng: number;
}

interface UseGeolocationReturn {
  isTracking: boolean;
  userLocation: Location | null;
  startTracking: () => void;
  stopTracking: () => void;
  toggleTracking: () => void;
}

/**
 * Custom hook for tracking user's geolocation
 *
 * Uses browser's watchPosition API with high accuracy
 * Handles permissions and errors gracefully
 *
 * @returns Tracking state, user location, and control functions
 */
export function useGeolocation(): UseGeolocationReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!isTracking) {
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsTracking(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        logger.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied");
        }
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking]);

  function startTracking(): void {
    setIsTracking(true);
  }

  function stopTracking(): void {
    setIsTracking(false);
  }

  function toggleTracking(): void {
    setIsTracking((prev) => !prev);
  }

  return {
    isTracking,
    userLocation,
    startTracking,
    stopTracking,
    toggleTracking,
  };
}

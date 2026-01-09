import { useRef, useEffect, useCallback, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Default center: Paris
const DEFAULT_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
};
const DEFAULT_ZOOM = 12;

interface TripMapProps {
  tripId: Id<"trips">;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  onMapClick: (lat: number, lng: number) => void;
  flyToLocation?: { lat: number; lng: number; key?: number };
}

export function TripMap({
  tripId,
  selectedLocationId,
  onLocationSelect,
  onMapClick,
  flyToLocation,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);

  const locations = useQuery(api.locations.listByTrip, { tripId });

  // Track if map has loaded
  const [mapLoaded, setMapLoaded] = useState(false);

  // Handle map load - position map appropriately
  const handleMapLoad = useCallback(() => {
    setMapLoaded(true);

    if (!mapRef.current || !locations || locations.length === 0) return;

    // If a location is selected, fly to it
    if (selectedLocationId) {
      const selectedLocation = locations.find((loc) => loc._id === selectedLocationId);
      if (selectedLocation) {
        mapRef.current.flyTo({
          center: [selectedLocation.longitude, selectedLocation.latitude],
          zoom: 15,
          duration: 0, // Instant on load
        });
        return;
      }
    }

    // Otherwise fit to all locations
    const bounds = new LngLatBounds();
    locations.forEach((loc) => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 0, // Instant on load
    });
  }, [locations, selectedLocationId]);

  // Fit bounds to show all locations when selection is cleared
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !locations || locations.length === 0) return;
    if (selectedLocationId) return; // Don't fit if a location is selected
    if (flyToLocation) return; // Don't fit if flying to search result

    // Create bounds from all locations
    const bounds = new LngLatBounds();
    locations.forEach((loc) => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000,
    });
  }, [selectedLocationId, locations, flyToLocation, mapLoaded]);

  // Fly to selected location when it changes
  useEffect(() => {
    if (!selectedLocationId || !locations || !mapRef.current) return;

    const selectedLocation = locations.find(
      (loc) => loc._id === selectedLocationId
    );

    if (selectedLocation) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedLocationId, locations]);

  // Fly to search result location
  useEffect(() => {
    if (!flyToLocation || !mapRef.current) return;

    // Small delay to ensure map is ready
    const timer = setTimeout(() => {
      mapRef.current?.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: 15,
        duration: 1000,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [flyToLocation?.lat, flyToLocation?.lng, flyToLocation?.key]);

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat;
      onMapClick(lat, lng);
    },
    [onMapClick]
  );

  return (
    <div className="w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          latitude: DEFAULT_CENTER.latitude,
          longitude: DEFAULT_CENTER.longitude,
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={handleMapClick}
        onLoad={handleMapLoad}
      >
        <NavigationControl position="top-right" />

        {locations?.map((location) => (
          <Marker
            key={location._id}
            latitude={location.latitude}
            longitude={location.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onLocationSelect(location._id);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                selectedLocationId === location._id
                  ? "bg-blue-600 scale-125"
                  : location.isHotel
                    ? "bg-purple-500"
                    : "bg-red-500"
              }`}
            >
              {location.isHotel ? (
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}

import { useRef, useEffect, useCallback, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useDarkMode } from "../../hooks";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Default center: Paris
const DEFAULT_CENTER = {
  latitude: 48.8566,
  longitude: 2.3522,
};
const DEFAULT_ZOOM = 12;

interface MapClickResult {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface TripMapProps {
  tripId: Id<"trips">;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  onMapClick: (result: MapClickResult) => void;
  onCenterChange?: (lat: number, lng: number) => void;
  flyToLocation?: { lat: number; lng: number; key?: number };
  pendingLocation?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
}

export function TripMap({
  tripId,
  selectedLocationId,
  onLocationSelect,
  onMapClick,
  onCenterChange,
  flyToLocation,
  pendingLocation,
  userLocation,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);
  const isDark = useDarkMode();

  const locations = useQuery(api.locations.listByTrip, { tripId });

  // Track if map has loaded
  const [mapLoaded, setMapLoaded] = useState(false);

  // Track if map is being dragged for cursor style
  const [isDragging, setIsDragging] = useState(false);

  // Track if we've flown to user location this session
  const [hasFlownToUser, setHasFlownToUser] = useState(false);

  // Map style based on dark mode
  const mapStyle = isDark
    ? "mapbox://styles/mapbox/dark-v11"
    : "mapbox://styles/mapbox/streets-v12";

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

  // Fly to search result location (only when key changes, not on every map click)
  useEffect(() => {
    if (!flyToLocation || !mapRef.current || !flyToLocation.key) return;

    // Small delay to ensure map is ready
    const timer = setTimeout(() => {
      mapRef.current?.flyTo({
        center: [flyToLocation.lng, flyToLocation.lat],
        zoom: 15,
        duration: 1000,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [flyToLocation?.key]);

  // Fly to user location when tracking is first enabled
  useEffect(() => {
    if (!userLocation || hasFlownToUser || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 15,
      duration: 1000,
    });
    setHasFlownToUser(true);
  }, [userLocation, hasFlownToUser]);

  // Reset fly-to flag when tracking is disabled
  useEffect(() => {
    if (!userLocation) {
      setHasFlownToUser(false);
    }
  }, [userLocation]);

  const handleMapClick = useCallback(
    async (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat;

      // Immediately call with coordinates, then update with name if found
      onMapClick({ lat, lng });

      // Try reverse geocoding to get place name
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,address&limit=1`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            // Only update if it's a POI (has a specific name)
            if (feature.properties?.category || feature.place_type?.includes('poi')) {
              let address = feature.place_name;
              if (address.startsWith(feature.text)) {
                address = address.slice(feature.text.length).replace(/^,\s*/, "");
              }
              onMapClick({
                lat,
                lng,
                name: feature.text,
                address: address || undefined,
              });
            }
          }
        }
      } catch (error) {
        // Silently fail - we already have coordinates
        console.error("Reverse geocoding failed:", error);
      }
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
        mapStyle={mapStyle}
        cursor={isDragging ? "grabbing" : "default"}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onMoveEnd={(e) => {
          if (onCenterChange) {
            const center = e.viewState;
            onCenterChange(center.latitude, center.longitude);
          }
        }}
      >
        <NavigationControl position="top-right" />

        {locations?.map((location) => {
          // Determine color based on location type
          const getMarkerColor = () => {
            if (selectedLocationId === location._id) return "bg-blue-600 scale-125";
            switch (location.locationType) {
              case "hotel": return "bg-purple-500";
              case "restaurant": return "bg-orange-500";
              case "attraction":
              default: return "bg-blue-500";
            }
          };

          // Render icon based on location type
          const renderIcon = () => {
            switch (location.locationType) {
              case "hotel":
                return (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                );
              case "restaurant":
                return (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M7 0a1 1 0 0 1 1 1v5a1 1 0 0 1-.29.71L6 8.41V15a1 1 0 1 1-2 0V8.41L2.29 6.71A1 1 0 0 1 2 6V1a1 1 0 0 1 2 0v4.59l.5.5.5-.5V1a1 1 0 0 1 2 0zm7 1v14a1 1 0 1 1-2 0v-5h-1a1 1 0 0 1-1-1V5c0-2.21 1.79-4 4-4z" />
                  </svg>
                );
              case "attraction":
              default:
                return (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                );
            }
          };

          return (
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
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform ${getMarkerColor()}`}
              >
                {renderIcon()}
              </div>
            </Marker>
          );
        })}

        {/* Temporary pin for pending location */}
        {pendingLocation && (
          <Marker
            latitude={pendingLocation.lat}
            longitude={pendingLocation.lng}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 animate-pulse border-2 border-white shadow-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Marker>
        )}

        {/* User's current location */}
        {userLocation && (
          <Marker latitude={userLocation.lat} longitude={userLocation.lng}>
            <div className="relative flex items-center justify-center">
              {/* Outer pulse ring */}
              <div className="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping" />
              {/* Inner dot with white border */}
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}

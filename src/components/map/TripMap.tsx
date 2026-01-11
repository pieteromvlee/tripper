import { useRef, useEffect, useCallback, useState } from "react";
import Map, { Marker, NavigationControl, type MapRef, type MapMouseEvent } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useDarkMode } from "../../hooks";
import { CategoryIcon } from "../../lib/typeIcons";

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
  selectedDate?: string | null; // ISO date string for filtering
  categories?: Doc<"categories">[];
  visibleCategories?: Set<Id<"categories">>; // Filter by category
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
  selectedDate,
  categories,
  visibleCategories,
  onLocationSelect,
  onMapClick,
  onCenterChange,
  flyToLocation,
  pendingLocation,
  userLocation,
}: TripMapProps) {
  const mapRef = useRef<MapRef>(null);
  const isDark = useDarkMode();

  const allLocations = useQuery(api.locations.listByTrip, { tripId });
  const filteredLocations = useQuery(
    api.locations.listByTripAndDate,
    selectedDate ? { tripId, date: selectedDate } : "skip"
  );

  // Use filtered locations when date is selected, otherwise all
  const baseLocations = selectedDate ? filteredLocations : allLocations;

  // Apply category filter (backward compatible - show locations without categoryId)
  const locations = baseLocations?.filter(
    (loc) => !visibleCategories || !loc.categoryId || visibleCategories.has(loc.categoryId)
  );

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

  // Track previous selection to detect when it's cleared
  const prevSelectedLocationId = useRef(selectedLocationId);

  // Fit bounds to show all locations when selection is cleared
  useEffect(() => {
    // Only fit bounds when selection is cleared (was selected, now null)
    const wasSelected = prevSelectedLocationId.current !== null;
    prevSelectedLocationId.current = selectedLocationId;

    if (!mapLoaded || !mapRef.current || !allLocations || allLocations.length === 0) return;
    if (selectedLocationId) return; // Don't fit if a location is selected
    if (flyToLocation) return; // Don't fit if flying to search result
    if (!wasSelected) return; // Only fit when clearing selection, not on filter changes

    // Create bounds from ALL locations (not filtered) when clearing selection
    const bounds = new LngLatBounds();
    allLocations.forEach((loc) => {
      bounds.extend([loc.longitude, loc.latitude]);
    });

    mapRef.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000,
    });
  }, [selectedLocationId, allLocations, flyToLocation, mapLoaded]);

  // Fly to selected location when it changes
  useEffect(() => {
    if (!selectedLocationId || !allLocations || !mapRef.current) return;

    // Use allLocations to find the location (stable, not affected by filtering)
    const selectedLocation = allLocations.find(
      (loc) => loc._id === selectedLocationId
    );

    if (selectedLocation) {
      mapRef.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedLocationId, allLocations]);

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
            const isPOI = feature.properties?.category || feature.place_type?.includes('poi');

            if (isPOI) {
              // POI: Extract name and address separately
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
            } else {
              // Generic address: Use full place_name as address, no name
              onMapClick({
                lat,
                lng,
                address: feature.place_name || undefined,
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

        {locations?.map((location, index) => {
          // Find category for this location
          const category = categories?.find(c => c._id === location.categoryId);
          const isSelected = selectedLocationId === location._id;

          // Generate color styles from category color (or default blue)
          const baseColor = category?.color || "#3B82F6";

          // Render icon or number (when filtered by date)
          const renderIcon = () => {
            // Show number when filtered by date
            if (selectedDate) {
              return (
                <span className="text-white text-sm font-bold">{index + 1}</span>
              );
            }

            // Show category icon
            if (category) {
              return (
                <CategoryIcon
                  iconName={category.iconName}
                  className="w-4 h-4 text-white"
                />
              );
            }

            // Fallback to default icon if no category
            return (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            );
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
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform ${isSelected ? "scale-125" : ""}`}
                style={{ backgroundColor: baseColor }}
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

import { useMemo } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

interface TripMapPreviewProps {
  locations: Location[];
  width?: number;
  height?: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Calculate center and zoom to fit all locations
function calculateBounds(locations: Location[]) {
  const lats = locations.map((l) => l.latitude);
  const lngs = locations.map((l) => l.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate zoom based on the span
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const maxSpan = Math.max(latSpan, lngSpan);

  // Rough zoom calculation (higher zoom = more zoomed in)
  let zoom = 12;
  if (maxSpan > 10) zoom = 4;
  else if (maxSpan > 5) zoom = 5;
  else if (maxSpan > 2) zoom = 6;
  else if (maxSpan > 1) zoom = 7;
  else if (maxSpan > 0.5) zoom = 8;
  else if (maxSpan > 0.2) zoom = 9;
  else if (maxSpan > 0.1) zoom = 10;
  else if (maxSpan > 0.05) zoom = 11;
  else if (maxSpan > 0.01) zoom = 12;
  else zoom = 13;

  return { centerLat, centerLng, zoom };
}

export function TripMapPreview({ locations, width = 280, height = 200 }: TripMapPreviewProps) {
  const mapUrl = useMemo(() => {
    if (!locations.length || !MAPBOX_TOKEN) return null;

    const { centerLat, centerLng, zoom } = calculateBounds(locations);

    // Static map without markers - just show the area
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${centerLng.toFixed(5)},${centerLat.toFixed(5)},${zoom},0/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  }, [locations, width, height]);

  if (!mapUrl) {
    // Empty state placeholder
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ width, height }}
      >
        <svg
          className="w-12 h-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={mapUrl}
      alt="Trip locations preview"
      className="rounded-lg object-cover"
      style={{ width, height }}
      loading="lazy"
    />
  );
}

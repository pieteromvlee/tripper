import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { MapPanel } from "../map/MapPanel";
import { CalendarView } from "./CalendarView";
import { ErrorBoundary } from "../ErrorBoundary";

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface NewLocationData {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface MapPanelProps {
  tripId: Id<"trips">;
  isMobile: boolean;
  viewMode: "list" | "map" | "calendar";
  sidebarVisible: boolean;
  showSearch: boolean;
  onSearchClose: () => void;
  onSearchSelect: (result: LocationSearchResult) => void;
  selectedLocationId: Id<"locations"> | null;
  selectedLocation: Doc<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  onClearSelection: () => void;
  onShowLocationDetail: (id: Id<"locations">) => void;
  onTriggerFlyTo: () => void;
  mapCenter: { lat: number; lng: number } | null;
  onMapCenterChange: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
  showAddForm: boolean;
  newLocationData: NewLocationData | null;
  onMapClick: (result: { lat: number; lng: number }) => void;
  onFormCancel: () => void;
  onShowFullscreenForm: () => void;
  flyToCounter: number;
  selectedDate: string | null | "unscheduled";
  categories: Doc<"categories">[] | undefined;
  visibleCategories: Set<Id<"categories">>;
}

interface DetailPanelProps {
  // View mode
  isMobile: boolean;
  viewMode: "list" | "map" | "calendar";
  detailViewMode: "map" | "calendar";
  isMapView: boolean;
  isCalendarView: boolean;

  // Map panel props (pass-through)
  mapPanelProps: MapPanelProps;

  // Calendar panel props
  tripId: Id<"trips">;
  locations: Doc<"locations">[] | undefined;
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelectForCalendar: (id: Id<"locations">) => void;
  visibleCategories: Set<Id<"categories">>;
}

export function DetailPanel({
  isMobile,
  viewMode,
  isMapView,
  isCalendarView,
  mapPanelProps,
  tripId,
  locations,
  categories,
  selectedLocationId,
  onLocationSelectForCalendar,
  visibleCategories,
}: DetailPanelProps) {
  // Only show detail panel if not in list view on mobile, or always on desktop
  const shouldShow = isMobile ? viewMode !== "list" : true;

  if (!shouldShow) return null;

  return (
    <div className="flex-1 w-full relative">
      {/* Show Map */}
      {isMapView && <MapPanel {...mapPanelProps} />}

      {/* Show Calendar (desktop only) */}
      {isCalendarView && !isMobile && (
        <ErrorBoundary>
          <CalendarView
            tripId={tripId}
            locations={locations}
            categories={categories}
            selectedLocationId={selectedLocationId}
            onLocationSelect={onLocationSelectForCalendar}
            visibleCategories={visibleCategories}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

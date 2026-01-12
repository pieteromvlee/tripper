import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { TripMap } from "./TripMap";
import { LocationSearchBar } from "./LocationSearchBar";
import { SelectionPopover } from "./SelectionPopover";
import { ErrorBoundary, MapErrorFallback } from "../ErrorBoundary";

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

  // View state
  isMobile: boolean;
  viewMode: "list" | "map" | "calendar";
  sidebarVisible: boolean;

  // Search
  showSearch: boolean;
  onSearchClose: () => void;
  onSearchSelect: (result: LocationSearchResult) => void;

  // Selection
  selectedLocationId: Id<"locations"> | null;
  selectedLocation: Doc<"locations"> | null | undefined;
  onLocationSelect: (id: Id<"locations">) => void;
  onClearSelection: () => void;
  onShowLocationDetail: (id: Id<"locations">) => void;
  onTriggerFlyTo: () => void;

  // Map state
  mapCenter: { lat: number; lng: number } | null;
  onMapCenterChange: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;

  // Form state
  showAddForm: boolean;
  newLocationData: NewLocationData | null;
  onMapClick: (result: { lat: number; lng: number }) => void;
  onFormCancel: () => void;
  onShowFullscreenForm: () => void;
  flyToCounter: number;

  // Data
  selectedDate: string | null | "unscheduled";
  categories: Doc<"categories">[] | undefined;
  visibleCategories: Set<Id<"categories">>;
}

// Sub-component for pending location actions
function PendingLocationActions({
  locationName,
  onCancel,
  onAdd,
}: {
  locationName?: string;
  onCancel: () => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="absolute right-4 z-10 flex flex-col gap-2"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Location name label */}
      <div className="bg-green-500/10 border border-green-500/50 px-3 py-2 text-xs font-medium text-green-400 max-w-[200px] truncate">
        {locationName || "New Location"}
      </div>
      <div className="flex gap-2">
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="bg-surface-elevated p-3 border border-border text-text-secondary hover:bg-surface-secondary hover:border-border-focus transition"
          title="Cancel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Add button */}
        <button
          onClick={onAdd}
          className="bg-green-600 p-3 border border-green-400 text-white hover:bg-green-500 transition"
          title="Add location"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function MapPanel({
  tripId,
  isMobile,
  viewMode,
  sidebarVisible,
  showSearch,
  onSearchClose,
  onSearchSelect,
  selectedLocationId,
  selectedLocation,
  onLocationSelect,
  onClearSelection,
  onShowLocationDetail,
  onTriggerFlyTo,
  mapCenter,
  onMapCenterChange,
  userLocation,
  showAddForm,
  newLocationData,
  onMapClick,
  onFormCancel,
  onShowFullscreenForm,
  flyToCounter,
  selectedDate,
  categories,
  visibleCategories,
}: MapPanelProps) {
  // Determine if search should be floating (map-only view)
  const isFloatingSearch = isMobile ? viewMode === "map" : !sidebarVisible;

  // Determine if pending location actions should be shown
  const showPendingActions = showAddForm && newLocationData && isFloatingSearch;

  // Determine if we're in map view (for hiding redundant map button in SelectionPopover)
  const isInMapView = isMobile ? viewMode === "map" : true;

  return (
    <>
      {/* Floating Search for map-only view */}
      {isFloatingSearch && (
        <LocationSearchBar
          show={showSearch}
          onClose={onSearchClose}
          onSelect={onSearchSelect}
          variant="floating"
          proximity={mapCenter}
        />
      )}

      <ErrorBoundary fallback={(error, resetError) => <MapErrorFallback error={error} resetError={resetError} />}>
        <TripMap
          key={isMobile ? viewMode : `desktop-${sidebarVisible}`}
          tripId={tripId}
          selectedLocationId={selectedLocationId}
          selectedDate={selectedDate}
          categories={categories}
          visibleCategories={visibleCategories}
          onLocationSelect={onLocationSelect}
          onMapClick={onMapClick}
          onCenterChange={onMapCenterChange}
          flyToLocation={newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng, key: flyToCounter } : undefined}
          pendingLocation={showAddForm && newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng } : null}
          userLocation={userLocation}
        />
      </ErrorBoundary>

      {/* Show All button - appears when a location is selected */}
      {selectedLocationId && (
        <button
          onClick={onClearSelection}
          className="absolute left-4 z-10 bg-surface-elevated px-3 py-2 border border-border text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:border-border-focus flex items-center gap-2"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Show All
        </button>
      )}

      {/* Selection popover - top-left of map pane */}
      {selectedLocation && (!isMobile || viewMode === "map") && !showAddForm && (
        <div className={`absolute left-3 z-10 ${showSearch ? "top-16" : "top-3"}`}>
          <SelectionPopover
            location={selectedLocation}
            category={categories?.find(c => c._id === selectedLocation.categoryId)}
            onInfo={() => onShowLocationDetail(selectedLocation._id)}
            onFlyTo={onTriggerFlyTo}
            onClose={onClearSelection}
            isMobile={isMobile}
            isInMapView={isInMapView}
          />
        </div>
      )}

      {/* Floating action buttons for pending location (map-only or sidebar hidden) */}
      {showPendingActions && (
        <PendingLocationActions
          locationName={newLocationData.name}
          onCancel={onFormCancel}
          onAdd={onShowFullscreenForm}
        />
      )}
    </>
  );
}

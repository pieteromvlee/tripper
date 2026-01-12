import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { LocationList } from "./LocationList";
import { LocationForm } from "./LocationForm";
import { LocationSearchBar } from "../map/LocationSearchBar";
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

interface ListPanelProps {
  tripId: Id<"trips">;
  isMobile: boolean;

  // Search
  showSearch: boolean;
  onSearchClose: () => void;
  onSearchSelect: (result: LocationSearchResult) => void;
  mapCenter: { lat: number; lng: number } | null;

  // Location form
  showAddForm: boolean;
  newLocationData: NewLocationData | null;
  onFormSuccess: () => void;
  onFormCancel: () => void;

  // Location list
  selectedDate?: string | null | "unscheduled";
  selectedLocationId?: Id<"locations"> | null;
  categories?: Doc<"categories">[];
  visibleCategories: Set<Id<"categories">>;
  onLocationSelect: (id: Id<"locations">) => void;
  scrollTrigger: number;
}

export function ListPanel({
  tripId,
  isMobile,
  showSearch,
  onSearchClose,
  onSearchSelect,
  mapCenter,
  showAddForm,
  newLocationData,
  onFormSuccess,
  onFormCancel,
  selectedDate,
  selectedLocationId,
  categories,
  visibleCategories,
  onLocationSelect,
  scrollTrigger,
}: ListPanelProps) {
  return (
    <div className={`flex flex-col bg-surface-elevated ${!isMobile ? "w-96 border-r border-border" : "flex-1"}`}>
      {/* Search */}
      <LocationSearchBar
        show={showSearch}
        onClose={onSearchClose}
        onSelect={onSearchSelect}
        variant="inline"
        proximity={mapCenter}
      />

      {/* Location List or Add Form */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {showAddForm && newLocationData ? (
          <div>
            <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Add New Location</span>
              <button onClick={onFormCancel} className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <LocationForm
              tripId={tripId}
              latitude={newLocationData.lat}
              longitude={newLocationData.lng}
              initialName={newLocationData.name}
              initialAddress={newLocationData.address}
              onSuccess={onFormSuccess}
              onCancel={onFormCancel}
              variant="inline"
            />
          </div>
        ) : (
          <ErrorBoundary>
            <LocationList
              tripId={tripId}
              selectedDate={selectedDate ?? undefined}
              selectedLocationId={selectedLocationId ?? undefined}
              categories={categories}
              visibleCategories={visibleCategories}
              onLocationSelect={onLocationSelect}
              scrollTrigger={scrollTrigger}
            />
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

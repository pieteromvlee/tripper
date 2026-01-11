import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { LocationCard } from "./LocationCard";

interface LocationListProps {
  tripId: Id<"trips">;
  selectedDate?: string; // ISO date string (YYYY-MM-DD) for filtering
  selectedLocationId?: Id<"locations">;
  categories?: Doc<"categories">[];
  visibleCategories?: Set<Id<"categories">>; // Filter by category
  onLocationSelect: (locationId: Id<"locations">) => void;
  scrollTrigger?: number; // Incremented when the list should scroll to the selected location
}

export function LocationList({
  tripId,
  selectedDate,
  selectedLocationId,
  categories,
  visibleCategories,
  onLocationSelect,
  scrollTrigger,
}: LocationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  // Query locations based on whether a date filter is applied
  // Only run one query at a time to avoid unnecessary database calls
  const allLocations = useQuery(
    api.locations.listByTrip,
    selectedDate ? "skip" : { tripId }
  );
  const filteredLocations = useQuery(
    api.locations.listByTripAndDate,
    selectedDate ? { tripId, date: selectedDate } : "skip"
  );

  // Use filtered locations if date is selected, otherwise all locations
  const dateFilteredLocations = selectedDate ? filteredLocations : allLocations;

  // Apply category filter (backward compatible - show locations without categoryId)
  const locations = dateFilteredLocations?.filter(
    (loc) => !visibleCategories || !loc.categoryId || visibleCategories.has(loc.categoryId)
  );

  // Scroll selected location into view when it changes or when triggered from map marker click
  useEffect(() => {
    if (selectedLocationId && selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedLocationId, scrollTrigger]);

  // Loading state
  if (locations === undefined) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading locations...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center px-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-secondary flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-text-secondary font-medium">No locations yet</p>
          <p className="text-sm text-text-muted mt-1">
            {selectedDate || (visibleCategories && categories && visibleCategories.size < categories.length)
              ? "No locations match the current filters"
              : "Tap the map or search to add your first location"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-2 overflow-y-auto p-3"
    >
      {locations.map((location) => {
        const isSelected = location._id === selectedLocationId;
        return (
          <div
            key={location._id}
            ref={isSelected ? selectedRef : undefined}
          >
            <LocationCard
              location={location}
              categories={categories}
              isSelected={isSelected}
              onClick={() => onLocationSelect(location._id)}
              selectedDate={selectedDate}
            />
          </div>
        );
      })}
    </div>
  );
}

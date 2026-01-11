import { useEffect, useRef, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { LocationCard } from "./LocationCard";
import { getDatePart, formatDateForDisplay } from "../../lib/dateUtils";

function DateSeparator({ date }: { date: string }) {
  const label = date === "unscheduled"
    ? "Unscheduled"
    : formatDateForDisplay(date); // "Fri, Jan 16"

  return (
    <div className="px-3 py-2 bg-surface-elevated border-b border-border">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        {label}
      </h3>
    </div>
  );
}

interface LocationListProps {
  tripId: Id<"trips">;
  selectedDate?: string | "unscheduled"; // ISO date string (YYYY-MM-DD), "unscheduled", or undefined for "All"
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

  const isSpecificDate = selectedDate && selectedDate !== "unscheduled";

  const allLocations = useQuery(
    api.locations.listByTrip,
    !isSpecificDate ? { tripId } : "skip"
  );

  const dateLocations = useQuery(
    api.locations.listByTripAndDate,
    isSpecificDate ? { tripId, date: selectedDate } : "skip"
  );

  // Memoize date-filtered locations to avoid recalculation on every render
  const dateFilteredLocations = useMemo(() => {
    if (selectedDate === "unscheduled") {
      return allLocations?.filter(loc => !loc.dateTime);
    }
    if (isSpecificDate) {
      return dateLocations;
    }
    return allLocations;
  }, [selectedDate, isSpecificDate, allLocations, dateLocations]);

  // Memoize category-filtered locations to avoid recalculation on every render
  const locations = useMemo(() => {
    if (!dateFilteredLocations || !visibleCategories) return dateFilteredLocations;
    return dateFilteredLocations.filter(
      loc => !loc.categoryId || visibleCategories.has(loc.categoryId)
    );
  }, [dateFilteredLocations, visibleCategories]);

  // Group locations by date when in "All" view
  const groupedLocations = useMemo(() => {
    // Only group in "All" view (selectedDate is null/undefined)
    if (selectedDate !== null && selectedDate !== undefined) {
      return { grouped: false, items: locations };
    }

    if (!locations) {
      return { grouped: false, items: [] };
    }

    // Separate scheduled and unscheduled locations
    const scheduled: Map<string, typeof locations> = new Map();
    const unscheduled: typeof locations = [];

    locations.forEach(loc => {
      if (!loc.dateTime) {
        unscheduled.push(loc);
      } else {
        const date = getDatePart(loc.dateTime); // "2026-01-16"
        if (!scheduled.has(date)) {
          scheduled.set(date, []);
        }
        scheduled.get(date)!.push(loc);
      }
    });

    // Sort groups by date, sort locations within each group by time
    const sortedGroups = Array.from(scheduled.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort dates chronologically
      .map(([date, locs]) => ({
        date,
        locations: [...locs].sort((a, b) =>
          a.dateTime!.localeCompare(b.dateTime!) // Sort by full datetime
        )
      }));

    return {
      grouped: true,
      groups: sortedGroups,
      unscheduled: [...unscheduled].sort((a, b) => a.sortOrder - b.sortOrder)
    };
  }, [locations, selectedDate]);

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

  if (locations.length === 0) {
    const hasActiveFilters =
      selectedDate ||
      (visibleCategories && categories && visibleCategories.size < categories.length);

    const emptyMessage = hasActiveFilters
      ? "No locations match the current filters"
      : "Tap the map or search to add your first location";

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
          <p className="text-sm text-text-muted mt-1">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col overflow-y-auto">
      {!groupedLocations.grouped ? (
        // Flat list for date-specific and unscheduled filters
        <div className="flex flex-col gap-2 p-3">
          {groupedLocations.items?.map((location) => {
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
      ) : (
        // Grouped list for "All" view
        <>
          {groupedLocations.groups.map(({ date, locations: groupLocs }) => (
            <div key={date}>
              <DateSeparator date={date} />
              <div className="flex flex-col gap-2 p-3">
                {groupLocs.map((location) => {
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
            </div>
          ))}

          {/* Unscheduled section at bottom */}
          {groupedLocations.unscheduled.length > 0 && (
            <div>
              <DateSeparator date="unscheduled" />
              <div className="flex flex-col gap-2 p-3">
                {groupedLocations.unscheduled.map((location) => {
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useMemo } from "react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { getDatePart } from "../lib/dateUtils";

interface FilterOptions {
  date?: string | "unscheduled" | null;
  visibleCategories?: Set<Id<"categories">>;
  includeUnscheduled?: boolean; // When filtering by date, whether to include unscheduled locations
}

/**
 * Custom hook to filter locations by date and category.
 * Memoized to avoid recalculation on every render.
 *
 * @param locations - Array of location documents
 * @param options - Filter options
 * @returns Filtered array of locations
 */
export function useFilteredLocations(
  locations: Doc<"locations">[] | undefined,
  options: FilterOptions
): Doc<"locations">[] | undefined {
  const { date, visibleCategories, includeUnscheduled = false } = options;

  return useMemo(() => {
    if (!locations) return undefined;

    return locations.filter((loc) => {
      // Filter by date
      if (date !== undefined && date !== null) {
        // Special case: filter for unscheduled locations
        if (date === "unscheduled") {
          if (loc.dateTime) return false;
        } else {
          // Filter for specific date
          if (!loc.dateTime) {
            if (!includeUnscheduled) return false;
          } else {
            const locDate = getDatePart(loc.dateTime);
            if (locDate !== date) return false;
          }
        }
      }

      // Filter by category (backward compatible - show locations without categoryId)
      if (visibleCategories) {
        if (loc.categoryId && !visibleCategories.has(loc.categoryId)) {
          return false;
        }
      }

      return true;
    });
  }, [locations, date, visibleCategories, includeUnscheduled]);
}

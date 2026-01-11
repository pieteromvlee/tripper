import { useState, useCallback, useMemo } from "react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

type Location = Doc<"locations">;

interface UseLocationSelectionReturn {
  selectedLocationId: Id<"locations"> | null;
  selectedLocation: Location | undefined;
  selectLocation: (id: Id<"locations"> | null) => void;
  selectAndFlyTo: (id: Id<"locations">) => void;
  selectAndScrollTo: (id: Id<"locations">) => void;
  clearSelection: () => void;
  triggerFlyTo: () => void;
  flyToCounter: number;
  scrollToCounter: number;
}

/**
 * Hook for managing location selection state across list, map, and calendar.
 * Provides a single source of truth for selection with fly-to and scroll-to triggers.
 */
export function useLocationSelection(
  locations: Location[] | undefined
): UseLocationSelectionReturn {
  const [selectedLocationId, setSelectedLocationId] = useState<Id<"locations"> | null>(null);
  const [flyToCounter, setFlyToCounter] = useState(0);
  const [scrollToCounter, setScrollToCounter] = useState(0);

  const selectedLocation = useMemo(
    () => locations?.find((loc) => loc._id === selectedLocationId),
    [locations, selectedLocationId]
  );

  const selectLocation = useCallback((id: Id<"locations"> | null) => {
    setSelectedLocationId(id);
  }, []);

  const selectAndFlyTo = useCallback((id: Id<"locations">) => {
    setSelectedLocationId(id);
    setFlyToCounter((prev) => prev + 1);
  }, []);

  const selectAndScrollTo = useCallback((id: Id<"locations">) => {
    setSelectedLocationId(id);
    setScrollToCounter((prev) => prev + 1);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLocationId(null);
  }, []);

  const triggerFlyTo = useCallback(() => {
    setFlyToCounter((prev) => prev + 1);
  }, []);

  return {
    selectedLocationId,
    selectedLocation,
    selectLocation,
    selectAndFlyTo,
    selectAndScrollTo,
    clearSelection,
    triggerFlyTo,
    flyToCounter,
    scrollToCounter,
  };
}

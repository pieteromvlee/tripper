import { useEffect, useRef, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { LocationCard } from "./LocationCard";
import { getDatePart, formatDateForDisplay, combineDateTime } from "../../lib/dateUtils";
import { TimeConfirmPopover } from "./TimeConfirmPopover";
import { calculateDropTime } from "../../lib/timeCalculation";

// Types for grouped locations
interface GroupedLocationsResult {
  grouped: true;
  groups: Array<{ date: string; locations: Doc<"locations">[] }>;
  unscheduled: Doc<"locations">[];
}

interface FlatLocationsResult {
  grouped: false;
  items: Doc<"locations">[] | undefined;
}

type LocationsResult = GroupedLocationsResult | FlatLocationsResult;

// Drop zone data passed via dnd-kit
interface DropZoneData {
  date: string;
  insertIndex: number;
}

// Pending drop state for confirmation
interface PendingDrop {
  locationId: Id<"locations">;
  targetDate: string;
  suggestedTime: string;
  oldDateTime: string | undefined;
}

function DropIndicator(): React.ReactNode {
  return (
    <div className="absolute left-0 right-0 top-1/2 translate-y-1 h-px bg-blue-500 pointer-events-none z-10" />
  );
}

function DropZone({
  id,
  date,
  insertIndex,
}: {
  id: string;
  date: string;
  insertIndex: number;
}): React.ReactNode {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date, insertIndex } as DropZoneData,
  });

  return (
    <div
      ref={setNodeRef}
      className="h-5 -my-2.5 relative flex items-center"
    >
      {isOver && <DropIndicator />}
    </div>
  );
}

function DroppableDateGroup({
  date,
  isEmpty,
  children,
}: {
  date: string;
  isEmpty: boolean;
  children: React.ReactNode;
}): React.ReactNode {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${date}`,
    data: { date, insertIndex: 0 } as DropZoneData,
  });

  const label = date === "unscheduled" ? "Unscheduled" : formatDateForDisplay(date);

  return (
    <div ref={setNodeRef}>
      <div
        className={`px-3 py-2 bg-surface-elevated border-b border-border transition ${
          isOver && isEmpty ? "bg-green-500/10 ring-2 ring-green-500/50 ring-inset" : ""
        }`}
      >
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}

interface LocationListProps {
  tripId: Id<"trips">;
  selectedDate?: string | "unscheduled";
  selectedLocationId?: Id<"locations">;
  categories?: Doc<"categories">[];
  visibleCategories?: Set<Id<"categories">>;
  onLocationSelect: (locationId: Id<"locations">) => void;
  scrollTrigger?: number;
}

export function LocationList({
  tripId,
  selectedDate,
  selectedLocationId,
  categories,
  visibleCategories,
  onLocationSelect,
  scrollTrigger,
}: LocationListProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [draggedLocationId, setDraggedLocationId] = useState<Id<"locations"> | null>(null);

  const updateLocation = useMutation(api.locations.update);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const isSpecificDate = selectedDate && selectedDate !== "unscheduled";

  const allLocations = useQuery(
    api.locations.listByTrip,
    !isSpecificDate ? { tripId } : "skip"
  );

  const dateLocations = useQuery(
    api.locations.listByTripAndDate,
    isSpecificDate ? { tripId, date: selectedDate } : "skip"
  );

  // Filter by date
  const dateFilteredLocations = useMemo(() => {
    if (selectedDate === "unscheduled") {
      return allLocations?.filter(loc => !loc.dateTime);
    }
    if (isSpecificDate) {
      return dateLocations;
    }
    return allLocations;
  }, [selectedDate, isSpecificDate, allLocations, dateLocations]);

  // Filter by category
  const locations = useMemo(() => {
    if (!dateFilteredLocations || !visibleCategories) return dateFilteredLocations;
    return dateFilteredLocations.filter(
      loc => !loc.categoryId || visibleCategories.has(loc.categoryId)
    );
  }, [dateFilteredLocations, visibleCategories]);

  // Group locations by date, applying pending drop optimistically
  const groupedLocations = useMemo((): LocationsResult => {
    if (!locations) {
      return { grouped: false, items: [] };
    }

    // Apply pending drop to get optimistic location list
    const optimisticLocations = locations.map(loc => {
      if (pendingDrop && loc._id === pendingDrop.locationId) {
        // Override with pending drop's suggested dateTime
        return {
          ...loc,
          dateTime: combineDateTime(pendingDrop.targetDate, pendingDrop.suggestedTime),
        };
      }
      return loc;
    });

    if (selectedDate !== null && selectedDate !== undefined) {
      return { grouped: false, items: optimisticLocations };
    }

    const scheduled = new Map<string, Doc<"locations">[]>();
    const unscheduled: Doc<"locations">[] = [];

    for (const loc of optimisticLocations) {
      if (!loc.dateTime) {
        unscheduled.push(loc);
      } else {
        const date = getDatePart(loc.dateTime);
        const group = scheduled.get(date) || [];
        group.push(loc);
        scheduled.set(date, group);
      }
    }

    const sortedGroups = Array.from(scheduled.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, locs]) => ({
        date,
        locations: [...locs].sort((a, b) => a.dateTime!.localeCompare(b.dateTime!)),
      }));

    return {
      grouped: true,
      groups: sortedGroups,
      unscheduled: [...unscheduled].sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }, [locations, selectedDate, pendingDrop]);

  // Find the dragged location object
  const draggedLocation = useMemo(() => {
    if (!draggedLocationId || !locations) return null;
    return locations.find(loc => loc._id === draggedLocationId) || null;
  }, [draggedLocationId, locations]);

  // Scroll to selected location
  useEffect(() => {
    if (selectedLocationId && selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest" // Prevents horizontal scrolling
      });
    }
  }, [selectedLocationId, scrollTrigger]);

  function handleDragStart(event: DragStartEvent): void {
    setDraggedLocationId(event.active.id as Id<"locations">);
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over) {
      setDraggedLocationId(null);
      return;
    }

    const locationId = active.id as Id<"locations">;
    const location = locations?.find(loc => loc._id === locationId);
    if (!location) {
      setDraggedLocationId(null);
      return;
    }

    const overData = over.data?.current as DropZoneData | undefined;
    if (!overData) {
      setDraggedLocationId(null);
      return;
    }

    const { date: targetDate, insertIndex } = overData;

    // Handle dropping to unscheduled
    if (targetDate === "unscheduled") {
      updateLocation({ id: locationId, dateTime: undefined });
      setDraggedLocationId(null);
      return;
    }

    // Check if dropping to same position
    const currentDate = location.dateTime ? getDatePart(location.dateTime) : null;
    if (currentDate === targetDate && groupedLocations.grouped) {
      const targetGroup = groupedLocations.groups.find(g => g.date === targetDate);
      if (targetGroup) {
        const currentIndex = targetGroup.locations.findIndex(loc => loc._id === locationId);
        // If dropping at same position or adjacent (which would result in same position), skip
        if (currentIndex === insertIndex || currentIndex === insertIndex - 1) {
          setDraggedLocationId(null);
          return;
        }
      }
    }

    // Get the target group's locations
    const targetGroupLocations = groupedLocations.grouped
      ? groupedLocations.groups.find(g => g.date === targetDate)?.locations || []
      : [];

    // Calculate previous and next locations for time calculation
    // insertIndex is where the new item will be inserted
    // - previousLocation is the item that will be BEFORE the dropped item
    // - nextLocation is the item that will be AFTER the dropped item
    let previousLocation: Doc<"locations"> | undefined;
    let nextLocation: Doc<"locations"> | undefined;

    // Filter out the dragged item when calculating positions (it may be in the same group)
    const otherLocations = targetGroupLocations.filter(loc => loc._id !== locationId);

    // Adjust insertIndex if we're in the same group and the dragged item was before insertIndex
    let adjustedIndex = insertIndex;
    if (currentDate === targetDate) {
      const draggedCurrentIndex = targetGroupLocations.findIndex(loc => loc._id === locationId);
      if (draggedCurrentIndex !== -1 && draggedCurrentIndex < insertIndex) {
        adjustedIndex = insertIndex - 1;
      }
    }

    previousLocation = adjustedIndex > 0 ? otherLocations[adjustedIndex - 1] : undefined;
    nextLocation = adjustedIndex < otherLocations.length ? otherLocations[adjustedIndex] : undefined;

    const suggestedTime = calculateDropTime(previousLocation, nextLocation, targetDate);

    setPendingDrop({
      locationId: location._id,
      targetDate,
      suggestedTime,
      oldDateTime: location.dateTime,
    });
  }

  async function handleConfirmDrop(editedDateTime: string): Promise<void> {
    if (!pendingDrop) return;

    await updateLocation({
      id: pendingDrop.locationId,
      dateTime: editedDateTime,
    });

    setPendingDrop(null);
    setDraggedLocationId(null);
  }

  function handleCancelDrop(): void {
    if (!pendingDrop) return;

    updateLocation({
      id: pendingDrop.locationId,
      dateTime: pendingDrop.oldDateTime,
    });

    setPendingDrop(null);
    setDraggedLocationId(null);
  }

  const isDndEnabled = selectedDate !== "unscheduled";

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
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  function renderLocationCard(location: Doc<"locations">): React.ReactNode {
    const isSelected = location._id === selectedLocationId;
    const isPendingDrop = pendingDrop?.locationId === location._id;
    const showAsSelected = isSelected || isPendingDrop;

    return (
      <div ref={isSelected ? selectedRef : undefined}>
        <LocationCard
          location={location}
          categories={categories}
          isSelected={showAsSelected}
          onClick={() => onLocationSelect(location._id)}
          selectedDate={selectedDate}
          isDndEnabled={isDndEnabled}
        />
      </div>
    );
  }

  function renderDateGroup(date: string, groupLocations: Doc<"locations">[]): React.ReactNode {
    return (
      <DroppableDateGroup key={date} date={date} isEmpty={groupLocations.length === 0}>
        <div className="flex flex-col gap-2 px-3 py-2">
          <DropZone id={`drop-${date}-0`} date={date} insertIndex={0} />

          {groupLocations.map((location, index) => (
            <div key={location._id}>
              {renderLocationCard(location)}
              <DropZone id={`drop-${date}-${index + 1}`} date={date} insertIndex={index + 1} />
            </div>
          ))}
        </div>
      </DroppableDateGroup>
    );
  }

  const listContent = (
    <div ref={containerRef} className="flex flex-col h-full w-full">
      {!groupedLocations.grouped ? (
        // Flat list for date-specific and unscheduled filters
        <div className="flex flex-col gap-2 p-3">
          {groupedLocations.items?.map(location => (
            <div key={location._id}>
              {renderLocationCard(location)}
            </div>
          ))}
        </div>
      ) : (
        // Grouped list for "All" view
        <>
          {groupedLocations.groups.map(({ date, locations: groupLocs }) =>
            renderDateGroup(date, groupLocs)
          )}

          {/* Unscheduled section */}
          {groupedLocations.unscheduled.length > 0 &&
            renderDateGroup("unscheduled", groupedLocations.unscheduled)
          }
        </>
      )}
    </div>
  );

  return (
    <>
      {isDndEnabled ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {listContent}

          <DragOverlay>
            {draggedLocation && (
              <div className="shadow-lg">
                <LocationCard
                  location={draggedLocation}
                  categories={categories}
                  isSelected={false}
                  onClick={() => {}}
                  selectedDate={selectedDate}
                  isDndEnabled={false}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        listContent
      )}

      {pendingDrop && (
        <TimeConfirmPopover
          locationName={locations?.find(l => l._id === pendingDrop.locationId)?.name || ""}
          suggestedDateTime={combineDateTime(pendingDrop.targetDate, pendingDrop.suggestedTime)}
          onConfirm={handleConfirmDrop}
          onCancel={handleCancelDrop}
        />
      )}
    </>
  );
}

import { useDroppable } from "@dnd-kit/core";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarLocationChip } from "./CalendarLocationChip";

interface CompactCalendarColumnProps {
  date: Date;
  isToday: boolean;
  locations: Doc<"locations">[];
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
}

export function CompactCalendarColumn({
  date,
  isToday,
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
}: CompactCalendarColumnProps) {
  // Create droppable ID in format: day-YYYY-MM-DD
  const dateStr = date.toISOString().split("T")[0];
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
  });

  // Format header: "Mon, Jan 13"
  const dayName = date.toLocaleDateString(undefined, { weekday: "short" });
  const monthDay = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Sort locations by time
  const sortedLocations = [...locations].sort((a, b) => {
    if (!a.dateTime) return 1;
    if (!b.dateTime) return -1;
    return a.dateTime.localeCompare(b.dateTime);
  });

  return (
    <div className="flex-shrink-0 w-48 flex flex-col">
      {/* Column header */}
      <div
        className={`
          px-3 py-2 border-b border-border bg-surface-elevated
          text-center
          ${isToday ? "text-blue-400 font-semibold" : "text-text-secondary"}
        `}
      >
        <div className="text-xs font-medium">{dayName}</div>
        <div className="text-xs">{monthDay}</div>
      </div>

      {/* Droppable column body */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-96 p-2 bg-surface
          transition-colors
          ${isToday ? "ring-2 ring-blue-500/50 ring-inset" : ""}
          ${isOver ? "bg-green-500/10 ring-2 ring-green-500/50 ring-inset" : ""}
          ${!isToday && !isOver ? "hover:bg-surface-secondary/30" : ""}
        `}
      >
        {/* Location chips */}
        {sortedLocations.length > 0 ? (
          sortedLocations.map((location) => (
            <CalendarLocationChip
              key={location._id}
              location={location}
              categories={categories}
              isSelected={selectedLocationId === location._id}
              onClick={() => onLocationSelect(location._id)}
            />
          ))
        ) : (
          <div className="text-xs text-text-muted text-center mt-4 opacity-50">
            No locations
          </div>
        )}
      </div>
    </div>
  );
}

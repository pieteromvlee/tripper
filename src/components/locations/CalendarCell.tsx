import { useDroppable } from "@dnd-kit/core";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarLocationChip } from "./CalendarLocationChip";

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  locations: Doc<"locations">[];
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
}

export function CalendarCell({
  date,
  isCurrentMonth,
  isToday,
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
}: CalendarCellProps) {
  // Create droppable ID in format: day-YYYY-MM-DD
  const dateStr = date.toISOString().split("T")[0];
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-24 max-h-48 overflow-y-auto p-2 bg-surface
        transition-colors
        ${isCurrentMonth ? "text-text-primary" : "text-text-muted opacity-50"}
        ${
          isToday
            ? "bg-blue-500/10 ring-2 ring-blue-500/50 ring-inset"
            : ""
        }
        ${!isToday ? "hover:bg-surface-secondary" : ""}
        ${isOver ? "bg-green-500/10 ring-2 ring-green-500/50 ring-inset" : ""}
      `}
    >
      {/* Day number */}
      <div className="text-xs font-medium mb-1">{date.getDate()}</div>

      {/* Location chips */}
      {locations.map((location) => (
        <CalendarLocationChip
          key={location._id}
          location={location}
          categories={categories}
          isSelected={selectedLocationId === location._id}
          onClick={() => onLocationSelect(location._id)}
        />
      ))}
    </div>
  );
}

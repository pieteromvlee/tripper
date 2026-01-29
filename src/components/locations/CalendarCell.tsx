import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarLocationChip } from "./CalendarLocationChip";
import { formatDateString } from "../../lib/dateUtils";

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  locations: Doc<"locations">[];
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  onShowMore: (date: Date, locations: Doc<"locations">[]) => void;
}

const MAX_VISIBLE_EVENTS = 3;

const CalendarCellComponent = ({
  date,
  isCurrentMonth,
  isToday,
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
  onShowMore,
}: CalendarCellProps) => {
  // Create droppable ID in format: day-YYYY-MM-DD
  const dateStr = formatDateString(date);
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
  });

  const visibleLocations = locations.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenCount = locations.length - visibleLocations.length;

  return (
    <div
      ref={setNodeRef}
      className={`
        h-full overflow-hidden p-1.5 bg-surface flex flex-col
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
      <div className="text-xs font-medium mb-1 flex-shrink-0">{date.getDate()}</div>

      {/* Location chips - fixed height container */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-0.5">
        {visibleLocations.map((location) => (
          <CalendarLocationChip
            key={location._id}
            location={location}
            categories={categories}
            isSelected={selectedLocationId === location._id}
            onClick={() => onLocationSelect(location._id)}
          />
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowMore(date, locations);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 px-1 flex-shrink-0 text-left hover:underline"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
};

export const CalendarCell = memo(CalendarCellComponent);
CalendarCell.displayName = "CalendarCell";

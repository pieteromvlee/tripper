import { useDroppable } from "@dnd-kit/core";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarLocationChip } from "./CalendarLocationChip";

interface UnscheduledColumnProps {
  locations: Doc<"locations">[];
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
}

export function UnscheduledColumn({
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
}: UnscheduledColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unscheduled",
  });

  return (
    <div className="w-64 border-r border-border bg-surface-elevated flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-surface-secondary">
        <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          Unscheduled
        </h3>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto p-2 transition-colors
          ${isOver ? "bg-green-500/10 ring-2 ring-green-500/50 ring-inset" : ""}
        `}
      >
        {locations.length === 0 ? (
          <div className="text-xs text-text-muted text-center py-4">
            No unscheduled locations
          </div>
        ) : (
          locations.map((location) => (
            <CalendarLocationChip
              key={location._id}
              location={location}
              categories={categories}
              isSelected={selectedLocationId === location._id}
              onClick={() => onLocationSelect(location._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

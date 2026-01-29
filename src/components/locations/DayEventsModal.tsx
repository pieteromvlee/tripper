import { memo } from "react";
import { X } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarLocationChip } from "./CalendarLocationChip";

interface DayEventsModalProps {
  date: Date;
  locations: Doc<"locations">[];
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  onClose: () => void;
}

const DayEventsModalComponent = ({
  date,
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
  onClose,
}: DayEventsModalProps) => {
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border shadow-lg max-w-sm w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text-primary">{dateStr}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-secondary rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {locations.length === 0 ? (
            <p className="text-text-secondary text-sm">No events this day.</p>
          ) : (
            locations.map((location) => (
              <CalendarLocationChip
                key={location._id}
                location={location}
                categories={categories}
                isSelected={selectedLocationId === location._id}
                onClick={() => {
                  onLocationSelect(location._id);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const DayEventsModal = memo(DayEventsModalComponent);
DayEventsModal.displayName = "DayEventsModal";

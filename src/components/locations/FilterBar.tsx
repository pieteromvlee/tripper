import type { Id } from "../../../convex/_generated/dataModel";
import type { LocationType } from "../../lib/locationStyles";
import { DaySelector } from "./DaySelector";
import { TypeFilter } from "./TypeFilter";

interface FilterBarProps {
  tripId: Id<"trips">;
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  visibleTypes: Set<LocationType>;
  onToggleType: (type: LocationType) => void;
}

export function FilterBar({
  tripId,
  selectedDate,
  onDateSelect,
  visibleTypes,
  onToggleType,
}: FilterBarProps) {
  return (
    <div className="flex items-center bg-surface-secondary">
      {/* Day selector takes up available space and can scroll */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <DaySelector
          tripId={tripId}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
      </div>

      {/* Separator and type filter on the right */}
      <div className="flex-shrink-0 flex items-center pl-3 pr-3 py-2 border-l border-border ml-0">
        <TypeFilter visibleTypes={visibleTypes} onToggleType={onToggleType} />
      </div>
    </div>
  );
}

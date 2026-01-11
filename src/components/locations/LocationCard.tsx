import type { Doc } from "../../../convex/_generated/dataModel";
import { formatDateTime, formatTime } from "../../lib/locationUtils";
import { TypeIcon } from "../../lib/typeIcons";

interface LocationCardProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
  selectedDate?: string;
}

export function LocationCard({
  location,
  isSelected,
  onClick,
  selectedDate,
}: LocationCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 cursor-pointer transition-colors
        touch-manipulation border
        ${
          isSelected
            ? "bg-blue-500/10 border-blue-400"
            : "bg-surface-elevated border-border hover:bg-surface-secondary hover:border-border-focus"
        }
      `}
    >
      <div className="flex items-start gap-2">
        <TypeIcon
          type={location.locationType || "attraction"}
          className="w-4 h-4 flex-shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3
            className={`
              font-medium text-sm truncate
              ${isSelected ? "text-blue-300" : "text-text-primary"}
            `}
          >
            {location.name}
          </h3>

          {/* Address */}
          {location.address && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {location.address}
            </p>
          )}

          {/* Date/Time */}
          {location.dateTime && (
            <p
              className={`
                text-xs mt-1
                ${isSelected ? "text-blue-400" : "text-text-secondary"}
              `}
            >
              {selectedDate ? formatTime(location.dateTime) : formatDateTime(location.dateTime)}
              {location.locationType === "accommodation" && location.endDateTime && (
                <span className="text-text-muted">
                  {" "}
                  - {selectedDate ? formatTime(location.endDateTime) : formatDateTime(location.endDateTime)}
                </span>
              )}
            </p>
          )}

          {/* Notes preview */}
          {location.notes && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {location.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

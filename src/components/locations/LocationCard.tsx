import type { Doc } from "../../../convex/_generated/dataModel";
import { getLocationTypeBadgeClasses, getLocationTypeLabel } from "../../lib/locationStyles";
import { getDirectionsUrl, formatDateTime } from "../../lib/locationUtils";

interface LocationCardProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
  onOpenDetail?: () => void; // Open location detail modal
}

export function LocationCard({
  location,
  isSelected,
  onClick,
  onOpenDetail,
}: LocationCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 cursor-pointer transition-colors
        min-h-[64px] touch-manipulation border
        ${
          isSelected
            ? "bg-blue-500/10 border-blue-400"
            : "bg-surface-elevated border-border hover:bg-surface-secondary hover:border-border-focus"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
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
              {formatDateTime(location.dateTime)}
              {location.locationType === "accommodation" && location.endDateTime && (
                <span className="text-text-muted">
                  {" "}
                  - {formatDateTime(location.endDateTime)}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Info button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail?.();
            }}
            className={`
              p-1.5 transition-colors border border-transparent
              ${
                isSelected
                  ? "text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary hover:border-border"
              }
            `}
            title="View details"
            aria-label="View details"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Get Directions button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                getDirectionsUrl(location.latitude, location.longitude),
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className={`
              p-1.5 transition-colors border border-transparent
              ${
                isSelected
                  ? "text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary hover:border-border"
              }
            `}
            title="Get Directions"
            aria-label="Get Directions"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </button>

          {/* Type badge */}
          <span
            className={`
              inline-flex items-center px-2 py-0.5 text-xs font-medium border
              ${isSelected ? "bg-blue-500/10 text-blue-400 border-blue-500/50" : getLocationTypeBadgeClasses(location.locationType || "attraction")}
            `}
          >
            {getLocationTypeLabel(location.locationType || "attraction")}
          </span>
        </div>
      </div>

      {/* Notes preview */}
      {location.notes && (
        <p className="text-xs text-text-muted mt-2 line-clamp-2">
          {location.notes}
        </p>
      )}
    </div>
  );
}

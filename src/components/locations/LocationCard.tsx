import type { Doc } from "../../../convex/_generated/dataModel";

interface LocationCardProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
  onOpenDetail?: () => void; // Open location detail modal
}

/**
 * Detects if the user is on an Apple device (iOS or macOS)
 */
function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  // Check for macOS
  const isMac = platform.includes("mac") || /macintosh/.test(userAgent);

  return isIOS || isMac;
}

/**
 * Generates a maps URL for directions to the given coordinates
 */
function getDirectionsUrl(latitude: number, longitude: number): string {
  if (isAppleDevice()) {
    return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function LocationCard({
  location,
  isSelected,
  onClick,
  onOpenDetail,
}: LocationCardProps) {
  // Format date/time for display
  const formatDateTime = (dateTime: string | undefined): string => {
    if (!dateTime) return "";

    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateTime;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        min-h-[72px] touch-manipulation
        ${
          isSelected
            ? "bg-blue-500/10 border-2 border-blue-500 shadow-md"
            : "bg-surface-elevated border border-border hover:border-border hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3
            className={`
              font-medium text-base truncate
              ${isSelected ? "text-blue-800 dark:text-blue-300" : "text-text-primary"}
            `}
          >
            {location.name}
          </h3>

          {/* Address */}
          {location.address && (
            <p className="text-sm text-text-secondary truncate mt-0.5">
              {location.address}
            </p>
          )}

          {/* Date/Time */}
          {location.dateTime && (
            <p
              className={`
                text-sm mt-1
                ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-text-secondary"}
              `}
            >
              {formatDateTime(location.dateTime)}
              {location.locationType === "hotel" && location.endDateTime && (
                <span className="text-text-muted">
                  {" "}
                  - {formatDateTime(location.endDateTime)}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Info button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail?.();
            }}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                isSelected
                  ? "text-blue-600 hover:bg-blue-500/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary"
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
              p-1.5 rounded-md transition-colors
              ${
                isSelected
                  ? "text-blue-600 hover:bg-blue-500/20"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary"
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
              inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
              ${
                isSelected
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  : location.locationType === "hotel"
                    ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                    : location.locationType === "restaurant"
                      ? "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                      : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
              }
            `}
          >
            {location.locationType === "hotel" ? "Hotel" : location.locationType === "restaurant" ? "Restaurant" : "Attraction"}
          </span>
        </div>
      </div>

      {/* Notes preview */}
      {location.notes && (
        <p className="text-sm text-text-muted mt-2 line-clamp-2">
          {location.notes}
        </p>
      )}
    </div>
  );
}

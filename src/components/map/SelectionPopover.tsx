import type { Doc } from "../../../convex/_generated/dataModel";
import { getCategoryBadgeStyle } from "../../lib/colorUtils";
import { getDirectionsUrl } from "../../lib/locationUtils";
import { CategoryIcon } from "../../lib/typeIcons";

interface SelectionPopoverProps {
  location: Doc<"locations">;
  category?: Doc<"categories">;
  onInfo: () => void;
  onFlyTo: () => void;
  onClose: () => void;
  isMobile: boolean;
  isInMapView: boolean;
}

export function SelectionPopover({
  location,
  category,
  onInfo,
  onFlyTo,
  onClose,
  isMobile,
  isInMapView,
}: SelectionPopoverProps) {

  const handleDirections = () => {
    window.open(
      getDirectionsUrl(location.latitude, location.longitude),
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="bg-surface-elevated border border-border shadow-lg max-w-[280px]">
      {/* Header with icon, name, address, close button */}
      <div className="p-2 border-b border-border">
        <div className="flex items-start gap-2">
          {/* Category icon */}
          {category && (
            <div
              className="p-1.5 border flex-shrink-0"
              style={getCategoryBadgeStyle(category.color)}
            >
              <CategoryIcon iconName={category.iconName} className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Name and address */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {location.name}
            </h3>
            {location.address && (
              <p className="text-xs text-text-secondary truncate">
                {location.address}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-secondary border border-transparent hover:border-border flex-shrink-0"
            aria-label="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex divide-x divide-border">
        <button
          onClick={onInfo}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition"
          title="View details"
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
          Info
        </button>

        {/* Hide Map button on mobile when already in map view */}
        {!(isMobile && isInMapView) && (
          <button
            onClick={onFlyTo}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-blue-400 hover:bg-blue-500/10 transition"
            title="Fly to location"
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
            Map
          </button>
        )}

        <button
          onClick={handleDirections}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition"
          title="Get directions"
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Go
        </button>
      </div>
    </div>
  );
}

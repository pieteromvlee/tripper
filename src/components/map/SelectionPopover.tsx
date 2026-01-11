import type { Doc } from "../../../convex/_generated/dataModel";
import {
  getLocationTypeBadgeClasses,
  type LocationType,
} from "../../lib/locationStyles";
import { getDirectionsUrl } from "../../lib/locationUtils";

interface SelectionPopoverProps {
  location: Doc<"locations">;
  onInfo: () => void;
  onFlyTo: () => void;
  onClose: () => void;
}

function TypeIcon({ type }: { type: LocationType }) {
  switch (type) {
    case "accommodation":
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    case "restaurant":
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 0a1 1 0 0 1 1 1v5a1 1 0 0 1-.29.71L6 8.41V15a1 1 0 1 1-2 0V8.41L2.29 6.71A1 1 0 0 1 2 6V1a1 1 0 0 1 2 0v4.59l.5.5.5-.5V1a1 1 0 0 1 2 0zm7 1v14a1 1 0 1 1-2 0v-5h-1a1 1 0 0 1-1-1V5c0-2.21 1.79-4 4-4z" />
        </svg>
      );
    case "shop":
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "snack":
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4.586L3.293 7.707A1 1 0 013 7V5z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "attraction":
    default:
      return (
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

export function SelectionPopover({
  location,
  onInfo,
  onFlyTo,
  onClose,
}: SelectionPopoverProps) {
  const locationType = (location.locationType || "attraction") as LocationType;
  const badgeClasses = getLocationTypeBadgeClasses(locationType);

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
          {/* Type icon */}
          <div
            className={`p-1.5 border flex-shrink-0 ${badgeClasses}`}
          >
            <TypeIcon type={locationType} />
          </div>

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

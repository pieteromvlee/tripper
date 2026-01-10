import type { Doc } from "../../../convex/_generated/dataModel";
import { markerColorSchemes } from "../../lib/locationStyles";

interface LocationMarkerProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
}

export function LocationMarker({
  location,
  isSelected,
  onClick,
}: LocationMarkerProps) {
  const locationType = location.locationType || "attraction";
  const colors = markerColorSchemes[locationType];

  const renderIcon = () => {
    switch (locationType) {
      case "hotel":
        return (
          <g transform="translate(8, 6)">
            {/* Bed base */}
            <rect x="0" y="8" width="12" height="2" rx="0.5" className={colors.icon} />
            {/* Headboard */}
            <rect x="0" y="4" width="3" height="4" rx="0.5" className={colors.icon} />
            {/* Pillow */}
            <rect x="1" y="5" width="2" height="2" rx="0.5" className={colors.iconLight} />
            {/* Blanket */}
            <rect x="3" y="6" width="8" height="2" rx="0.5" className={colors.pin} />
            {/* Legs */}
            <rect x="0" y="10" width="1" height="2" className={colors.icon} />
            <rect x="11" y="10" width="1" height="2" className={colors.icon} />
          </g>
        );
      case "restaurant":
        return (
          <g transform="translate(8, 6)">
            {/* Fork - left */}
            <rect x="0" y="0" width="1.5" height="4" rx="0.3" className={colors.iconLight} />
            <rect x="0" y="3" width="1.5" height="9" rx="0.5" className={colors.icon} />
            {/* Knife - right */}
            <path d="M10.5 0 C10.5 0 12.5 0 12.5 3 L12.5 6 L10.5 6 L10.5 0 Z" className={colors.iconLight} />
            <rect x="10.5" y="5" width="2" height="7" rx="0.5" className={colors.icon} />
          </g>
        );
      case "attraction":
      default:
        return (
          <g transform="translate(7, 5)">
            {/* Camera body */}
            <rect x="0" y="3" width="14" height="9" rx="1" className={colors.icon} />
            {/* Camera lens */}
            <circle cx="7" cy="7.5" r="3" className={colors.iconLight} />
            <circle cx="7" cy="7.5" r="1.5" className={colors.icon} />
            {/* Camera top */}
            <rect x="4" y="1" width="6" height="2" rx="0.5" className={colors.icon} />
            {/* Flash */}
            <rect x="11" y="4" width="2" height="1.5" rx="0.25" className={colors.iconLight} />
          </g>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer"
      style={{ transform: "translate(-50%, -100%)" }}
    >
      {/* Tap target wrapper - ensures minimum 44x44px touch area */}
      <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px]">
        {/* Marker pin */}
        <div
          className={`
            relative transition-all duration-200 ease-out
            ${isSelected ? "scale-125" : "scale-100 hover:scale-110"}
          `}
        >
          {/* Selected state pulse animation */}
          {isSelected && (
            <div
              className={`
                absolute inset-0 rounded-full
                ${colors.pulse}
                animate-ping opacity-75
              `}
              style={{
                width: "100%",
                height: "100%",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* Pin SVG */}
          <svg
            width={isSelected ? "36" : "28"}
            height={isSelected ? "44" : "36"}
            viewBox="0 0 28 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`
              drop-shadow-md
              ${isSelected ? "drop-shadow-lg" : ""}
            `}
          >
            {/* Pin shape */}
            <path
              d="M14 0C6.268 0 0 6.268 0 14c0 7.732 14 22 14 22s14-14.268 14-22C28 6.268 21.732 0 14 0z"
              className={`
                transition-colors duration-200
                ${isSelected ? colors.pinSelected : colors.pin}
              `}
            />
            {/* Inner circle */}
            <circle
              cx="14"
              cy="12"
              r="6"
              className={`transition-colors duration-200 ${colors.inner}`}
            />

            {/* Type-specific icon */}
            {renderIcon()}
          </svg>

          {/* Shadow ellipse at base */}
          <div
            className={`
              absolute -bottom-1 left-1/2 -translate-x-1/2
              bg-black/20 rounded-full blur-sm
              transition-all duration-200
              ${isSelected ? "w-6 h-2" : "w-4 h-1"}
            `}
          />
        </div>
      </div>

      {/* Location name tooltip/label - shown when selected */}
      {isSelected && (
        <div
          className={`
            mt-1 px-2 py-1 rounded-md text-xs font-medium
            max-w-[150px] truncate text-center
            shadow-lg backdrop-blur-sm
            ${colors.label} text-white
            animate-fade-in
          `}
        >
          {location.name}
        </div>
      )}
    </div>
  );
}

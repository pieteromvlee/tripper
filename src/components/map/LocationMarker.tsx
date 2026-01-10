import type { Doc } from "../../../convex/_generated/dataModel";

interface LocationMarkerProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
}

// Color schemes for each location type
const colorSchemes = {
  hotel: {
    pin: "fill-purple-600",
    pinSelected: "fill-purple-500",
    inner: "fill-purple-200",
    pulse: "bg-purple-400",
    label: "bg-purple-600",
    icon: "fill-purple-700",
    iconLight: "fill-purple-300",
  },
  restaurant: {
    pin: "fill-orange-600",
    pinSelected: "fill-orange-500",
    inner: "fill-orange-200",
    pulse: "bg-orange-400",
    label: "bg-orange-600",
    icon: "fill-orange-700",
    iconLight: "fill-orange-300",
  },
  attraction: {
    pin: "fill-blue-600",
    pinSelected: "fill-blue-500",
    inner: "fill-blue-200",
    pulse: "bg-blue-400",
    label: "bg-blue-600",
    icon: "fill-blue-700",
    iconLight: "fill-blue-300",
  },
};

export function LocationMarker({
  location,
  isSelected,
  onClick,
}: LocationMarkerProps) {
  const locationType = location.locationType || "attraction";
  const colors = colorSchemes[locationType];

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
          <g transform="translate(9, 6)">
            {/* Fork */}
            <rect x="0" y="0" width="1.5" height="8" rx="0.5" className={colors.icon} />
            <rect x="0" y="0" width="1.5" height="4" rx="0.5" className={colors.iconLight} />
            {/* Knife */}
            <rect x="4" y="0" width="2" height="8" rx="0.5" className={colors.icon} />
            <path d="M4 0 L6 0 L6 3 L4 4 Z" className={colors.iconLight} />
            {/* Spoon */}
            <ellipse cx="9" cy="2" rx="1.5" ry="2" className={colors.icon} />
            <rect x="8" y="3" width="2" height="5" rx="0.5" className={colors.icon} />
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

import type { Doc } from "../../../convex/_generated/dataModel";

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
  const isHotel = location.isHotel;

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
                ${isHotel ? "bg-purple-400" : "bg-blue-400"}
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
                ${isHotel ? "fill-purple-600" : "fill-blue-600"}
                ${isSelected && isHotel ? "fill-purple-500" : ""}
                ${isSelected && !isHotel ? "fill-blue-500" : ""}
              `}
            />
            {/* Inner circle */}
            <circle
              cx="14"
              cy="12"
              r="6"
              className={`
                transition-colors duration-200
                ${isHotel ? "fill-purple-200" : "fill-blue-200"}
              `}
            />

            {/* Hotel icon (bed) */}
            {isHotel && (
              <g transform="translate(8, 6)">
                {/* Bed base */}
                <rect
                  x="0"
                  y="8"
                  width="12"
                  height="2"
                  rx="0.5"
                  className="fill-purple-700"
                />
                {/* Headboard */}
                <rect
                  x="0"
                  y="4"
                  width="3"
                  height="4"
                  rx="0.5"
                  className="fill-purple-700"
                />
                {/* Pillow */}
                <rect
                  x="1"
                  y="5"
                  width="2"
                  height="2"
                  rx="0.5"
                  className="fill-purple-300"
                />
                {/* Blanket */}
                <rect
                  x="3"
                  y="6"
                  width="8"
                  height="2"
                  rx="0.5"
                  className="fill-purple-600"
                />
                {/* Legs */}
                <rect x="0" y="10" width="1" height="2" className="fill-purple-700" />
                <rect x="11" y="10" width="1" height="2" className="fill-purple-700" />
              </g>
            )}

            {/* Regular location icon (circle dot) */}
            {!isHotel && (
              <circle cx="14" cy="12" r="3" className="fill-blue-700" />
            )}
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
            ${isHotel ? "bg-purple-600 text-white" : "bg-blue-600 text-white"}
            animate-fade-in
          `}
        >
          {location.name}
        </div>
      )}
    </div>
  );
}

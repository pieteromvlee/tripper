export type LocationType = "attraction" | "restaurant" | "hotel";

/**
 * Get the display label for a location type
 */
export function getLocationTypeLabel(type: LocationType): string {
  switch (type) {
    case "hotel":
      return "Hotel";
    case "restaurant":
      return "Restaurant";
    case "attraction":
    default:
      return "Attraction";
  }
}

/**
 * Get badge styling classes for a location type
 * Includes dark mode variants
 */
export function getLocationTypeBadgeClasses(type: LocationType): string {
  switch (type) {
    case "hotel":
      return "bg-purple-500/20 text-purple-700 dark:text-purple-400";
    case "restaurant":
      return "bg-orange-500/20 text-orange-700 dark:text-orange-400";
    case "attraction":
    default:
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
  }
}

/**
 * Get solid button styling classes for a location type
 */
export function getLocationTypeButtonClasses(type: LocationType): string {
  switch (type) {
    case "hotel":
      return "bg-purple-500";
    case "restaurant":
      return "bg-orange-500";
    case "attraction":
    default:
      return "bg-blue-500";
  }
}

/**
 * Color schemes for map markers - includes all styling variants needed for SVG markers
 */
export const markerColorSchemes = {
  hotel: {
    pin: "fill-purple-600 dark:fill-purple-500",
    pinSelected: "fill-purple-500 dark:fill-purple-400",
    inner: "fill-purple-200 dark:fill-purple-300",
    pulse: "bg-purple-400",
    label: "bg-purple-600 dark:bg-purple-500",
    icon: "fill-purple-700 dark:fill-purple-600",
    iconLight: "fill-purple-300 dark:fill-purple-400",
  },
  restaurant: {
    pin: "fill-orange-600 dark:fill-orange-500",
    pinSelected: "fill-orange-500 dark:fill-orange-400",
    inner: "fill-orange-200 dark:fill-orange-300",
    pulse: "bg-orange-400",
    label: "bg-orange-600 dark:bg-orange-500",
    icon: "fill-orange-700 dark:fill-orange-600",
    iconLight: "fill-orange-300 dark:fill-orange-400",
  },
  attraction: {
    pin: "fill-blue-600 dark:fill-blue-500",
    pinSelected: "fill-blue-500 dark:fill-blue-400",
    inner: "fill-blue-200 dark:fill-blue-300",
    pulse: "bg-blue-400",
    label: "bg-blue-600 dark:bg-blue-500",
    icon: "fill-blue-700 dark:fill-blue-600",
    iconLight: "fill-blue-300 dark:fill-blue-400",
  },
} as const;

/**
 * Location type options for forms/selectors
 */
export const locationTypeOptions: { value: LocationType; label: string; color: string }[] = [
  { value: "attraction", label: "Attraction", color: "bg-blue-500" },
  { value: "restaurant", label: "Restaurant", color: "bg-orange-500" },
  { value: "hotel", label: "Hotel", color: "bg-purple-500" },
];

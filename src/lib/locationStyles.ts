export type LocationType = "attraction" | "restaurant" | "accommodation" | "shop" | "snack";

/**
 * Get the display label for a location type
 */
export function getLocationTypeLabel(type: LocationType): string {
  switch (type) {
    case "accommodation":
      return "Accommodation";
    case "restaurant":
      return "Restaurant";
    case "shop":
      return "Shop";
    case "snack":
      return "Snack";
    case "attraction":
    default:
      return "Attraction";
  }
}

/**
 * Get badge styling classes for a location type
 * TUI style with borders
 */
export function getLocationTypeBadgeClasses(type: LocationType): string {
  switch (type) {
    case "accommodation":
      return "bg-purple-500/10 text-purple-400 border-purple-500/50";
    case "restaurant":
      return "bg-orange-500/10 text-orange-400 border-orange-500/50";
    case "shop":
      return "bg-green-500/10 text-green-400 border-green-500/50";
    case "snack":
      return "bg-pink-500/10 text-pink-400 border-pink-500/50";
    case "attraction":
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/50";
  }
}

/**
 * Get solid button styling classes for a location type
 */
export function getLocationTypeButtonClasses(type: LocationType): string {
  switch (type) {
    case "accommodation":
      return "bg-purple-500";
    case "restaurant":
      return "bg-orange-500";
    case "shop":
      return "bg-green-500";
    case "snack":
      return "bg-pink-500";
    case "attraction":
    default:
      return "bg-blue-500";
  }
}

/**
 * Color schemes for map markers - includes all styling variants needed for SVG markers
 */
export const markerColorSchemes = {
  accommodation: {
    pin: "fill-purple-500",
    pinSelected: "fill-purple-400",
    inner: "fill-purple-300",
    pulse: "bg-purple-400",
    label: "bg-purple-500",
    icon: "fill-purple-600",
    iconLight: "fill-purple-400",
  },
  restaurant: {
    pin: "fill-orange-500",
    pinSelected: "fill-orange-400",
    inner: "fill-orange-300",
    pulse: "bg-orange-400",
    label: "bg-orange-500",
    icon: "fill-orange-600",
    iconLight: "fill-orange-400",
  },
  attraction: {
    pin: "fill-blue-500",
    pinSelected: "fill-blue-400",
    inner: "fill-blue-300",
    pulse: "bg-blue-400",
    label: "bg-blue-500",
    icon: "fill-blue-600",
    iconLight: "fill-blue-400",
  },
  shop: {
    pin: "fill-green-500",
    pinSelected: "fill-green-400",
    inner: "fill-green-300",
    pulse: "bg-green-400",
    label: "bg-green-500",
    icon: "fill-green-600",
    iconLight: "fill-green-400",
  },
  snack: {
    pin: "fill-pink-500",
    pinSelected: "fill-pink-400",
    inner: "fill-pink-300",
    pulse: "bg-pink-400",
    label: "bg-pink-500",
    icon: "fill-pink-600",
    iconLight: "fill-pink-400",
  },
} as const;

/**
 * Location type options for forms/selectors
 */
export const locationTypeOptions: { value: LocationType; label: string; color: string }[] = [
  { value: "attraction", label: "Attraction", color: "bg-blue-500" },
  { value: "restaurant", label: "Restaurant", color: "bg-orange-500" },
  { value: "accommodation", label: "Accommodation", color: "bg-purple-500" },
  { value: "shop", label: "Shop", color: "bg-green-500" },
  { value: "snack", label: "Snack", color: "bg-pink-500" },
];

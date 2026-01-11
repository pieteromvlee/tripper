/**
 * Color utilities for custom categories
 * Handles color validation, manipulation, and generation of shades for markers
 */

/**
 * Validate if a string is a valid hex color (#RRGGBB format)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Lighten a color by a percentage (0-100)
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = percent / 100;
  const r = Math.min(255, rgb.r + (255 - rgb.r) * amount);
  const g = Math.min(255, rgb.g + (255 - rgb.g) * amount);
  const b = Math.min(255, rgb.b + (255 - rgb.b) * amount);

  return rgbToHex(r, g, b);
}

/**
 * Darken a color by a percentage (0-100)
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const amount = percent / 100;
  const r = Math.max(0, rgb.r * (1 - amount));
  const g = Math.max(0, rgb.g * (1 - amount));
  const b = Math.max(0, rgb.b * (1 - amount));

  return rgbToHex(r, g, b);
}

/**
 * Adjust opacity of a hex color (returns rgba string)
 */
export function hexWithOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Generate color shades for map markers
 * Returns an object with all the color variants needed for location markers
 */
export interface MarkerColorScheme {
  pin: string;          // Main pin color (darker)
  pinSelected: string;  // Pin color when selected (slightly lighter)
  inner: string;        // Inner circle color (base color)
  pulse: string;        // Pulse animation color (with opacity)
  label: string;        // Label background color (lighter)
  icon: string;         // Icon color (darker)
  iconLight: string;    // Icon color for light backgrounds
}

export function generateMarkerColorScheme(baseColor: string): MarkerColorScheme {
  return {
    pin: darkenColor(baseColor, 15),
    pinSelected: lightenColor(baseColor, 10),
    inner: baseColor,
    pulse: hexWithOpacity(baseColor, 0.6),
    label: lightenColor(baseColor, 40),
    icon: darkenColor(baseColor, 20),
    iconLight: lightenColor(baseColor, 60),
  };
}

/**
 * Generate dynamic Tailwind-compatible color classes for badges
 * Note: Since Tailwind uses JIT, we need to use inline styles for dynamic colors
 */
export function getCategoryBadgeStyle(color: string): React.CSSProperties {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return {};
  }

  return {
    backgroundColor: hexWithOpacity(color, 0.1),
    color: color,
    borderColor: hexWithOpacity(color, 0.5),
  };
}

/**
 * Generate button style for category selection
 */
export function getCategoryButtonStyle(
  color: string,
  isSelected: boolean
): React.CSSProperties {
  if (isSelected) {
    return {
      backgroundColor: color,
      color: "#ffffff",
      borderColor: color,
    };
  }

  return {
    backgroundColor: "transparent",
    color: color,
    borderColor: hexWithOpacity(color, 0.3),
  };
}

/**
 * Preset color palette for category color picker
 * Includes all default category colors plus additional options
 */
export const PRESET_COLORS = [
  "#3B82F6", // Blue (Attraction)
  "#F97316", // Orange (Restaurant)
  "#A855F7", // Purple (Accommodation)
  "#10B981", // Green (Shop)
  "#EC4899", // Pink (Snack)
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#84CC16", // Lime
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#8B5CF6", // Violet
  "#F43F5E", // Rose
  "#6366F1", // Indigo
  "#64748B", // Slate
  "#78716C", // Stone
  "#000000", // Black
] as const;

/**
 * Get a contrasting text color (black or white) for a given background color
 */
export function getContrastingTextColor(bgColor: string): "#000000" | "#FFFFFF" {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return "#000000";

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

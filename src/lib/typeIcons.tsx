import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

interface CategoryIconProps {
  iconName: string;
  className?: string;
  color?: string;
  size?: number;
}

type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

/**
 * Renders a Lucide icon dynamically based on the icon name from a category
 */
export function CategoryIcon({
  iconName,
  className = "w-4 h-4",
  color,
  size,
}: CategoryIconProps) {
  // Try to get the icon from Lucide
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[iconName];

  if (!Icon) {
    // Fallback to a default icon if the specified icon doesn't exist
    const FallbackIcon = LucideIcons.HelpCircle;
    return (
      <FallbackIcon
        className={className}
        style={color ? { color } : undefined}
        size={size}
      />
    );
  }

  return (
    <Icon
      className={className}
      style={color ? { color } : undefined}
      size={size}
    />
  );
}

/**
 * List of curated Lucide icons for the icon picker
 * This is a subset of commonly used icons for categories
 */
export const AVAILABLE_ICONS = [
  // Travel & Places
  "Camera",
  "MapPin",
  "Map",
  "Landmark",
  "Mountain",
  "Palmtree",
  "Castle",
  "Church",
  "Tent",
  "Plane",
  "Train",
  "Bus",
  "Ship",
  "Anchor",

  // Food & Dining
  "UtensilsCrossed",
  "Coffee",
  "Pizza",
  "IceCream",
  "Cake",
  "Cookie",
  "Wine",
  "Beer",
  "Martini",
  "Soup",

  // Accommodation
  "Hotel",
  "Home",
  "Building",
  "Building2",
  "House",

  // Shopping
  "ShoppingBag",
  "ShoppingCart",
  "Store",
  "Gift",
  "Tag",

  // Entertainment
  "Film",
  "Ticket",
  "Music",
  "Gamepad2",
  "PartyPopper",
  "Theater",
  "Palette",
  "BookOpen",
  "Library",

  // Nature & Outdoors
  "Trees",
  "Flower",
  "Waves",
  "Sun",
  "Cloud",
  "Umbrella",
  "Bike",
  "Footprints",

  // Activities
  "Dumbbell",
  "Trophy",
  "Sparkles",
  "Heart",
  "Star",
  "Flag",
  "Compass",

  // Services
  "Hospital",
  "Pill",
  "Stethoscope",
  "GraduationCap",
  "Briefcase",
  "Scissors",
  "Wrench",

  // Miscellaneous
  "Info",
  "AlertCircle",
  "CheckCircle",
  "XCircle",
  "Circle",
  "Square",
  "Triangle",
  "Diamond",
] as const;

export type AvailableIconName = (typeof AVAILABLE_ICONS)[number];

/**
 * Check if an icon name exists in Lucide
 */
export function isValidIconName(iconName: string): boolean {
  return iconName in LucideIcons;
}

/**
 * Get a Lucide icon component by name (type-safe)
 */
export function getLucideIcon(iconName: string): LucideIconComponent | null {
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[iconName];
  return Icon || null;
}

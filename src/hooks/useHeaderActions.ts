import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { isAccommodationCategory } from "../lib/categoryUtils";
import { useTheme } from "./useDarkMode";
import { useGeolocation } from "./useGeolocation";
import { useDateMigration } from "./useDateMigration";

interface UseHeaderActionsProps {
  locations: Doc<"locations">[] | undefined;
  categories: Doc<"categories">[] | undefined;
  onFlyToAccommodation: (accommodationId: Id<"locations">) => void;
}

interface UseHeaderActionsReturn {
  // Navigation
  handleBack: () => void;
  handleSignOut: () => void;

  // Accommodation
  accommodation: Doc<"locations"> | undefined;
  handleFlyToAccommodation: () => void;

  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Geolocation
  isTrackingLocation: boolean;
  toggleLocationTracking: () => void;
  userLocation: { lat: number; lng: number } | null;

  // Date migration
  migrationStatus: string | null;
  migrateDates: () => void;
}

/**
 * Custom hook for managing header-related actions and state
 *
 * Consolidates navigation, theme, geolocation, and migration functionality
 * that is displayed/triggered from the TripHeader component
 */
export function useHeaderActions({
  locations,
  categories,
  onFlyToAccommodation,
}: UseHeaderActionsProps): UseHeaderActionsReturn {
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const { isDark, toggleTheme } = useTheme();
  const { userLocation, isTracking: isTrackingLocation, toggleTracking: toggleLocationTracking } = useGeolocation();
  const { migrationStatus, migrateDates } = useDateMigration(locations);

  // Navigation callbacks
  const handleBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  // Find accommodation location
  const accommodation = locations?.find((loc) => {
    const category = categories?.find(c => c._id === loc.categoryId);
    return isAccommodationCategory(category);
  });

  // Fly to accommodation callback
  const handleFlyToAccommodation = useCallback(() => {
    if (accommodation) {
      onFlyToAccommodation(accommodation._id);
    }
  }, [accommodation, onFlyToAccommodation]);

  return {
    handleBack,
    handleSignOut,
    accommodation,
    handleFlyToAccommodation,
    isDark,
    toggleTheme,
    isTrackingLocation,
    toggleLocationTracking,
    userLocation,
    migrationStatus,
    migrateDates,
  };
}

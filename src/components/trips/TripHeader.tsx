import type { Doc } from "../../../convex/_generated/dataModel";

interface TripHeaderProps {
  tripName: string;
  onBack: () => void;
  onAddLocation: () => void;

  // View mode props (mobile)
  isMobile: boolean;
  viewMode?: "list" | "map" | "calendar";
  onViewModeChange?: (mode: "list" | "map" | "calendar") => void;

  // Map-specific actions
  isMapView: boolean;
  isTrackingLocation?: boolean;
  onToggleLocationTracking?: () => void;
  accommodation?: Doc<"locations">;
  onFlyToAccommodation?: () => void;

  // Date migration
  migrationStatus: string | null;
  onMigrateDates: () => void;

  // Theme & auth
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export function TripHeader({
  tripName,
  onBack,
  onAddLocation,
  isMobile,
  viewMode,
  onViewModeChange,
  isMapView,
  isTrackingLocation,
  onToggleLocationTracking,
  accommodation,
  onFlyToAccommodation,
  migrationStatus,
  onMigrateDates,
  isDark,
  onToggleTheme,
  onSignOut,
}: TripHeaderProps) {
  return (
    <header className="bg-surface border-b border-border px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-text-primary truncate uppercase tracking-wide">{tripName}</h1>
          <button
            onClick={onAddLocation}
            className="p-1.5 text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/50"
            title="Add location"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Location tracking toggle (only visible when map view is active) */}
          {isMapView && onToggleLocationTracking && (
            <button
              onClick={onToggleLocationTracking}
              className={`p-2 border transition ${
                isTrackingLocation
                  ? "text-blue-400 bg-blue-500/10 border-blue-500/50"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated border-transparent hover:border-border"
              }`}
              title={isTrackingLocation ? "Stop tracking location" : "Show my location"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
              </svg>
            </button>
          )}

          {/* Accommodation button */}
          {accommodation && onFlyToAccommodation && (
            <button
              onClick={onFlyToAccommodation}
              className="p-2 text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/50"
              title="Go to accommodation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </button>
          )}

          {/* Date migration button */}
          <button
            onClick={onMigrateDates}
            className="hidden md:block px-3 py-1 text-xs border border-border bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary"
            title="Fix date format issues (MM/DD/YYYY → YYYY-MM-DD)"
          >
            Fix Dates
          </button>

          {/* Migration status indicator */}
          {migrationStatus && (
            <span className="hidden md:inline-block text-xs text-text-secondary px-2 py-1 bg-surface-elevated border border-border max-w-xs truncate">
              {migrationStatus}
            </span>
          )}

          {/* View toggle (mobile: three-way list/map/calendar) */}
          {isMobile && viewMode && onViewModeChange && (
            <div className="flex items-center border border-border ml-2">
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 transition border-r border-border ${
                  viewMode === "list" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                }`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange("map")}
                className={`p-2 transition ${
                  viewMode === "map" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                }`}
                title="Map view"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          )}
          {/* Theme toggle (desktop only) */}
          <button
            onClick={onToggleTheme}
            className="hidden md:flex p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          {/* Sign Out */}
          <button
            onClick={onSignOut}
            className="hidden md:block text-text-secondary hover:text-text-primary p-2 hover:bg-surface-elevated border border-transparent hover:border-border"
            title="Sign Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

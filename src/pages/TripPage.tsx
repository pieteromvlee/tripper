import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LocationList, FilterBar, LocationDetail, LocationForm, CalendarView, KanbanView } from "../components/locations";
import { TripMap, LocationSearch, SelectionPopover } from "../components/map";
import { ErrorBoundary, MapErrorFallback } from "../components/ErrorBoundary";
import { useLocationSelection } from "../hooks";
import { useTheme } from "../hooks/useDarkMode";
import { parseTripId } from "../lib/routeParams";
import { isAccommodationCategory } from "../lib/categoryUtils";
import { logger } from "../lib/logger";

type ViewMode = "list" | "map" | "calendar" | "kanban";
type DetailViewMode = "map" | "calendar" | "kanban";

export default function TripPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = parseTripId(params.tripId);
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const { isDark, toggleTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string | null | "unscheduled">(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<Id<"categories">>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list"); // Mobile: list/map/calendar
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("map"); // Desktop: map/calendar toggle
  const [sidebarVisible, setSidebarVisible] = useState(true); // Desktop only
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationData, setNewLocationData] = useState<{
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // Toggle search visibility
  const [detailLocationId, setDetailLocationId] = useState<Id<"locations"> | null>(null); // Full-screen detail view
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null); // Current map center for search proximity
  const [showFullscreenAddForm, setShowFullscreenAddForm] = useState(false); // Full-screen add form for mobile
  const [isTrackingLocation, setIsTrackingLocation] = useState(false); // Location tracking toggle
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null); // User's current location

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Geolocation tracking
  useEffect(() => {
    if (!isTrackingLocation) {
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsTrackingLocation(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        logger.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied");
        }
        setIsTrackingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTrackingLocation]);

  const trip = useQuery(api.trips.get, { tripId });
  const locations = useQuery(api.locations.listByTrip, { tripId });
  const categories = useQuery(api.categories.list, { tripId });

  // Initialize visibleCategories when categories load
  useEffect(() => {
    if (categories && visibleCategories.size === 0) {
      setVisibleCategories(new Set(categories.map(c => c._id)));
    }
  }, [categories]);

  // IMPORTANT: Call all hooks before any conditional returns
  const {
    selectedLocationId,
    selectedLocation,
    selectLocation,
    selectAndFlyTo,
    selectAndScrollTo,
    clearSelection,
    triggerFlyTo,
    flyToCounter,
    scrollToCounter,
  } = useLocationSelection(locations);

  // All useCallback hooks MUST be called before any early returns
  const handleMapClick = useCallback((result: { lat: number; lng: number; name?: string; address?: string }) => {
    setNewLocationData({
      lat: result.lat,
      lng: result.lng,
      name: result.name,
      address: result.address,
    });
    setShowAddForm(true);
  }, []);

  const handleSearchSelect = useCallback((result: { name: string; address: string; latitude: number; longitude: number }) => {
    setNewLocationData({
      lat: result.latitude,
      lng: result.longitude,
      name: result.name,
      address: result.address,
    });
    setShowAddForm(true);
    setShowSearch(false);
    triggerFlyTo();
  }, [triggerFlyTo]);

  const handleFormSuccess = useCallback(() => {
    setShowAddForm(false);
    setNewLocationData(null);
    setShowFullscreenAddForm(false);
  }, []);

  const handleFormCancel = useCallback(() => {
    setShowAddForm(false);
    setNewLocationData(null);
    clearSelection();
    setShowFullscreenAddForm(false);
  }, [clearSelection]);

  const handleToggleCategory = useCallback((categoryId: Id<"categories">) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Find accommodation for use in handleFlyToAccommodation callback
  const accommodation = locations?.find((loc) => {
    const category = categories?.find(c => c._id === loc.categoryId);
    return isAccommodationCategory(category);
  });

  const handleFlyToAccommodation = useCallback(() => {
    if (accommodation) {
      selectAndFlyTo(accommodation._id);
    }
  }, [accommodation, selectAndFlyTo]);

  const handleLocationSelectAndShowDetail = useCallback((locationId: Id<"locations">) => {
    selectLocation(locationId);
    setDetailLocationId(locationId);
  }, [selectLocation]);

  // Early returns AFTER all hooks
  if (!tripId) {
    return <div className="p-4">Invalid trip ID</div>;
  }

  if (trip === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
        <h1 className="text-xl font-bold text-text-primary mb-2">Trip not found</h1>
        <p className="text-text-secondary mb-4">This trip doesn't exist or you don't have access.</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to My Trips</Link>
      </div>
    );
  }

  // Find detail location (after early returns since it's only used in JSX)
  const detailLocation = locations?.find((loc) => loc._id === detailLocationId);

  // View mode computed values for cleaner conditionals
  const isMapView = isMobile ? viewMode === "map" : detailViewMode === "map";
  const isCalendarView = isMobile ? viewMode === "calendar" : detailViewMode === "calendar";
  const isKanbanView = isMobile ? viewMode === "kanban" : detailViewMode === "kanban";
  const isListView = isMobile ? viewMode === "list" : sidebarVisible;

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-sm font-bold text-text-primary truncate uppercase tracking-wide">{trip.name}</h1>
            <button
              onClick={() => setShowSearch(true)}
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
            {isMapView && (
              <button
                onClick={() => setIsTrackingLocation(!isTrackingLocation)}
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
            {accommodation && (
              <button
                onClick={handleFlyToAccommodation}
                className="p-2 text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/50"
                title="Go to accommodation"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
            )}

            {/* View toggle (mobile: four-way list/map/calendar/kanban) */}
            {isMobile && (
              <div className="flex items-center border border-border ml-2">
                <button
                  onClick={() => setViewMode("list")}
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
                  onClick={() => setViewMode("map")}
                  className={`p-2 transition border-r border-border ${
                    viewMode === "map" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                  title="Map view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-2 transition border-r border-border ${
                    viewMode === "calendar" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                  title="Calendar view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-2 transition ${
                    viewMode === "kanban" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                  title="Kanban view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2" />
                  </svg>
                </button>
              </div>
            )}
            {/* Theme toggle (desktop only) */}
            <button
              onClick={toggleTheme}
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
              onClick={() => signOut()}
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

      {/* Filter Bar (Date + Category filters + Detail View Mode toggle) */}
      <FilterBar
        tripId={tripId}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        categories={categories}
        visibleCategories={visibleCategories}
        onToggleCategory={handleToggleCategory}
        sidebarVisible={!isMobile ? sidebarVisible : undefined}
        onToggleSidebar={!isMobile ? () => setSidebarVisible((prev) => !prev) : undefined}
        detailViewMode={!isMobile ? detailViewMode : undefined}
        onDetailViewModeChange={!isMobile ? setDetailViewMode : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel (Sidebar) */}
        {isListView && (
          <div className={`flex flex-col bg-surface-elevated ${!isMobile ? "w-96 border-r border-border" : "flex-1"}`}>
            {/* Search (shown when triggered from header + button) */}
            {showSearch && (
              <div className="p-3 border-b border-border bg-surface-secondary">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-elevated border border-transparent hover:border-border"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Location List or Add Form */}
            <div className="flex-1 overflow-y-auto">
              {showAddForm && newLocationData ? (
                <div>
                  <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Add New Location</span>
                    <button onClick={handleFormCancel} className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <LocationForm
                    tripId={tripId}
                    latitude={newLocationData.lat}
                    longitude={newLocationData.lng}
                    initialName={newLocationData.name}
                    initialAddress={newLocationData.address}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    variant="inline"
                  />
                </div>
              ) : (
                <ErrorBoundary>
                  <LocationList
                    tripId={tripId}
                    selectedDate={selectedDate ?? undefined}
                    selectedLocationId={selectedLocationId ?? undefined}
                    categories={categories}
                    visibleCategories={visibleCategories}
                    onLocationSelect={selectLocation}
                    scrollTrigger={scrollToCounter}
                  />
                </ErrorBoundary>
              )}
            </div>
          </div>
        )}

        {/* Detail Panel (Map or Calendar) */}
        {(isMobile ? viewMode !== "list" : true) && (
          <div className="flex-1 w-full relative">
            {/* Show Map */}
            {isMapView && (
              <>
                {/* Floating Search for map-only view (triggered from header + button) */}
                {(isMobile ? viewMode === "map" : !sidebarVisible) && showSearch && (
                  <div className="absolute top-3 left-3 right-3 z-10">
                    <div className="flex items-center gap-2 bg-surface-elevated border border-border p-2">
                      <div className="flex-1">
                        <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus proximity={mapCenter} />
                      </div>
                      <button
                        onClick={() => setShowSearch(false)}
                        className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-secondary border border-transparent hover:border-border"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <ErrorBoundary fallback={(error, resetError) => <MapErrorFallback error={error} resetError={resetError} />}>
                  <TripMap
                    key={isMobile ? viewMode : `desktop-${sidebarVisible}`}
                    tripId={tripId}
                    selectedLocationId={selectedLocationId}
                    selectedDate={selectedDate}
                    categories={categories}
                    visibleCategories={visibleCategories}
                    onLocationSelect={selectAndScrollTo}
                    onMapClick={handleMapClick}
                    onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
                    flyToLocation={newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng, key: flyToCounter } : undefined}
                    pendingLocation={showAddForm && newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng } : null}
                    userLocation={userLocation}
                  />
                </ErrorBoundary>
                {/* Show All button - appears when a location is selected */}
                {selectedLocationId && (
                  <button
                    onClick={clearSelection}
                    className="absolute left-4 z-10 bg-surface-elevated px-3 py-2 border border-border text-xs font-medium text-text-secondary hover:bg-surface-secondary hover:border-border-focus flex items-center gap-2"
                    style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Show All
                  </button>
                )}

                {/* Selection popover - top-left of map pane */}
                {selectedLocation && (!isMobile || viewMode === "map") && !showAddForm && (
                  <div className={`absolute left-3 z-10 ${showSearch ? "top-16" : "top-3"}`}>
                    <SelectionPopover
                      location={selectedLocation}
                      category={categories?.find(c => c._id === selectedLocation.categoryId)}
                      onInfo={() => setDetailLocationId(selectedLocation._id)}
                      onFlyTo={triggerFlyTo}
                      onClose={clearSelection}
                    />
                  </div>
                )}

                {/* Floating action buttons for pending location (map-only or sidebar hidden) */}
                {showAddForm && newLocationData && (isMobile ? viewMode === "map" : !sidebarVisible) && (
                  <div
                    className="absolute right-4 z-10 flex flex-col gap-2"
                    style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
                  >
                    {/* Location name label */}
                    <div className="bg-green-500/10 border border-green-500/50 px-3 py-2 text-xs font-medium text-green-400 max-w-[200px] truncate">
                      {newLocationData.name || "New Location"}
                    </div>
                    <div className="flex gap-2">
                      {/* Cancel button */}
                      <button
                        onClick={handleFormCancel}
                        className="bg-surface-elevated p-3 border border-border text-text-secondary hover:bg-surface-secondary hover:border-border-focus transition"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {/* Add button */}
                      <button
                        onClick={() => setShowFullscreenAddForm(true)}
                        className="bg-green-600 p-3 border border-green-400 text-white hover:bg-green-500 transition"
                        title="Add location"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show Calendar */}
            {isCalendarView && (
              <ErrorBoundary>
                <CalendarView
                  tripId={tripId}
                  locations={locations}
                  categories={categories}
                  selectedLocationId={selectedLocationId}
                  onLocationSelect={handleLocationSelectAndShowDetail}
                  visibleCategories={visibleCategories}
                />
              </ErrorBoundary>
            )}

            {/* Show Kanban */}
            {isKanbanView && (
              <ErrorBoundary>
                <KanbanView
                  tripId={tripId}
                  locations={locations}
                  categories={categories}
                  selectedLocationId={selectedLocationId}
                  onLocationSelect={handleLocationSelectAndShowDetail}
                  visibleCategories={visibleCategories}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
      </div>

      {/* Full-screen location detail view */}
      {detailLocation && (
        <ErrorBoundary>
          <LocationDetail
            location={detailLocation}
            categories={categories}
            onClose={() => setDetailLocationId(null)}
          />
        </ErrorBoundary>
      )}

      {/* Full-screen add location form */}
      {showFullscreenAddForm && newLocationData && (
        <LocationForm
          tripId={tripId}
          latitude={newLocationData.lat}
          longitude={newLocationData.lng}
          initialName={newLocationData.name}
          initialAddress={newLocationData.address}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          variant="fullscreen"
        />
      )}
    </div>
  );
}

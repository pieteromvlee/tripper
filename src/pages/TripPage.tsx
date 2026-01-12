import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LocationDetail, FilterBar, ListPanel, DetailPanel } from "../components/locations";
import { TripHeader } from "../components/trips";
import { LocationForm } from "../components/locations";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  useLocationSelection,
  useViewMode,
  useLocationForm,
  useHeaderActions,
} from "../hooks";
import { parseTripId } from "../lib/routeParams";

export default function TripPage() {
  const params = useParams<{ tripId: string }>();
  const tripId = parseTripId(params.tripId);

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string | null | "unscheduled">(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<Id<"categories">>>(new Set());

  // UI state
  const [showSearch, setShowSearch] = useState(false);
  const [detailLocationId, setDetailLocationId] = useState<Id<"locations"> | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Data fetching
  const trip = useQuery(api.trips.get, { tripId });
  const locations = useQuery(api.locations.listByTrip, { tripId });
  const categories = useQuery(api.categories.list, { tripId });

  // Custom hooks
  const viewMode = useViewMode();

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

  const locationForm = useLocationForm({
    onTriggerFlyTo: triggerFlyTo,
    onClearSelection: clearSelection,
  });

  const headerActions = useHeaderActions({
    locations,
    categories,
    onFlyToAccommodation: selectAndFlyTo,
  });

  // Initialize visibleCategories when categories load
  useEffect(() => {
    if (categories && visibleCategories.size === 0) {
      setVisibleCategories(new Set(categories.map(c => c._id)));
    }
  }, [categories, visibleCategories.size]);

  // Callback for category filtering
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

  // Search handling (closes search and triggers fly-to animation)
  const handleSearchSelect = useCallback(
    (result: { name: string; address: string; latitude: number; longitude: number }) => {
      locationForm.handleSearchSelect(result);
      setShowSearch(false);
    },
    [locationForm]
  );

  // Handle location select and show detail (for calendar view)
  const handleLocationSelectAndShowDetail = useCallback((locationId: Id<"locations">) => {
    selectLocation(locationId);
    setDetailLocationId(locationId);
  }, [selectLocation]);

  // Handle location double-click (switch to map view and fly to location)
  const handleLocationDoubleClick = useCallback((locationId: Id<"locations">) => {
    // Switch to map view
    viewMode.setViewMode("map");
    // Select and fly to location
    selectAndFlyTo(locationId);
  }, [viewMode, selectAndFlyTo]);

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

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <TripHeader
        tripName={trip.name}
        onBack={headerActions.handleBack}
        onAddLocation={() => setShowSearch(true)}
        isMobile={viewMode.isMobile}
        viewMode={viewMode.viewMode}
        onViewModeChange={viewMode.setViewMode}
        isMapView={viewMode.isMapView}
        isTrackingLocation={headerActions.isTrackingLocation}
        onToggleLocationTracking={headerActions.toggleLocationTracking}
        accommodation={headerActions.accommodation}
        onFlyToAccommodation={headerActions.handleFlyToAccommodation}
        migrationStatus={headerActions.migrationStatus}
        onMigrateDates={headerActions.migrateDates}
        isDark={headerActions.isDark}
        onToggleTheme={headerActions.toggleTheme}
        onSignOut={headerActions.handleSignOut}
      />

      {/* Filter Bar (Date + Category filters + Detail View Mode toggle) */}
      <FilterBar
        tripId={tripId}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        categories={categories}
        visibleCategories={visibleCategories}
        onToggleCategory={handleToggleCategory}
        sidebarVisible={!viewMode.isMobile ? viewMode.sidebarVisible : undefined}
        onToggleSidebar={!viewMode.isMobile ? () => viewMode.setSidebarVisible((prev) => !prev) : undefined}
        detailViewMode={!viewMode.isMobile ? viewMode.detailViewMode : undefined}
        onDetailViewModeChange={!viewMode.isMobile ? viewMode.setDetailViewMode : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel (Sidebar) */}
        {viewMode.isListView && (
          <ListPanel
            tripId={tripId}
            isMobile={viewMode.isMobile}
            showSearch={showSearch}
            onSearchClose={() => setShowSearch(false)}
            onSearchSelect={handleSearchSelect}
            mapCenter={mapCenter}
            showAddForm={locationForm.showAddForm}
            newLocationData={locationForm.newLocationData}
            onFormSuccess={locationForm.handleFormSuccess}
            onFormCancel={locationForm.handleFormCancel}
            selectedDate={selectedDate}
            selectedLocationId={selectedLocationId}
            categories={categories}
            visibleCategories={visibleCategories}
            onLocationSelect={selectLocation}
            onLocationDoubleClick={handleLocationDoubleClick}
            scrollTrigger={scrollToCounter}
          />
        )}

        {/* Detail Panel (Map or Calendar) */}
        <DetailPanel
          isMobile={viewMode.isMobile}
          viewMode={viewMode.viewMode}
          detailViewMode={viewMode.detailViewMode}
          isMapView={viewMode.isMapView}
          isCalendarView={viewMode.isCalendarView}
          mapPanelProps={{
            tripId,
            isMobile: viewMode.isMobile,
            viewMode: viewMode.viewMode,
            sidebarVisible: viewMode.sidebarVisible,
            showSearch,
            onSearchClose: () => setShowSearch(false),
            onSearchSelect: handleSearchSelect,
            selectedLocationId,
            selectedLocation: selectedLocation ?? null,
            onLocationSelect: selectAndScrollTo,
            onClearSelection: clearSelection,
            onShowLocationDetail: setDetailLocationId,
            onTriggerFlyTo: triggerFlyTo,
            mapCenter,
            onMapCenterChange: (lat, lng) => setMapCenter({ lat, lng }),
            userLocation: headerActions.userLocation,
            showAddForm: locationForm.showAddForm,
            newLocationData: locationForm.newLocationData,
            onMapClick: locationForm.handleMapClick,
            onFormCancel: locationForm.handleFormCancel,
            onShowFullscreenForm: () => locationForm.setShowFullscreenAddForm(true),
            flyToCounter,
            selectedDate,
            categories,
            visibleCategories,
          }}
          tripId={tripId}
          locations={locations}
          categories={categories}
          selectedLocationId={selectedLocationId}
          onLocationSelectForCalendar={handleLocationSelectAndShowDetail}
          visibleCategories={visibleCategories}
        />
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
      {locationForm.showFullscreenAddForm && locationForm.newLocationData && (
        <LocationForm
          tripId={tripId}
          latitude={locationForm.newLocationData.lat}
          longitude={locationForm.newLocationData.lng}
          initialName={locationForm.newLocationData.name}
          initialAddress={locationForm.newLocationData.address}
          onSuccess={locationForm.handleFormSuccess}
          onCancel={locationForm.handleFormCancel}
          variant="fullscreen"
        />
      )}
    </div>
  );
}

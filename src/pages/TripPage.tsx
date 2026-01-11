import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LocationList, FilterBar, LocationDetail, LocationForm } from "../components/locations";
import { TripMap, LocationSearch, SelectionPopover } from "../components/map";
import type { LocationType } from "../lib/locationStyles";
import { TripShareModal } from "../components/trips/TripShareModal";
import { useLocationSelection } from "../hooks";

type ViewMode = "list" | "map";

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<LocationType>>(
    new Set(["attraction", "restaurant", "accommodation", "shop", "snack"])
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list"); // Mobile only
  const [sidebarVisible, setSidebarVisible] = useState(true); // Desktop only
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationData, setNewLocationData] = useState<{
    lat: number;
    lng: number;
    name?: string;
    address?: string;
    suggestedType?: LocationType;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSearch, setShowSearch] = useState(false); // Toggle search visibility
  const [detailLocationId, setDetailLocationId] = useState<Id<"locations"> | null>(null); // Full-screen detail view
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null); // Current map center for search proximity
  const [showFullscreenAddForm, setShowFullscreenAddForm] = useState(false); // Full-screen add form for mobile
  const [showShareModal, setShowShareModal] = useState(false); // Share trip modal
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
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission denied");
        }
        setIsTrackingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTrackingLocation]);

  const trip = useQuery(api.trips.get, tripId ? { tripId: tripId as Id<"trips"> } : "skip");
  const locations = useQuery(api.locations.listByTrip, tripId ? { tripId: tripId as Id<"trips"> } : "skip");

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

  // Find accommodation and detail location
  const accommodation = locations?.find((loc) => loc.locationType === "accommodation");
  const detailLocation = locations?.find((loc) => loc._id === detailLocationId);

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

  const handleMapClick = (result: { lat: number; lng: number; name?: string; address?: string }) => {
    setNewLocationData({
      lat: result.lat,
      lng: result.lng,
      name: result.name,
      address: result.address,
    });
    setShowAddForm(true);
  };

  const handleSearchSelect = (result: { name: string; address: string; latitude: number; longitude: number; suggestedType?: LocationType }) => {
    setNewLocationData({
      lat: result.latitude,
      lng: result.longitude,
      name: result.name,
      address: result.address,
      suggestedType: result.suggestedType,
    });
    setShowAddForm(true);
    setShowSearch(false); // Hide search after selection
    // Trigger map to fly to this location
    triggerFlyTo();
  };

  const handleLocationSelect = (locationId: Id<"locations">) => {
    selectLocation(locationId);
  };

  // Called when a marker on the map is clicked - also triggers scroll in the list
  const handleMarkerSelect = (locationId: Id<"locations">) => {
    selectAndScrollTo(locationId);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setNewLocationData(null);
    setShowFullscreenAddForm(false);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setNewLocationData(null);
    clearSelection(); // Clear selection to show all pins
    setShowFullscreenAddForm(false);
  };

  const handleToggleType = (type: LocationType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleFlyToAccommodation = () => {
    if (accommodation) {
      selectAndFlyTo(accommodation._id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-surface-secondary border-b border-border px-4 py-2 flex-shrink-0">
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
            {/* Location tracking toggle */}
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

            {/* View toggle (mobile only) */}
            {isMobile && (
              <div className="flex items-center border border-border ml-2">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-xs font-medium transition border-r border-border ${
                    viewMode === "list" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-3 py-1.5 text-xs font-medium transition ${
                    viewMode === "map" ? "bg-blue-600 text-white" : "text-text-secondary hover:bg-surface-elevated"
                  }`}
                >
                  Map
                </button>
              </div>
            )}
            {/* Share button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border ml-2"
              title="Share trip"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="text-text-secondary hover:text-text-primary p-2 hover:bg-surface-elevated border border-transparent hover:border-border"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar (Date + Type filters) */}
      <FilterBar
        tripId={tripId as Id<"trips">}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        visibleTypes={visibleTypes}
        onToggleType={handleToggleType}
        sidebarVisible={!isMobile ? sidebarVisible : undefined}
        onToggleSidebar={!isMobile ? () => setSidebarVisible((prev) => !prev) : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel (Sidebar) */}
        {(isMobile ? viewMode === "list" : sidebarVisible) && (
          <div className={`flex flex-col bg-surface-elevated ${!isMobile ? "w-96 border-r border-border" : "flex-1"}`}>
            {/* Search (shown when triggered from header + button) */}
            {showSearch && (
              <div className="p-3 border-b border-border bg-surface-secondary">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus proximity={mapCenter} />
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
                    tripId={tripId as Id<"trips">}
                    latitude={newLocationData.lat}
                    longitude={newLocationData.lng}
                    initialName={newLocationData.name}
                    initialAddress={newLocationData.address}
                    initialLocationType={newLocationData.suggestedType}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    variant="inline"
                  />
                </div>
              ) : (
                <LocationList
                  tripId={tripId as Id<"trips">}
                  selectedDate={selectedDate ?? undefined}
                  selectedLocationId={selectedLocationId ?? undefined}
                  visibleTypes={visibleTypes}
                  onLocationSelect={handleLocationSelect}
                  scrollTrigger={scrollToCounter}
                />
              )}
            </div>
          </div>
        )}

        {/* Map Panel (Detail Pane) */}
        {(isMobile ? viewMode === "map" : true) && (
          <div className="flex-1 w-full relative">
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
            <TripMap
              key={isMobile ? viewMode : `desktop-${sidebarVisible}`}
              tripId={tripId as Id<"trips">}
              selectedLocationId={selectedLocationId}
              selectedDate={selectedDate}
              visibleTypes={visibleTypes}
              onLocationSelect={handleMarkerSelect}
              onMapClick={handleMapClick}
              onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
              flyToLocation={newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng, key: flyToCounter } : undefined}
              pendingLocation={showAddForm && newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng } : null}
              userLocation={userLocation}
            />
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
          </div>
        )}
      </div>

      {/* Full-screen location detail view */}
      {detailLocation && (
        <LocationDetail
          location={detailLocation}
          onClose={() => setDetailLocationId(null)}
        />
      )}

      {/* Full-screen add location form */}
      {showFullscreenAddForm && newLocationData && (
        <LocationForm
          tripId={tripId as Id<"trips">}
          latitude={newLocationData.lat}
          longitude={newLocationData.lng}
          initialName={newLocationData.name}
          initialAddress={newLocationData.address}
          initialLocationType={newLocationData.suggestedType}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          variant="fullscreen"
        />
      )}

      {/* Share trip modal */}
      {showShareModal && (
        <TripShareModal
          tripId={tripId as Id<"trips">}
          isOwner={trip.role === "owner"}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

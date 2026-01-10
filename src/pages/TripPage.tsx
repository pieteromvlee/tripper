import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LocationList, DaySelector, LocationDetail, LocationForm } from "../components/locations";
import { TripMap, LocationSearch } from "../components/map";
import { TripShareModal } from "../components/trips/TripShareModal";

type ViewMode = "list" | "map" | "both";

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuthActions();
  const [selectedLocationId, setSelectedLocationId] = useState<Id<"locations"> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocationData, setNewLocationData] = useState<{
    lat: number;
    lng: number;
    name?: string;
    address?: string;
    suggestedType?: "attraction" | "restaurant" | "hotel";
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [flyToCounter, setFlyToCounter] = useState(0); // Trigger fly to location
  const [scrollToCounter, setScrollToCounter] = useState(0); // Trigger scroll to location in list
  const [showSearch, setShowSearch] = useState(false); // Toggle search visibility
  const [detailLocationId, setDetailLocationId] = useState<Id<"locations"> | null>(null); // Full-screen detail view
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null); // Current map center for search proximity
  const [showFullscreenAddForm, setShowFullscreenAddForm] = useState(false); // Full-screen add form for mobile
  const [showShareModal, setShowShareModal] = useState(false); // Share trip modal

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // On mobile, default to list view
  useEffect(() => {
    if (isMobile && viewMode === "both") {
      setViewMode("list");
    }
  }, [isMobile, viewMode]);

  const trip = useQuery(api.trips.get, tripId ? { tripId: tripId as Id<"trips"> } : "skip");
  const locations = useQuery(api.locations.listByTrip, tripId ? { tripId: tripId as Id<"trips"> } : "skip");

  // Find hotel, selected location, and detail location
  const hotel = locations?.find((loc) => loc.locationType === "hotel");
  const selectedLocation = locations?.find((loc) => loc._id === selectedLocationId);
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

  const handleSearchSelect = (result: { name: string; address: string; latitude: number; longitude: number; suggestedType?: "attraction" | "restaurant" | "hotel" }) => {
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
    setFlyToCounter(prev => prev + 1);
  };

  const handleLocationSelect = (locationId: Id<"locations">) => {
    setSelectedLocationId(locationId);
  };

  // Called when a marker on the map is clicked - also triggers scroll in the list
  const handleMarkerSelect = (locationId: Id<"locations">) => {
    setSelectedLocationId(locationId);
    setScrollToCounter(prev => prev + 1);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setNewLocationData(null);
    setShowFullscreenAddForm(false);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setNewLocationData(null);
    setSelectedLocationId(null); // Clear selection to show all pins
    setShowFullscreenAddForm(false);
  };

  const handleClearSelection = () => {
    setSelectedLocationId(null);
  };

  const handleFlyToHotel = () => {
    if (hotel) {
      setSelectedLocationId(hotel._id);
      setFlyToCounter((prev) => prev + 1);
    }
  };

  // Helper to get directions URL
  const getDirectionsUrl = (lat: number, lng: number) => {
    const isApple = /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent);
    return isApple
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <header className="bg-surface-elevated border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary truncate">{trip.name}</h1>
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-lg transition"
              title="Add location"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Hotel button */}
            {hotel && (
              <button
                onClick={handleFlyToHotel}
                className="p-2 text-purple-600 hover:bg-purple-500/10 rounded-lg transition"
                title="Go to hotel"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "list" ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "map" ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-secondary"
                }`}
              >
                Map
              </button>
              {!isMobile && (
                <button
                  onClick={() => setViewMode("both")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === "both" ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  Both
                </button>
              )}
            </div>
            {/* Share button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition"
              title="Share trip"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="text-text-secondary hover:text-text-primary p-2 transition"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Day Selector */}
      <DaySelector
        tripId={tripId as Id<"trips">}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List Panel */}
        {(viewMode === "list" || viewMode === "both") && (
          <div className={`flex flex-col bg-surface-elevated ${viewMode === "both" ? "w-96 border-r border-border" : "flex-1"}`}>
            {/* Search (shown when triggered from header + button) */}
            {showSearch && (
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus proximity={mapCenter} />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-secondary rounded-lg"
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
                  <div className="px-4 py-2 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Add New Location</span>
                    <button onClick={handleFormCancel} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onLocationSelect={handleLocationSelect}
                  onOpenDetail={isMobile ? setDetailLocationId : undefined}
                  scrollTrigger={scrollToCounter}
                />
              )}
            </div>
          </div>
        )}

        {/* Map Panel */}
        {(viewMode === "map" || viewMode === "both") && (
          <div className="flex-1 w-full relative">
            {/* Floating Search for map-only view (triggered from header + button) */}
            {viewMode === "map" && showSearch && (
              <div className="absolute top-3 left-3 right-3 z-10">
                <div className="flex items-center gap-2 bg-surface-elevated rounded-lg shadow-md p-2">
                  <div className="flex-1">
                    <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus proximity={mapCenter} />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 text-text-muted hover:text-text-secondary hover:bg-surface-secondary rounded-lg"
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
              key={viewMode}
              tripId={tripId as Id<"trips">}
              selectedLocationId={selectedLocationId}
              onLocationSelect={handleMarkerSelect}
              onMapClick={handleMapClick}
              onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
              flyToLocation={newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng, key: flyToCounter } : undefined}
              pendingLocation={showAddForm && newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng } : null}
            />
            {/* Show All button - appears when a location is selected */}
            {selectedLocationId && (
              <button
                onClick={handleClearSelection}
                className="absolute left-4 z-10 bg-surface-elevated px-3 py-2 rounded-lg shadow-md text-sm font-medium text-text-secondary hover:bg-surface-secondary flex items-center gap-2"
                style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Show All
              </button>
            )}

            {/* Floating action buttons for selected location (map view) */}
            {selectedLocation && viewMode === "map" && !showAddForm && (
              <div
                className="absolute right-4 z-10 flex flex-col gap-2"
                style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
              >
                {/* Location name label */}
                <div className="bg-surface-elevated px-3 py-2 rounded-lg shadow-md text-sm font-medium text-text-primary max-w-[200px] truncate">
                  {selectedLocation.name}
                </div>
                <div className="flex gap-2">
                  {/* Info button */}
                  <button
                    onClick={() => setDetailLocationId(selectedLocation._id)}
                    className="bg-surface-elevated p-3 rounded-full shadow-md text-blue-600 hover:bg-blue-500/10 transition"
                    title="View details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {/* Directions button */}
                  <button
                    onClick={() => window.open(getDirectionsUrl(selectedLocation.latitude, selectedLocation.longitude), "_blank")}
                    className="bg-blue-600 p-3 rounded-full shadow-md text-white hover:bg-blue-700 transition"
                    title="Get directions"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Floating action buttons for pending location (map view) */}
            {showAddForm && newLocationData && viewMode === "map" && (
              <div
                className="absolute right-4 z-10 flex flex-col gap-2"
                style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
              >
                {/* Location name label */}
                <div className="bg-green-500/10 border border-green-500/30 px-3 py-2 rounded-lg shadow-md text-sm font-medium text-green-700 dark:text-green-400 max-w-[200px] truncate">
                  {newLocationData.name || "New Location"}
                </div>
                <div className="flex gap-2">
                  {/* Cancel button */}
                  <button
                    onClick={handleFormCancel}
                    className="bg-surface-elevated p-3 rounded-full shadow-md text-text-secondary hover:bg-surface-secondary transition"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Add button */}
                  <button
                    onClick={() => setShowFullscreenAddForm(true)}
                    className="bg-green-600 p-3 rounded-full shadow-md text-white hover:bg-green-700 transition"
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

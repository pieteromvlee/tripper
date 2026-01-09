import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LocationList, DaySelector, LocationDetail } from "../components/locations";
import { TripMap, LocationSearch } from "../components/map";

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
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [flyToCounter, setFlyToCounter] = useState(0); // Trigger fly to location
  const [scrollToCounter, setScrollToCounter] = useState(0); // Trigger scroll to location in list
  const [showSearch, setShowSearch] = useState(false); // Toggle search visibility
  const [detailLocationId, setDetailLocationId] = useState<Id<"locations"> | null>(null); // Full-screen detail view

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
  const hotel = locations?.find((loc) => loc.isHotel);
  const selectedLocation = locations?.find((loc) => loc._id === selectedLocationId);
  const detailLocation = locations?.find((loc) => loc._id === detailLocationId);

  if (!tripId) {
    return <div className="p-4">Invalid trip ID</div>;
  }

  if (trip === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (trip === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Trip not found</h1>
        <p className="text-gray-600 mb-4">This trip doesn't exist or you don't have access.</p>
        <Link to="/" className="text-blue-600 hover:underline">Back to My Trips</Link>
      </div>
    );
  }

  const handleMapClick = (lat: number, lng: number) => {
    setNewLocationData({ lat, lng });
    setShowAddForm(true);
  };

  const handleSearchSelect = (result: { name: string; address: string; latitude: number; longitude: number }) => {
    setNewLocationData({
      lat: result.latitude,
      lng: result.longitude,
      name: result.name,
      address: result.address,
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
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setNewLocationData(null);
    setSelectedLocationId(null); // Clear selection to show all pins
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{trip.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Hotel button */}
            {hotel && (
              <button
                onClick={handleFlyToHotel}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                title="Go to hotel"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </button>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                }`}
              >
                Map
              </button>
              {!isMobile && (
                <button
                  onClick={() => setViewMode("both")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === "both" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Both
                </button>
              )}
            </div>
            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              className="text-gray-500 hover:text-gray-700 p-2 transition"
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
          <div className={`flex flex-col bg-white ${viewMode === "both" ? "w-96 border-r border-gray-200" : "flex-1"}`}>
            {/* Add Location Button / Search */}
            <div className="p-3 border-b border-gray-200">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus />
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Location
                </button>
              )}
            </div>

            {/* Location List or Add Form */}
            <div className="flex-1 overflow-y-auto">
              {showAddForm && newLocationData ? (
                <div>
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">Add New Location</span>
                    <button onClick={handleFormCancel} className="text-blue-600 hover:text-blue-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <LocationFormWithCoords
                    tripId={tripId as Id<"trips">}
                    latitude={newLocationData.lat}
                    longitude={newLocationData.lng}
                    initialName={newLocationData.name}
                    initialAddress={newLocationData.address}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
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
          <div className="flex-1 relative">
            {/* Floating Add Button / Search for map-only view */}
            {viewMode === "map" && (
              <div className="absolute top-3 left-3 right-3 z-10">
                {showSearch ? (
                  <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-2">
                    <div className="flex-1">
                      <LocationSearch onSelect={handleSearchSelect} placeholder="Search for a place..." autoFocus />
                    </div>
                    <button
                      onClick={() => setShowSearch(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Cancel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Location
                  </button>
                )}
              </div>
            )}
            <TripMap
              tripId={tripId as Id<"trips">}
              selectedLocationId={selectedLocationId}
              onLocationSelect={handleMarkerSelect}
              onMapClick={handleMapClick}
              flyToLocation={newLocationData ? { lat: newLocationData.lat, lng: newLocationData.lng, key: flyToCounter } : undefined}
            />
            {/* Show All button - appears when a location is selected */}
            {selectedLocationId && (
              <button
                onClick={handleClearSelection}
                className="absolute left-4 z-10 bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Show All
              </button>
            )}

            {/* Floating action buttons for selected location (map view) */}
            {selectedLocation && viewMode === "map" && (
              <div
                className="absolute right-4 z-10 flex flex-col gap-2"
                style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
              >
                {/* Location name label */}
                <div className="bg-white px-3 py-2 rounded-lg shadow-md text-sm font-medium text-gray-900 max-w-[200px] truncate">
                  {selectedLocation.name}
                </div>
                <div className="flex gap-2">
                  {/* Info button */}
                  <button
                    onClick={() => setDetailLocationId(selectedLocation._id)}
                    className="bg-white p-3 rounded-full shadow-md text-blue-600 hover:bg-blue-50 transition"
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
    </div>
  );
}

// Wrapper component that pre-fills coordinates in LocationForm
function LocationFormWithCoords({
  tripId,
  latitude,
  longitude,
  initialName,
  initialAddress,
  onSuccess,
  onCancel,
}: {
  tripId: Id<"trips">;
  latitude: number;
  longitude: number;
  initialName?: string;
  initialAddress?: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [dateTime, setDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [isHotel, setIsHotel] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLocation = useMutation(api.locations.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createLocation({
        tripId,
        name: name.trim(),
        latitude,
        longitude,
        dateTime: dateTime || undefined,
        endDateTime: isHotel && endDateTime ? endDateTime : undefined,
        isHotel,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to create location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Eiffel Tower"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Champ de Mars, Paris"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
        <div>Lat: {latitude.toFixed(5)}</div>
        <div>Lng: {longitude.toFixed(5)}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isHotel"
          checked={isHotel}
          onChange={(e) => setIsHotel(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="isHotel" className="text-sm text-gray-700">This is a hotel</label>
      </div>

      {isHotel && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Location"}
        </button>
      </div>
    </form>
  );
}

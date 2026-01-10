import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AttachmentList } from "./AttachmentList";
import { AttachmentUpload } from "./AttachmentUpload";

interface LocationDetailProps {
  location: Doc<"locations">;
  onClose: () => void;
}

// Mapbox types for address search
interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

export function LocationDetail({ location, onClose }: LocationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteLocation = useMutation(api.locations.remove);

  // Format date/time for display
  const formatDateTime = (dateTime: string | undefined): string => {
    if (!dateTime) return "";
    try {
      const date = new Date(dateTime);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateTime;
    }
  };

  // Helper to get directions URL
  const getDirectionsUrl = (lat: number, lng: number) => {
    const isApple = /iPhone|iPad|iPod|Mac/i.test(navigator.userAgent);
    return isApple
      ? `https://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLocation({ id: location._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
      setIsDeleting(false);
    }
  };

  // Close on backdrop click (desktop only)
  const handleBackdropClick = (e: React.MouseEvent) => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-surface lg:bg-black/50 lg:flex lg:items-center lg:justify-center lg:p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal container - full screen on mobile, centered modal on desktop */}
      <div className="h-full w-full lg:h-auto lg:w-full lg:max-w-lg lg:max-h-[90vh] lg:rounded-xl lg:shadow-xl lg:border lg:border-border-muted bg-surface lg:bg-surface-elevated flex flex-col">
        {/* Header */}
        <header className="bg-surface-elevated border-b border-border px-4 py-3 flex-shrink-0 lg:rounded-t-xl">
          <div className="flex items-center justify-between">
            {/* Mobile: Back button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-blue-600 font-medium lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {/* Desktop: Title */}
            <h2 className="hidden lg:block text-lg font-semibold text-text-primary truncate">{location.name}</h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 font-medium"
                >
                  Edit
                </button>
              )}
              {/* Desktop: Close button */}
              <button
                onClick={onClose}
                className="hidden lg:flex p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto lg:rounded-b-xl">
        {isEditing ? (
          <LocationEditForm
            location={location}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="p-4 space-y-6 lg:p-3 lg:space-y-3">
            {/* Title & Type - hidden on desktop (shown in header) */}
            <div className="lg:hidden">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-text-primary">{location.name}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  location.locationType === "hotel"
                    ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                    : location.locationType === "restaurant"
                      ? "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                      : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                }`}>
                  {location.locationType === "hotel" ? "Hotel" : location.locationType === "restaurant" ? "Restaurant" : "Attraction"}
                </span>
              </div>
              {location.address && (
                <p className="text-text-secondary mt-1">{location.address}</p>
              )}
            </div>

            {/* Desktop: Compact header with type badge and address */}
            <div className="hidden lg:block">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  location.locationType === "hotel"
                    ? "bg-purple-500/20 text-purple-700 dark:text-purple-400"
                    : location.locationType === "restaurant"
                      ? "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                      : "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                }`}>
                  {location.locationType === "hotel" ? "Hotel" : location.locationType === "restaurant" ? "Restaurant" : "Attraction"}
                </span>
              </div>
              {location.address && (
                <p className="text-sm text-text-secondary">{location.address}</p>
              )}
            </div>

            {/* Get Directions Button */}
            <button
              onClick={() => window.open(getDirectionsUrl(location.latitude, location.longitude), "_blank")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium lg:w-auto lg:px-3 lg:py-1.5 lg:text-sm"
            >
              <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </button>

            {/* Details */}
            <div className="bg-surface-elevated rounded-lg border border-border divide-y divide-border lg:bg-transparent lg:border-0 lg:divide-y-0 lg:space-y-1">
              {location.dateTime && (
                <div className="px-4 py-3 lg:px-0 lg:py-1 lg:flex lg:items-center lg:gap-2">
                  <div className="text-sm text-text-secondary lg:text-xs lg:min-w-[80px]">Date & Time</div>
                  <div className="text-text-primary lg:text-sm">{formatDateTime(location.dateTime)}</div>
                </div>
              )}
              {location.locationType === "hotel" && location.endDateTime && (
                <div className="px-4 py-3 lg:px-0 lg:py-1 lg:flex lg:items-center lg:gap-2">
                  <div className="text-sm text-text-secondary lg:text-xs lg:min-w-[80px]">Check-out</div>
                  <div className="text-text-primary lg:text-sm">{formatDateTime(location.endDateTime)}</div>
                </div>
              )}
              <div className="px-4 py-3 lg:px-0 lg:py-1 lg:flex lg:items-center lg:gap-2">
                <div className="text-sm text-text-secondary lg:text-xs lg:min-w-[80px]">Coordinates</div>
                <div className="text-text-primary lg:text-sm">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {location.notes && (
              <div>
                <h2 className="text-sm font-medium text-text-secondary mb-2 lg:text-xs lg:mb-1">Notes</h2>
                <div className="bg-surface-elevated rounded-lg border border-border p-4 lg:p-2 lg:bg-surface-secondary lg:border-0">
                  <p className="text-text-primary whitespace-pre-wrap lg:text-sm">{location.notes}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <h2 className="text-sm font-medium text-text-secondary mb-2 lg:text-xs lg:mb-1">Attachments</h2>
              <div className="bg-surface-elevated rounded-lg border border-border p-4 space-y-4 lg:p-2 lg:space-y-2 lg:bg-surface-secondary lg:border-0">
                <AttachmentList locationId={location._id} />
                <AttachmentUpload locationId={location._id} />
              </div>
            </div>

            {/* Delete */}
            <div className="pt-4 lg:pt-2 lg:border-t lg:border-border">
              {showDeleteConfirm ? (
                <div className="bg-red-500/10 rounded-lg p-4 space-y-3 lg:p-2 lg:space-y-2">
                  <p className="text-red-700 dark:text-red-400 lg:text-sm">Delete this location? This cannot be undone.</p>
                  <div className="flex gap-3 lg:gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary bg-surface-elevated lg:px-2 lg:py-1 lg:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 lg:px-2 lg:py-1 lg:text-sm"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 text-red-600 font-medium lg:w-auto lg:px-0 lg:py-1 lg:text-sm lg:font-normal"
                >
                  Delete Location
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// Location type options
type LocationType = "attraction" | "restaurant" | "hotel";

const locationTypeOptions: { value: LocationType; label: string; color: string }[] = [
  { value: "attraction", label: "Attraction", color: "bg-blue-500" },
  { value: "restaurant", label: "Restaurant", color: "bg-orange-500" },
  { value: "hotel", label: "Hotel", color: "bg-purple-500" },
];

// Edit form component
function LocationEditForm({
  location,
  onSave,
  onCancel,
}: {
  location: Doc<"locations">;
  onSave: () => void;
  onCancel: () => void;
}) {
  // Helper functions for date/time conversion
  function toDatePart(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }

  function toTimePart(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(11, 16);
    } catch {
      return "";
    }
  }

  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address || "");
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [date, setDate] = useState(location.dateTime ? toDatePart(location.dateTime) : "");
  const [time, setTime] = useState(location.dateTime ? toTimePart(location.dateTime) : "");
  const [endDate, setEndDate] = useState(location.endDateTime ? toDatePart(location.endDateTime) : "");
  const [endTime, setEndTime] = useState(location.endDateTime ? toTimePart(location.endDateTime) : "");
  const [locationType, setLocationType] = useState<LocationType>(location.locationType || "attraction");
  const [notes, setNotes] = useState(location.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address search state
  const [addressResults, setAddressResults] = useState<MapboxFeature[]>([]);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coordinatesUpdated, setCoordinatesUpdated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const updateLocation = useMutation(api.locations.update);

  // Combine date and time into datetime-local format
  function combineDateTime(d: string, t: string): string {
    if (!d) return "";
    return t ? `${d}T${t}` : `${d}T00:00`;
  }

  // Search for addresses when typing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!address.trim() || address === location.address) {
      setAddressResults([]);
      setShowAddressResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        const encodedQuery = encodeURIComponent(address.trim());
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          setAddressResults(data.features || []);
          setShowAddressResults((data.features || []).length > 0);
        }
      } catch (error) {
        console.error("Address search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [address, location.address]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setShowAddressResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    setAddress(feature.place_name);
    setLatitude(lat);
    setLongitude(lng);
    setCoordinatesUpdated(true);
    setShowAddressResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateLocation({
        id: location._id,
        name: name.trim(),
        address: address.trim() || undefined,
        latitude,
        longitude,
        dateTime: combineDateTime(date, time), // Pass empty string to clear
        endDateTime: locationType === "hotel" ? combineDateTime(endDate, endTime) : "", // Pass empty string to clear
        locationType,
        notes: notes.trim() || undefined,
      });
      onSave();
    } catch (error) {
      console.error("Failed to update location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 lg:p-3 lg:space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 lg:text-xs">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:px-3 lg:py-2 lg:text-sm"
          placeholder="e.g., Eiffel Tower"
        />
      </div>

      <div ref={addressContainerRef} className="relative">
        <label className="block text-sm font-medium text-text-secondary mb-1 lg:text-xs">
          Address
          {isSearching && <span className="ml-2 text-text-muted">(searching...)</span>}
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setCoordinatesUpdated(false);
          }}
          onFocus={() => {
            if (addressResults.length > 0) {
              setShowAddressResults(true);
            }
          }}
          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:px-3 lg:py-2 lg:text-sm"
          placeholder="Search for an address..."
        />

        {/* Address search results dropdown */}
        {showAddressResults && addressResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-surface-elevated rounded-lg border border-border shadow-lg max-h-48 overflow-y-auto">
            {addressResults.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleAddressSelect(feature)}
                className="w-full px-4 py-3 text-left hover:bg-surface-secondary border-b border-border-muted last:border-b-0 lg:px-3 lg:py-2"
              >
                <div className="font-medium text-text-primary truncate lg:text-sm">{feature.text}</div>
                <div className="text-sm text-text-secondary truncate lg:text-xs">{feature.place_name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Coordinates indicator */}
        <div className="mt-1 text-sm text-text-muted flex items-center gap-2 lg:text-xs">
          <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          {coordinatesUpdated && (
            <span className="text-green-600 font-medium">Updated</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2 lg:text-xs lg:mb-1">Type</label>
        <div className="flex gap-2 lg:gap-1">
          {locationTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocationType(option.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all lg:px-2 lg:py-1.5 lg:text-xs ${
                locationType === option.value
                  ? `${option.color} text-white`
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-inset"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 lg:text-xs">Date & Time</label>
        <div className="flex gap-2 lg:gap-1">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:px-2 lg:py-1.5 lg:text-sm"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-28 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:w-24 lg:px-2 lg:py-1.5 lg:text-sm"
          />
          <button
            type="button"
            onClick={() => { setDate(""); setTime(""); }}
            className={`px-3 py-3 rounded-lg border border-border transition lg:px-2 lg:py-1.5 ${date ? "text-text-muted hover:text-text-secondary hover:bg-surface-secondary" : "text-text-muted cursor-not-allowed"}`}
            title="Clear date"
            disabled={!date}
          >
            <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {locationType === "hotel" && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1 lg:text-xs">Check-out</label>
          <div className="flex gap-2 lg:gap-1">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:px-2 lg:py-1.5 lg:text-sm"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-28 px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 lg:w-24 lg:px-2 lg:py-1.5 lg:text-sm"
            />
            <button
              type="button"
              onClick={() => { setEndDate(""); setEndTime(""); }}
              className={`px-3 py-3 rounded-lg border border-border transition lg:px-2 lg:py-1.5 ${endDate ? "text-text-muted hover:text-text-secondary hover:bg-surface-secondary" : "text-text-muted cursor-not-allowed"}`}
              title="Clear date"
              disabled={!endDate}
            >
              <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 lg:text-xs">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none lg:px-3 lg:py-2 lg:text-sm"
        />
      </div>

      <div className="flex gap-3 pt-4 lg:gap-2 lg:pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-border rounded-lg text-text-secondary font-medium lg:px-3 lg:py-2 lg:text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 lg:px-3 lg:py-2 lg:text-sm"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

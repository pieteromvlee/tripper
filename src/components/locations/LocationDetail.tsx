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

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-blue-600 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <LocationEditForm
            location={location}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="p-4 space-y-6">
            {/* Title & Type */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  location.locationType === "hotel"
                    ? "bg-purple-100 text-purple-800"
                    : location.locationType === "restaurant"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                }`}>
                  {location.locationType === "hotel" ? "Hotel" : location.locationType === "restaurant" ? "Restaurant" : "Attraction"}
                </span>
              </div>
              {location.address && (
                <p className="text-gray-600 mt-1">{location.address}</p>
              )}
            </div>

            {/* Get Directions Button */}
            <button
              onClick={() => window.open(getDirectionsUrl(location.latitude, location.longitude), "_blank")}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </button>

            {/* Details */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {location.dateTime && (
                <div className="px-4 py-3">
                  <div className="text-sm text-gray-500">Date & Time</div>
                  <div className="text-gray-900">{formatDateTime(location.dateTime)}</div>
                </div>
              )}
              {location.locationType === "hotel" && location.endDateTime && (
                <div className="px-4 py-3">
                  <div className="text-sm text-gray-500">Check-out</div>
                  <div className="text-gray-900">{formatDateTime(location.endDateTime)}</div>
                </div>
              )}
              <div className="px-4 py-3">
                <div className="text-sm text-gray-500">Coordinates</div>
                <div className="text-gray-900">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {location.notes && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-2">Notes</h2>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{location.notes}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">Attachments</h2>
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                <AttachmentList locationId={location._id} />
                <AttachmentUpload locationId={location._id} />
              </div>
            </div>

            {/* Delete */}
            <div className="pt-4">
              {showDeleteConfirm ? (
                <div className="bg-red-50 rounded-lg p-4 space-y-3">
                  <p className="text-red-800">Delete this location? This cannot be undone.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 text-red-600 font-medium"
                >
                  Delete Location
                </button>
              )}
            </div>
          </div>
        )}
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
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address || "");
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [dateTime, setDateTime] = useState(
    location.dateTime ? toDateTimeLocal(location.dateTime) : ""
  );
  const [endDateTime, setEndDateTime] = useState(
    location.endDateTime ? toDateTimeLocal(location.endDateTime) : ""
  );
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

  // Convert ISO string to datetime-local format
  function toDateTimeLocal(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
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
        dateTime: dateTime || undefined,
        endDateTime: locationType === "hotel" && endDateTime ? endDateTime : undefined,
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
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Eiffel Tower"
        />
      </div>

      <div ref={addressContainerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
          {isSearching && <span className="ml-2 text-gray-400">(searching...)</span>}
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search for an address..."
        />

        {/* Address search results dropdown */}
        {showAddressResults && addressResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
            {addressResults.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleAddressSelect(feature)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 truncate">{feature.text}</div>
                <div className="text-sm text-gray-500 truncate">{feature.place_name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Coordinates indicator */}
        <div className="mt-1 text-sm text-gray-400 flex items-center gap-2">
          <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          {coordinatesUpdated && (
            <span className="text-green-600 font-medium">Updated</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <div className="flex gap-2">
          {locationTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocationType(option.value)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                locationType === option.value
                  ? `${option.color} text-white`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {locationType === "hotel" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

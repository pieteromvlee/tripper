import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AttachmentList } from "./AttachmentList";
import { AttachmentUpload } from "./AttachmentUpload";

interface LocationCardProps {
  location: Doc<"locations">;
  isSelected: boolean;
  onClick: () => void;
  onOpenDetail?: () => void; // Open full-screen detail view (mobile)
}

/**
 * Detects if the user is on an Apple device (iOS or macOS)
 */
function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  // Check for iOS devices
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  // Check for macOS
  const isMac = platform.includes("mac") || /macintosh/.test(userAgent);

  return isIOS || isMac;
}

/**
 * Generates a maps URL for directions to the given coordinates
 */
function getDirectionsUrl(latitude: number, longitude: number): string {
  if (isAppleDevice()) {
    return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export function LocationCard({
  location,
  isSelected,
  onClick,
  onOpenDetail,
}: LocationCardProps) {
  const [showAttachments, setShowAttachments] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Query attachment count for this location
  const attachmentCount = useQuery(api.attachments.countByLocation, {
    locationId: location._id,
  });

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

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-lg cursor-pointer transition-all duration-200
        min-h-[72px] touch-manipulation
        ${
          isSelected
            ? "bg-blue-50 border-2 border-blue-500 shadow-md"
            : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3
            className={`
              font-medium text-base truncate
              ${isSelected ? "text-blue-900" : "text-gray-900"}
            `}
          >
            {location.name}
          </h3>

          {/* Address */}
          {location.address && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {location.address}
            </p>
          )}

          {/* Date/Time */}
          {location.dateTime && (
            <p
              className={`
                text-sm mt-1
                ${isSelected ? "text-blue-700" : "text-gray-600"}
              `}
            >
              {formatDateTime(location.dateTime)}
              {location.isHotel && location.endDateTime && (
                <span className="text-gray-400">
                  {" "}
                  - {formatDateTime(location.endDateTime)}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Info button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Use full-screen detail view when handler provided (mobile)
              if (onOpenDetail) {
                onOpenDetail();
              } else {
                setShowInfo(!showInfo);
                if (showInfo) setIsEditing(false);
              }
            }}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                isSelected
                  ? "text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }
              ${showInfo ? "bg-blue-100" : ""}
            `}
            title="Info"
            aria-label="Info"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Attachments button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachments(!showAttachments);
            }}
            className={`
              p-1.5 rounded-md transition-colors relative
              ${
                isSelected
                  ? "text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }
              ${showAttachments ? "bg-blue-100" : ""}
            `}
            title="Attachments"
            aria-label="Attachments"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            {/* Attachment count badge */}
            {attachmentCount !== undefined && attachmentCount > 0 && (
              <span
                className={`
                  absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                  flex items-center justify-center
                  text-[10px] font-bold rounded-full
                  ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-500 text-white"
                  }
                `}
              >
                {attachmentCount}
              </span>
            )}
          </button>

          {/* Get Directions button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(
                getDirectionsUrl(location.latitude, location.longitude),
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                isSelected
                  ? "text-blue-600 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }
            `}
            title="Get Directions"
            aria-label="Get Directions"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </button>

          {/* Hotel badge */}
          {location.isHotel && (
            <span
              className={`
                inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                ${
                  isSelected
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }
              `}
            >
              Hotel
            </span>
          )}
        </div>
      </div>

      {/* Notes preview - only show when info panel is closed */}
      {location.notes && !showInfo && (
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
          {location.notes}
        </p>
      )}

      {/* Info section (expandable) */}
      {showInfo && (
        <div
          className="mt-3 pt-3 border-t border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              {isEditing ? "Edit Location" : "Location Details"}
            </h4>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => {
                  setShowInfo(false);
                  setIsEditing(false);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                aria-label="Close info"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {isEditing ? (
            <LocationEditForm
              location={location}
              onSave={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="text-gray-900">{location.name}</span>
              </div>
              {location.address && (
                <div>
                  <span className="text-gray-500">Address:</span>{" "}
                  <span className="text-gray-900">{location.address}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Coordinates:</span>{" "}
                <span className="text-gray-900">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </span>
              </div>
              {location.dateTime && (
                <div>
                  <span className="text-gray-500">Date/Time:</span>{" "}
                  <span className="text-gray-900">{formatDateTime(location.dateTime)}</span>
                </div>
              )}
              {location.isHotel && location.endDateTime && (
                <div>
                  <span className="text-gray-500">Check-out:</span>{" "}
                  <span className="text-gray-900">{formatDateTime(location.endDateTime)}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Type:</span>{" "}
                <span className="text-gray-900">{location.isHotel ? "Hotel" : "Location"}</span>
              </div>
              {location.notes && (
                <div>
                  <span className="text-gray-500">Notes:</span>{" "}
                  <span className="text-gray-900 whitespace-pre-wrap">{location.notes}</span>
                </div>
              )}

              {/* Delete section */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                {showDeleteConfirm ? (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600">Delete this location? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setIsDeleting(true);
                          try {
                            await deleteLocation({ id: location._id });
                          } catch (error) {
                            console.error("Failed to delete:", error);
                            setIsDeleting(false);
                          }
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete location
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attachments section (expandable) */}
      {showAttachments && (
        <div
          className="mt-3 pt-3 border-t border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
            <button
              onClick={() => setShowAttachments(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Close attachments"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>

          {/* Attachment list */}
          <AttachmentList locationId={location._id} />

          {/* Upload component */}
          <div className="mt-3">
            <AttachmentUpload locationId={location._id} />
          </div>
        </div>
      )}
    </div>
  );
}

// Mapbox types for address search
interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

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
  const [isHotel, setIsHotel] = useState(location.isHotel);
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
      // Format: YYYY-MM-DDTHH:mm
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
        endDateTime: isHotel && endDateTime ? endDateTime : undefined,
        isHotel,
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Eiffel Tower"
        />
      </div>

      <div ref={addressContainerRef} className="relative">
        <label className="block text-xs font-medium text-gray-700 mb-1">
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
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900 truncate">{feature.text}</div>
                <div className="text-xs text-gray-500 truncate">{feature.place_name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Coordinates indicator */}
        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
          <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          {coordinatesUpdated && (
            <span className="text-green-600 font-medium">Updated</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Date & Time</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`isHotel-${location._id}`}
          checked={isHotel}
          onChange={(e) => setIsHotel(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor={`isHotel-${location._id}`} className="text-xs text-gray-700">
          This is a hotel
        </label>
      </div>

      {isHotel && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Check-out</label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

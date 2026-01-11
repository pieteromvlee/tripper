import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { AttachmentList } from "./AttachmentList";
import { AttachmentUpload } from "./AttachmentUpload";
import { getCategoryBadgeStyle } from "../../lib/colorUtils";
import { getDirectionsUrl, formatDateTime } from "../../lib/locationUtils";
import { CategoryIcon } from "../../lib/typeIcons";

interface LocationDetailProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  onClose: () => void;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

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

function combineDateTime(date: string, time: string): string {
  if (!date) return "";
  return time ? `${date}T${time}` : `${date}T00:00`;
}

export function LocationDetail({ location, categories, onClose }: LocationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteLocation = useMutation(api.locations.remove);
  const updateLocation = useMutation(api.locations.update);

  // Find category for this location
  const category = categories?.find(c => c._id === location.categoryId);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteLocation({ id: location._id });
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleteError(error instanceof Error ? error.message : "Failed to delete location");
      setIsDeleting(false);
    }
  };

  // Close on backdrop click (desktop only)
  const handleBackdropClick = (e: React.MouseEvent) => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-surface md:bg-black/80 md:flex md:items-center md:justify-center md:p-4"
      onClick={handleBackdropClick}
    >
      {/* Modal container - full screen on mobile, centered modal on desktop */}
      <div className="h-full w-full md:h-auto md:w-full md:max-w-lg md:max-h-[90vh] md:border md:border-border bg-surface md:bg-surface-elevated flex flex-col">
        {/* Header */}
        <header className="bg-surface-secondary border-b border-border px-4 py-2 flex-shrink-0 md:px-3 md:py-2">
          <div className="flex items-center justify-between">
            {/* Mobile: Back button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-blue-400 text-sm font-medium md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            {/* Desktop: Title with category icon */}
            <div className="hidden md:flex items-center gap-2 min-w-0">
              {category && (
                <CategoryIcon
                  iconName={category.iconName}
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: category.color }}
                />
              )}
              <h2 className="text-sm font-bold text-text-primary truncate">{location.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              {!isEditing && (
                <>
                  {/* Directions button */}
                  <button
                    onClick={() => window.open(getDirectionsUrl(location.latitude, location.longitude), "_blank")}
                    className="text-blue-400 text-sm px-2 py-1 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/50 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden md:inline">Directions</span>
                  </button>
                  {/* Edit button */}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-400 text-sm px-2 py-1 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/50"
                  >
                    Edit
                  </button>
                </>
              )}
              {/* Desktop: Close button */}
              <button
                onClick={onClose}
                className="hidden md:flex p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition-colors items-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <LocationEditForm
            location={location}
            categories={categories}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="p-4 space-y-4 md:p-3 md:space-y-2">
            {/* Mobile: Title with icon and address */}
            <div className="md:hidden">
              <div className="flex items-center gap-2">
                {category && (
                  <CategoryIcon
                    iconName={category.iconName}
                    className="w-5 h-5"
                    style={{ color: category.color }}
                  />
                )}
                <h1 className="text-lg font-bold text-text-primary">{location.name}</h1>
              </div>
              {location.address && (
                <p className="text-sm text-text-secondary mt-1">{location.address}</p>
              )}
            </div>

            {/* Desktop: Address only (title shown in header) */}
            {location.address && (
              <div className="hidden md:block">
                <p className="text-xs text-text-secondary">{location.address}</p>
              </div>
            )}

            {/* Mobile: Get Directions Button */}
            <button
              onClick={() => window.open(getDirectionsUrl(location.latitude, location.longitude), "_blank")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white border border-blue-400 text-sm font-medium md:hidden"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Directions
            </button>

            {/* Details */}
            <div className="bg-surface-elevated border border-border divide-y divide-border md:bg-transparent md:border-0 md:divide-y-0 md:space-y-1">
              {location.dateTime && (
                <div className="px-3 py-2 md:px-0 md:py-1 md:flex md:items-baseline md:gap-2">
                  <div className="text-xs text-text-secondary uppercase tracking-wide md:text-sm md:normal-case md:tracking-normal md:min-w-[100px]">Date & Time</div>
                  <div className="text-sm text-text-primary">{formatDateTime(location.dateTime)}</div>
                </div>
              )}
              {category?.name.toLowerCase() === "accommodation" && location.endDateTime && (
                <div className="px-3 py-2 md:px-0 md:py-1 md:flex md:items-baseline md:gap-2">
                  <div className="text-xs text-text-secondary uppercase tracking-wide md:text-sm md:normal-case md:tracking-normal md:min-w-[100px]">Check-out</div>
                  <div className="text-sm text-text-primary">{formatDateTime(location.endDateTime)}</div>
                </div>
              )}
              <div className="px-3 py-2 md:px-0 md:py-1 md:flex md:items-baseline md:gap-2">
                <div className="text-xs text-text-secondary uppercase tracking-wide md:text-sm md:normal-case md:tracking-normal md:min-w-[100px]">Coordinates</div>
                <div className="text-sm text-text-primary">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {location.notes && (
              <div>
                <h2 className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Notes</h2>
                <div className="bg-surface-secondary border border-border p-3 md:p-2">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{location.notes}</p>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <h2 className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Attachments</h2>
              <div className="bg-surface-secondary border border-border p-3 space-y-3 md:p-2 md:space-y-2">
                <AttachmentList locationId={location._id} />
                <AttachmentUpload locationId={location._id} />
              </div>
            </div>

            {/* Delete */}
            <div className="pt-3 md:pt-2 border-t border-border">
              {showDeleteConfirm ? (
                <div className="bg-red-500/10 border border-red-500/50 p-3 space-y-3 md:p-2 md:space-y-2">
                  <p className="text-red-400 text-sm">Delete this location? This cannot be undone.</p>
                  {deleteError && (
                    <p className="text-red-300 text-xs bg-red-500/20 px-2 py-1 border border-red-500/30">{deleteError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-1.5 border border-border text-text-secondary bg-surface-elevated text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white border border-red-400 disabled:opacity-50 text-xs"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 text-red-400 text-xs border border-transparent hover:border-red-500/50 hover:bg-red-500/10"
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

interface LocationEditFormProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  onSave: () => void;
  onCancel: () => void;
}

function LocationEditForm({
  location,
  categories,
  onSave,
  onCancel,
}: LocationEditFormProps) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address || "");
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [date, setDate] = useState(location.dateTime ? toDatePart(location.dateTime) : "");
  const [time, setTime] = useState(location.dateTime ? toTimePart(location.dateTime) : "");
  const [endDate, setEndDate] = useState(location.endDateTime ? toDatePart(location.endDateTime) : "");
  const [endTime, setEndTime] = useState(location.endDateTime ? toTimePart(location.endDateTime) : "");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(location.categoryId || null);
  const [notes, setNotes] = useState(location.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = categories?.find(c => c._id === categoryId);
  const isAccommodation = selectedCategory?.name.toLowerCase() === "accommodation";

  // Address search state
  const [addressResults, setAddressResults] = useState<MapboxFeature[]>([]);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coordinatesUpdated, setCoordinatesUpdated] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const updateLocation = useMutation(api.locations.update);

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
        endDateTime: isAccommodation ? combineDateTime(endDate, endTime) : "", // Pass empty string to clear
        categoryId: categoryId || undefined,
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
    <form onSubmit={handleSubmit} className="p-4 space-y-4 md:p-3 md:space-y-3">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 md:text-xs">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:px-3 md:py-2 md:text-sm"
          placeholder="e.g., Eiffel Tower"
        />
      </div>

      <div ref={addressContainerRef} className="relative">
        <label className="block text-sm font-medium text-text-secondary mb-1 md:text-xs">
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
          className="w-full px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:px-3 md:py-2 md:text-sm"
          placeholder="Search for an address..."
        />

        {/* Address search results dropdown */}
        {showAddressResults && addressResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-surface-elevated border border-border shadow-lg max-h-48 overflow-y-auto">
            {addressResults.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => handleAddressSelect(feature)}
                className="w-full px-4 py-3 text-left hover:bg-surface-secondary border-b border-border-muted last:border-b-0 md:px-3 md:py-2"
              >
                <div className="font-medium text-text-primary truncate md:text-sm">{feature.text}</div>
                <div className="text-sm text-text-secondary truncate md:text-xs">{feature.place_name}</div>
              </button>
            ))}
          </div>
        )}

        {/* Coordinates indicator */}
        <div className="mt-1 text-sm text-text-muted flex items-center gap-2 md:text-xs">
          <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
          {coordinatesUpdated && (
            <span className="text-green-600 font-medium">Updated</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2 md:text-xs md:mb-1">Category</label>
        {categories === undefined ? (
          <div className="text-xs text-text-secondary">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 border border-red-500/30">
            No categories available. Please create a category first.
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap md:gap-1">
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setCategoryId(cat._id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all border md:px-2 md:py-1.5 md:text-xs ${
                  categoryId === cat._id
                    ? "text-white border-transparent"
                    : "bg-surface-secondary text-text-secondary border-border hover:bg-surface-inset hover:border-border-focus"
                }`}
                style={categoryId === cat._id ? { backgroundColor: cat.color } : undefined}
              >
                <CategoryIcon iconName={cat.iconName} className="w-3.5 h-3.5" />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 md:text-xs">Date & Time</label>
        <div className="flex gap-2 md:gap-1">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:px-2 md:py-1.5 md:text-sm"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-28 px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:w-24 md:px-2 md:py-1.5 md:text-sm"
          />
          <button
            type="button"
            onClick={() => { setDate(""); setTime(""); }}
            className={`px-3 py-3 border border-border transition md:px-2 md:py-1.5 ${date ? "text-text-muted hover:text-text-secondary hover:bg-surface-secondary" : "text-text-muted cursor-not-allowed"}`}
            title="Clear date"
            disabled={!date}
          >
            <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {isAccommodation && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1 md:text-xs">Check-out</label>
          <div className="flex gap-2 md:gap-1">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:px-2 md:py-1.5 md:text-sm"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-28 px-4 py-3 border border-border focus:outline-none focus:border-blue-400 md:w-24 md:px-2 md:py-1.5 md:text-sm"
            />
            <button
              type="button"
              onClick={() => { setEndDate(""); setEndTime(""); }}
              className={`px-3 py-3 border border-border transition md:px-2 md:py-1.5 ${endDate ? "text-text-muted hover:text-text-secondary hover:bg-surface-secondary" : "text-text-muted cursor-not-allowed"}`}
              title="Clear date"
              disabled={!endDate}
            >
              <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1 md:text-xs">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-border focus:outline-none focus:border-blue-400 resize-none md:px-3 md:py-2 md:text-sm"
        />
      </div>

      <div className="flex gap-3 pt-4 md:gap-2 md:pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-border text-text-secondary font-medium md:px-3 md:py-2 md:text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting || !categoryId}
          className="flex-1 px-4 py-3 bg-blue-600 text-white border border-blue-400 font-medium disabled:opacity-50 md:px-3 md:py-2 md:text-sm"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CategoryIcon } from "../../lib/typeIcons";
import { getDatePart, getTimePart, combineDateTime } from "../../lib/dateUtils";
import { isAccommodationCategory } from "../../lib/categoryUtils";
import { logger } from "../../lib/logger";
import { useClickOutside } from "../../hooks";

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  properties?: {
    category?: string;
  };
  place_type?: string[];
}

interface LocationEditFormProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  onSave: () => void;
  onCancel: () => void;
}

export function LocationEditForm({
  location,
  categories,
  onSave,
  onCancel,
}: LocationEditFormProps) {
  const [name, setName] = useState(location.name);
  const [address, setAddress] = useState(location.address || "");
  const [latitude, setLatitude] = useState(location.latitude);
  const [longitude, setLongitude] = useState(location.longitude);
  const [date, setDate] = useState(location.dateTime ? getDatePart(location.dateTime) : "");
  const [time, setTime] = useState(location.dateTime ? getTimePart(location.dateTime) : "");
  const [endDate, setEndDate] = useState(location.endDateTime ? getDatePart(location.endDateTime) : "");
  const [endTime, setEndTime] = useState(location.endDateTime ? getTimePart(location.endDateTime) : "");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(location.categoryId || null);
  const [notes, setNotes] = useState(location.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = categories?.find(c => c._id === categoryId);
  const isAccommodation = isAccommodationCategory(selectedCategory);

  // Address search state
  const [addressResults, setAddressResults] = useState<MapboxFeature[]>([]);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [coordinatesUpdated, setCoordinatesUpdated] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
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
        logger.error("Address search error:", error);
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
  useClickOutside(addressContainerRef, () => setShowAddressResults(false), showAddressResults);

  const handleAddressSelect = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    setAddress(feature.place_name);
    setLatitude(lat);
    setLongitude(lng);
    setCoordinatesUpdated(true);
    setShowAddressResults(false);
  };

  const handlePrefillAddress = async () => {
    setIsPrefilling(true);
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=poi,address&limit=1`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const isPOI = feature.properties?.category || feature.place_type?.includes('poi');

          if (isPOI && feature.text) {
            // For POIs, extract address without the POI name
            let addr = feature.place_name;
            if (addr.startsWith(feature.text)) {
              addr = addr.slice(feature.text.length).replace(/^,\s*/, "");
            }
            setAddress(addr);
          } else {
            // For generic addresses, use full place_name
            setAddress(feature.place_name);
          }
        }
      }
    } catch (error) {
      logger.error("Address prefill failed:", error);
    } finally {
      setIsPrefilling(false);
    }
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
      logger.error("Failed to update location:", error);
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
          {!address.trim() && (
            <button
              type="button"
              onClick={handlePrefillAddress}
              disabled={isPrefilling}
              className="text-blue-400 hover:text-blue-300 text-xs underline disabled:opacity-50"
            >
              {isPrefilling ? "loading..." : "prefill address"}
            </button>
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
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="HH:mm"
            pattern="[0-2][0-9]:[0-5][0-9]"
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
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="HH:mm"
              pattern="[0-2][0-9]:[0-5][0-9]"
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

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CategoryIcon } from "../../lib/typeIcons";

interface LocationFormProps {
  tripId: Id<"trips">;
  latitude: number;
  longitude: number;
  initialName?: string;
  initialAddress?: string;
  initialCategoryId?: Id<"categories">;
  onSuccess: () => void;
  onCancel: () => void;
  variant: "inline" | "fullscreen";
}

export function LocationForm({
  tripId,
  latitude,
  longitude,
  initialName,
  initialAddress,
  initialCategoryId,
  onSuccess,
  onCancel,
  variant,
}: LocationFormProps) {
  const categories = useQuery(api.categories.list, { tripId });

  const [name, setName] = useState(initialName || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(initialCategoryId || null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLocation = useMutation(api.locations.create);

  // Set default category when categories load
  if (categories && categories.length > 0 && !categoryId) {
    setCategoryId(categories[0]._id);
  }

  const selectedCategory = categories?.find(c => c._id === categoryId);
  const isAccommodation = selectedCategory?.name.toLowerCase() === "accommodation";

  const combineDateTime = (d: string, t: string) => {
    if (!d) return undefined;
    return t ? `${d}T${t}` : `${d}T00:00`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting || !categoryId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createLocation({
        tripId,
        name: name.trim(),
        latitude,
        longitude,
        dateTime: combineDateTime(date, time),
        endDateTime: isAccommodation ? combineDateTime(endDate, endTime) : undefined,
        categoryId,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to create location:", err);
      setError(err instanceof Error ? err.message : "Failed to create location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullscreen = variant === "fullscreen";
  const inputPadding = isFullscreen ? "px-4 py-3" : "px-3 py-2";
  const inputTextSize = isFullscreen ? "text-base" : "";

  const formContent = (
    <form onSubmit={handleSubmit} className={`${isFullscreen ? "p-4" : "p-3"} space-y-3`}>
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
          placeholder="e.g., Eiffel Tower"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
          placeholder="e.g., Champ de Mars, Paris"
        />
      </div>

      {isFullscreen ? (
        <div className="bg-surface-secondary border border-border p-3">
          <div className="text-xs text-text-secondary mb-1 uppercase tracking-wide">Coordinates</div>
          <div className="text-sm text-text-primary">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary">
          <div>Lat: {latitude.toFixed(5)}</div>
          <div>Lng: {longitude.toFixed(5)}</div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">Category</label>
        {categories === undefined ? (
          <div className="text-xs text-text-secondary">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-xs text-red-400 bg-red-500/10 px-3 py-2 border border-red-500/30">
            No categories available. Please create a category first.
          </div>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() => setCategoryId(category._id)}
                className={`flex items-center gap-1.5 px-2 ${isFullscreen ? "py-2" : "py-1.5"} text-xs font-medium transition-colors border ${
                  categoryId === category._id
                    ? "text-white border-transparent"
                    : "bg-surface-secondary text-text-secondary border-border hover:bg-surface-inset hover:border-border-focus"
                }`}
                style={categoryId === category._id ? { backgroundColor: category.color } : undefined}
              >
                <CategoryIcon iconName={category.iconName} className="w-3.5 h-3.5" />
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Date & Time</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`flex-1 ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-28 ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
          />
        </div>
      </div>

      {isAccommodation && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Check-out</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`flex-1 ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-28 ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize}`}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={isFullscreen ? 3 : 2}
          className={`w-full ${inputPadding} border border-border bg-surface-inset focus:outline-none focus:border-blue-400 ${inputTextSize} resize-none`}
          placeholder={isFullscreen ? "Add any notes..." : undefined}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 border border-red-500/30">{error}</p>
      )}

      {!isFullscreen && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border text-text-secondary hover:bg-surface-secondary hover:border-border-focus text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting || !categoryId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white border border-blue-400 hover:bg-blue-500 disabled:opacity-50 text-xs"
          >
            {isSubmitting ? "Adding..." : "Add Location"}
          </button>
        </div>
      )}
    </form>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-elevated flex flex-col">
        <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-secondary">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">Add Location</h2>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting || !categoryId}
            className="px-4 py-1.5 bg-green-600 text-white border border-green-400 text-xs font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          {formContent}
        </div>
      </div>
    );
  }

  return formContent;
}

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { locationTypeOptions, type LocationType } from "../../lib/locationStyles";

interface LocationFormProps {
  tripId: Id<"trips">;
  latitude: number;
  longitude: number;
  initialName?: string;
  initialAddress?: string;
  initialLocationType?: LocationType;
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
  initialLocationType,
  onSuccess,
  onCancel,
  variant,
}: LocationFormProps) {
  const [name, setName] = useState(initialName || "");
  const [address, setAddress] = useState(initialAddress || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState<LocationType>(initialLocationType || "attraction");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLocation = useMutation(api.locations.create);

  const combineDateTime = (d: string, t: string) => {
    if (!d) return undefined;
    return t ? `${d}T${t}` : `${d}T00:00`;
  };

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
        dateTime: combineDateTime(date, time),
        endDateTime: locationType === "accommodation" ? combineDateTime(endDate, endTime) : undefined,
        locationType,
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

  const isFullscreen = variant === "fullscreen";
  const inputPadding = isFullscreen ? "px-4 py-3" : "px-3 py-2";
  const inputTextSize = isFullscreen ? "text-base" : "";

  const formContent = (
    <form onSubmit={handleSubmit} className={`${isFullscreen ? "p-4" : "p-4"} space-y-4`}>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
          placeholder="e.g., Eiffel Tower"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
          placeholder="e.g., Champ de Mars, Paris"
        />
      </div>

      {isFullscreen ? (
        <div className="bg-surface-secondary rounded-lg p-3">
          <div className="text-sm text-text-secondary mb-1">Coordinates</div>
          <div className="text-text-primary">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-sm text-text-secondary">
          <div>Lat: {latitude.toFixed(5)}</div>
          <div>Lng: {longitude.toFixed(5)}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
        <div className="flex gap-2">
          {locationTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLocationType(option.value)}
              className={`flex-1 px-3 ${isFullscreen ? "py-3" : "py-2"} rounded-lg text-sm font-medium transition-all ${
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
        <label className="block text-sm font-medium text-text-secondary mb-1">Date & Time</label>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`flex-1 ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={`w-28 ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
          />
        </div>
      </div>

      {locationType === "accommodation" && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Check-out</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`flex-1 ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`w-28 ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize}`}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={isFullscreen ? 3 : 2}
          className={`w-full ${inputPadding} border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputTextSize} resize-none`}
          placeholder={isFullscreen ? "Add any notes..." : undefined}
        />
      </div>

      {!isFullscreen && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-secondary"
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
      )}
    </form>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-elevated flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
          <button
            onClick={onCancel}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-text-primary">Add Location</h2>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
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

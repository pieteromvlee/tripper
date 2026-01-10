import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

// Location type options
type LocationType = "attraction" | "restaurant" | "hotel";

const locationTypeOptions: { value: LocationType; label: string; color: string }[] = [
  { value: "attraction", label: "Attraction", color: "bg-blue-500" },
  { value: "restaurant", label: "Restaurant", color: "bg-orange-500" },
  { value: "hotel", label: "Hotel", color: "bg-purple-500" },
];

interface LocationFormProps {
  tripId: Id<"trips">;
  location?: Doc<"locations">; // For editing existing location
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  latitude: string;
  longitude: string;
  dateTime: string;
  endDateTime: string;
  locationType: LocationType;
  notes: string;
  address: string;
}

interface FormErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
}

export function LocationForm({
  tripId,
  location,
  onSuccess,
  onCancel,
}: LocationFormProps) {
  const createLocation = useMutation(api.locations.create);
  const updateLocation = useMutation(api.locations.update);

  const isEditing = !!location;

  const [formData, setFormData] = useState<FormData>({
    name: location?.name ?? "",
    latitude: location?.latitude?.toString() ?? "",
    longitude: location?.longitude?.toString() ?? "",
    dateTime: location?.dateTime ?? "",
    endDateTime: location?.endDateTime ?? "",
    locationType: location?.locationType ?? "attraction",
    notes: location?.notes ?? "",
    address: location?.address ?? "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = "Latitude is required";
    } else if (isNaN(parseFloat(formData.latitude))) {
      newErrors.latitude = "Latitude must be a number";
    } else {
      const lat = parseFloat(formData.latitude);
      if (lat < -90 || lat > 90) {
        newErrors.latitude = "Latitude must be between -90 and 90";
      }
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = "Longitude is required";
    } else if (isNaN(parseFloat(formData.longitude))) {
      newErrors.longitude = "Longitude must be a number";
    } else {
      const lng = parseFloat(formData.longitude);
      if (lng < -180 || lng > 180) {
        newErrors.longitude = "Longitude must be between -180 and 180";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && location) {
        await updateLocation({
          id: location._id,
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          dateTime: formData.dateTime || undefined,
          endDateTime: formData.locationType === "hotel" && formData.endDateTime ? formData.endDateTime : undefined,
          locationType: formData.locationType,
          notes: formData.notes.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
      } else {
        await createLocation({
          tripId,
          name: formData.name.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          dateTime: formData.dateTime || undefined,
          endDateTime: formData.locationType === "hotel" && formData.endDateTime ? formData.endDateTime : undefined,
          locationType: formData.locationType,
          notes: formData.notes.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* Name field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className={`
            w-full px-3 py-3 rounded-lg border text-base
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.name ? "border-red-500" : "border-gray-300"}
          `}
          placeholder="e.g., Eiffel Tower"
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Address field */}
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Address
        </label>
        <input
          type="text"
          id="address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Champ de Mars, Paris"
        />
      </div>

      {/* Latitude/Longitude fields - readonly for now */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="latitude"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Latitude <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="latitude"
            value={formData.latitude}
            onChange={(e) => handleChange("latitude", e.target.value)}
            readOnly
            className={`
              w-full px-3 py-3 rounded-lg border text-base bg-gray-50 text-gray-600
              focus:outline-none
              ${errors.latitude ? "border-red-500" : "border-gray-300"}
            `}
            placeholder="Set via map"
          />
          {errors.latitude && (
            <p className="text-sm text-red-500 mt-1">{errors.latitude}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="longitude"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Longitude <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="longitude"
            value={formData.longitude}
            onChange={(e) => handleChange("longitude", e.target.value)}
            readOnly
            className={`
              w-full px-3 py-3 rounded-lg border text-base bg-gray-50 text-gray-600
              focus:outline-none
              ${errors.longitude ? "border-red-500" : "border-gray-300"}
            `}
            placeholder="Set via map"
          />
          {errors.longitude && (
            <p className="text-sm text-red-500 mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        Coordinates will be set by tapping the map or searching for a location
      </p>

      {/* Date/Time field */}
      <div>
        <label
          htmlFor="dateTime"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date & Time
        </label>
        <input
          type="datetime-local"
          id="dateTime"
          value={formData.dateTime}
          onChange={(e) => handleChange("dateTime", e.target.value)}
          className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Location Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <div className="flex gap-2">
          {locationTypeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleChange("locationType", option.value)}
              className={`flex-1 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                formData.locationType === option.value
                  ? `${option.color} text-white`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* End Date/Time field (only for hotels) */}
      {formData.locationType === "hotel" && (
        <div>
          <label
            htmlFor="endDateTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Check-out Date & Time
          </label>
          <input
            type="datetime-local"
            id="endDateTime"
            value={formData.endDateTime}
            onChange={(e) => handleChange("endDateTime", e.target.value)}
            className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Notes field */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          rows={3}
          className="w-full px-3 py-3 rounded-lg border border-gray-300 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any additional notes..."
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium text-base hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            flex-1 px-4 py-3 rounded-lg font-medium text-base text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${
              isSubmitting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
            ? "Update Location"
            : "Add Location"}
        </button>
      </div>
    </form>
  );
}

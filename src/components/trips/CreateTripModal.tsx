import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTripModal({ isOpen, onClose }: CreateTripModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createTrip = useMutation(api.trips.create);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createTrip({ name: name.trim() });
      setName("");
      onClose();
    } catch (error) {
      console.error("Failed to create trip:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-elevated rounded-xl shadow-xl w-full max-w-md p-6 border border-border-muted">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Create New Trip
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="trip-name"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Trip Name
            </label>
            <input
              id="trip-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Vacation 2024"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-base"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-text-primary bg-surface-secondary hover:bg-surface-inset rounded-lg font-medium transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors touch-manipulation"
            >
              {isSubmitting ? "Creating..." : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

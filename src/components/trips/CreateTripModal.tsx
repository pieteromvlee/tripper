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
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-elevated w-full max-w-md border border-border">
        <div className="px-4 py-2 bg-surface-secondary border-b border-border">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            Create New Trip
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label
              htmlFor="trip-name"
              className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wide"
            >
              Trip Name
            </label>
            <input
              id="trip-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Vacation 2024"
              className="w-full px-3 py-2 border border-border bg-surface-inset focus:outline-none focus:border-blue-400 text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-text-secondary border border-border hover:bg-surface-secondary hover:border-border-focus text-xs font-medium transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-500 border border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors touch-manipulation"
            >
              {isSubmitting ? "Creating..." : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

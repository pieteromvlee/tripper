import { useState } from "react";
import { getDatePart, getTimePart, combineDateTime, formatDateForDisplay } from "../../lib/dateUtils";

interface TimeConfirmPopoverProps {
  locationName: string;
  suggestedDateTime: string; // Full ISO: "2026-01-16T13:00"
  onConfirm: (dateTime: string) => Promise<void>;
  onCancel: () => void;
}

export function TimeConfirmPopover({
  locationName,
  suggestedDateTime,
  onConfirm,
  onCancel,
}: TimeConfirmPopoverProps): React.ReactNode {
  const date = getDatePart(suggestedDateTime);
  const [time, setTime] = useState(getTimePart(suggestedDateTime));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation: HH:mm pattern (24-hour format)
  const isTimeValid = /^[0-2][0-9]:[0-5][0-9]$/.test(time);

  async function handleConfirm() {
    if (!isTimeValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(combineDateTime(date, time));
    } catch (err) {
      setError("Failed to update location. Please try again.");
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter" && isTimeValid && !isSubmitting) {
      handleConfirm();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface-elevated border border-border shadow-lg max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-1">
            Confirm Time
          </h3>
          <p className="text-xs text-text-secondary">
            {locationName}
          </p>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Date
            </label>
            <div className="px-3 py-2 bg-surface border border-border text-sm text-text-primary">
              {formatDateForDisplay(date)}
            </div>
          </div>

          <div>
            <label htmlFor="time-input" className="block text-xs font-medium text-text-secondary mb-1">
              Time (24-hour format)
            </label>
            <input
              id="time-input"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="HH:mm"
              pattern="[0-2][0-9]:[0-5][0-9]"
              className={`w-full px-3 py-2 bg-surface border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 ${
                !isTimeValid && time.length > 0
                  ? "border-red-500 focus:ring-red-500/50"
                  : "border-border focus:ring-blue-500/50"
              }`}
              autoFocus
              disabled={isSubmitting}
            />
            {!isTimeValid && time.length > 0 && (
              <p className="text-xs text-red-400 mt-1">
                Please enter time in HH:mm format (e.g., 13:00)
              </p>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm font-medium text-text-secondary bg-surface hover:bg-surface-secondary border border-border transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isTimeValid || isSubmitting}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Updating...
              </span>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

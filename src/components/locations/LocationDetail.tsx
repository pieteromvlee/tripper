import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AttachmentList } from "./AttachmentList";
import { AttachmentUpload } from "./AttachmentUpload";
import { LocationEditForm } from "./LocationEditForm";
import { ErrorBoundary, ImageErrorFallback } from "../ErrorBoundary";
import { getDirectionsUrl } from "../../lib/locationUtils";
import { CategoryIcon } from "../../lib/typeIcons";
import { formatDateTime } from "../../lib/dateUtils";
import { isAccommodationCategory } from "../../lib/categoryUtils";
import { logger } from "../../lib/logger";

interface LocationDetailProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  onClose: () => void;
}

export function LocationDetail({ location, categories, onClose }: LocationDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteLocation = useMutation(api.locations.remove);

  // Find category for this location
  const category = categories?.find(c => c._id === location.categoryId);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteLocation({ id: location._id });
      onClose();
    } catch (error) {
      logger.error("Failed to delete:", error);
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
                  color={category.color}
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
                    color={category.color}
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
              {isAccommodationCategory(category) && location.endDateTime && (
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
                <ErrorBoundary fallback={<ImageErrorFallback />}>
                  <AttachmentList locationId={location._id} />
                </ErrorBoundary>
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

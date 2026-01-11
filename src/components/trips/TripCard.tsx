import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TripMapPreview } from "./TripMapPreview";
import { TripShareModal } from "./TripShareModal";
import { CategoryManagementModal } from "../categories/CategoryManagementModal";

interface Trip {
  _id: Id<"trips">;
  name: string;
  createdAt: number;
  role?: "owner" | "member";
}

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TripCard({ trip, onClick }: TripCardProps) {
  const locations = useQuery(api.locations.listByTrip, { tripId: trip._id });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCategoryManagement(true);
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-surface-elevated border border-border hover:border-border-focus hover:bg-surface-secondary cursor-pointer transition-colors overflow-hidden"
      >
        <div className="flex">
          {/* Map Preview */}
          <div className="flex-shrink-0 border-r border-border">
            <TripMapPreview
              locations={locations ?? []}
              width={280}
              height={180}
            />
          </div>

          {/* Trip Info */}
          <div className="flex-1 p-4 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary">
                {trip.name}
              </h3>
              <p className="text-xs text-text-secondary mt-1">
                Created {formatDate(trip.createdAt)}
              </p>
              {locations && locations.length > 0 && (
                <p className="text-xs text-text-muted mt-2">
                  {locations.length} {locations.length === 1 ? "location" : "locations"}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCategoryClick}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition"
                title="Manage categories"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </button>
              <button
                onClick={handleShareClick}
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition"
                title="Share trip"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <TripShareModal
          tripId={trip._id}
          isOwner={trip.role === "owner"}
          onClose={() => setShowShareModal(false)}
        />
      )}
      {showCategoryManagement && (
        <CategoryManagementModal
          tripId={trip._id}
          onClose={() => setShowCategoryManagement(false)}
        />
      )}
    </>
  );
}

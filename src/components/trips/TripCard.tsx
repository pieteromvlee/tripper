import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TripMapPreview } from "./TripMapPreview";

interface Trip {
  _id: Id<"trips">;
  name: string;
  createdAt: number;
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

  return (
    <div
      onClick={onClick}
      className="bg-surface-elevated rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-border-muted hover:border-border active:scale-[0.98] touch-manipulation overflow-hidden"
    >
      <div className="flex">
        {/* Map Preview */}
        <div className="flex-shrink-0">
          <TripMapPreview
            locations={locations ?? []}
            width={280}
            height={200}
          />
        </div>

        {/* Trip Info */}
        <div className="flex-1 p-6 min-w-0 flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-text-primary">
            {trip.name}
          </h3>
          <p className="text-sm text-text-secondary mt-2">
            Created {formatDate(trip.createdAt)}
          </p>
          {locations && locations.length > 0 && (
            <p className="text-sm text-text-muted mt-3">
              {locations.length} {locations.length === 1 ? "location" : "locations"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

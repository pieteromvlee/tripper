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
        <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
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
      </div>
    </div>
  );
}

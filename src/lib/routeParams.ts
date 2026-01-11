import type { Id } from "../../convex/_generated/dataModel";

export function parseTripId(tripId: string | undefined): Id<"trips"> {
  if (!tripId) {
    throw new Error("Trip ID is required");
  }
  return tripId as Id<"trips">;
}

export function parseLocationId(locationId: string | undefined): Id<"locations"> {
  if (!locationId) {
    throw new Error("Location ID is required");
  }
  return locationId as Id<"locations">;
}

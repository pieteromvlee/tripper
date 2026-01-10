import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper function to check if user has access to a trip
async function checkTripAccess(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<Doc<"tripMembers"> | null> {
  const membership = await ctx.db
    .query("tripMembers")
    .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();
  return membership;
}

// Helper function to check if user has edit access (owner or member)
async function checkEditorAccess(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  if (!membership) return false;
  // Both owners and members can edit
  return membership.role === "owner" || membership.role === "member";
}

// QUERIES

// Get all locations for a trip, sorted by sortOrder
export const listByTrip = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check trip access
    const membership = await checkTripAccess(ctx, args.tripId, userId);
    if (!membership) {
      throw new Error("You don't have access to this trip");
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Sort by sortOrder
    return locations.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Get locations for a trip filtered by date
export const listByTripAndDate = query({
  args: {
    tripId: v.id("trips"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check trip access
    const membership = await checkTripAccess(ctx, args.tripId, userId);
    if (!membership) {
      throw new Error("You don't have access to this trip");
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Filter by date
    const filteredLocations = locations.filter((location) => {
      // If no dateTime, include it (unscheduled locations)
      if (!location.dateTime) {
        return false;
      }

      const locationDate = location.dateTime.substring(0, 10);

      // For hotels with endDateTime, check if the date falls within the range
      if (location.locationType === "hotel" && location.endDateTime) {
        const endDate = location.endDateTime.substring(0, 10);
        return args.date >= locationDate && args.date <= endDate;
      }

      // For regular locations, check exact date match
      return locationDate === args.date;
    });

    // Sort by sortOrder
    return filteredLocations.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Get single location by ID
export const get = query({
  args: {
    id: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const location = await ctx.db.get(args.id);
    if (!location) {
      return null;
    }

    // Check trip access
    const membership = await checkTripAccess(ctx, location.tripId, userId);
    if (!membership) {
      throw new Error("You don't have access to this location");
    }

    return location;
  },
});

// MUTATIONS

// Create new location
export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    dateTime: v.optional(v.string()),
    endDateTime: v.optional(v.string()),
    locationType: v.union(v.literal("attraction"), v.literal("restaurant"), v.literal("hotel")),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check editor access
    const hasAccess = await checkEditorAccess(ctx, args.tripId, userId);
    if (!hasAccess) {
      throw new Error("You need editor or owner role to create locations");
    }

    // Get max sortOrder for this trip
    const existingLocations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const maxSortOrder = existingLocations.reduce(
      (max, loc) => Math.max(max, loc.sortOrder),
      0
    );

    const now = Date.now();

    const locationId = await ctx.db.insert("locations", {
      tripId: args.tripId,
      name: args.name,
      latitude: args.latitude,
      longitude: args.longitude,
      dateTime: args.dateTime,
      endDateTime: args.endDateTime,
      locationType: args.locationType,
      notes: args.notes,
      address: args.address,
      sortOrder: maxSortOrder + 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return locationId;
  },
});

// Update location
export const update = mutation({
  args: {
    id: v.id("locations"),
    name: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    dateTime: v.optional(v.string()),
    endDateTime: v.optional(v.string()),
    locationType: v.optional(v.union(v.literal("attraction"), v.literal("restaurant"), v.literal("hotel"))),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
    attachmentId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new Error("Location not found");
    }

    // Check editor access
    const hasAccess = await checkEditorAccess(ctx, location.tripId, userId);
    if (!hasAccess) {
      throw new Error("You need editor or owner role to update locations");
    }

    const { id, ...updates } = args;

    // Filter out undefined values and build update object
    const updateData: Partial<Doc<"locations">> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    // Handle dateTime: empty string clears the field
    if (updates.dateTime !== undefined) updateData.dateTime = updates.dateTime || undefined;
    // Handle endDateTime: empty string clears the field
    if (updates.endDateTime !== undefined) updateData.endDateTime = updates.endDateTime || undefined;
    if (updates.locationType !== undefined) updateData.locationType = updates.locationType;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.attachmentId !== undefined) updateData.attachmentId = updates.attachmentId;
    if (updates.attachmentName !== undefined) updateData.attachmentName = updates.attachmentName;

    await ctx.db.patch(args.id, updateData);

    return args.id;
  },
});

// Delete location
export const remove = mutation({
  args: {
    id: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new Error("Location not found");
    }

    // Check editor access
    const hasAccess = await checkEditorAccess(ctx, location.tripId, userId);
    if (!hasAccess) {
      throw new Error("You need editor or owner role to delete locations");
    }

    // Delete legacy attachmentId from storage if exists
    if (location.attachmentId) {
      await ctx.storage.delete(location.attachmentId);
    }

    // Delete all attachments from the attachments table
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.id))
      .collect();

    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.fileId);
      await ctx.db.delete(attachment._id);
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

// Reorder locations (for drag-drop reordering)
export const reorder = mutation({
  args: {
    tripId: v.id("trips"),
    locationOrders: v.array(
      v.object({
        id: v.id("locations"),
        sortOrder: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check editor access
    const hasAccess = await checkEditorAccess(ctx, args.tripId, userId);
    if (!hasAccess) {
      throw new Error("You need editor or owner role to reorder locations");
    }

    const now = Date.now();

    // Update sortOrder for each location
    for (const item of args.locationOrders) {
      const location = await ctx.db.get(item.id);
      if (!location) {
        throw new Error(`Location ${item.id} not found`);
      }

      // Verify location belongs to the specified trip
      if (location.tripId !== args.tripId) {
        throw new Error(`Location ${item.id} does not belong to this trip`);
      }

      await ctx.db.patch(item.id, {
        sortOrder: item.sortOrder,
        updatedAt: now,
      });
    }

    return true;
  },
});

// Get unique dates for a trip (for DaySelector)
export const getUniqueDates = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check trip access
    const membership = await checkTripAccess(ctx, args.tripId, userId);
    if (!membership) {
      throw new Error("You don't have access to this trip");
    }

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const dates = new Set<string>();

    for (const loc of locations) {
      if (loc.dateTime) {
        const date = loc.dateTime.substring(0, 10);
        dates.add(date);

        // For hotels, add all dates in range
        if (loc.locationType === "hotel" && loc.endDateTime) {
          const endDate = loc.endDateTime.substring(0, 10);
          let currentDate = new Date(date);
          const end = new Date(endDate);

          while (currentDate <= end) {
            dates.add(currentDate.toISOString().split("T")[0]);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }

    return Array.from(dates).sort();
  },
});

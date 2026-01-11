import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  requireAuth,
  requireTripAccess,
  requireEditorAccess,
} from "./helpers";

// QUERIES

// Get all locations for a trip, sorted by sortOrder
export const listByTrip = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireTripAccess(ctx, args.tripId, userId);

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    return locations.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Get locations for a trip filtered by date
export const listByTripAndDate = query({
  args: {
    tripId: v.id("trips"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireTripAccess(ctx, args.tripId, userId);

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const filteredLocations = locations.filter((location) => {
      if (!location.dateTime) return false;

      const locationDate = location.dateTime.substring(0, 10);

      // For hotels with endDateTime, check if the date falls within the range
      if (location.locationType === "accommodation" && location.endDateTime) {
        const endDate = location.endDateTime.substring(0, 10);
        return args.date >= locationDate && args.date <= endDate;
      }

      return locationDate === args.date;
    });

    return filteredLocations.sort((a, b) => {
      if (a.dateTime && b.dateTime) {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      }
      return a.sortOrder - b.sortOrder;
    });
  },
});

// Get single location by ID
export const get = query({
  args: {
    id: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const location = await ctx.db.get(args.id);
    if (!location) return null;

    await requireTripAccess(ctx, location.tripId, userId);
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
    locationType: v.optional(
      v.union(
        v.literal("attraction"),
        v.literal("restaurant"),
        v.literal("accommodation"),
        v.literal("shop"),
        v.literal("snack")
      )
    ),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    await requireEditorAccess(ctx, args.tripId, userId);

    // Validate coordinates
    if (args.latitude < -90 || args.latitude > 90) {
      throw new ConvexError("Invalid latitude: must be between -90 and 90");
    }
    if (args.longitude < -180 || args.longitude > 180) {
      throw new ConvexError("Invalid longitude: must be between -180 and 180");
    }

    // Validate categoryId if provided
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category) {
        throw new ConvexError("Category not found");
      }
      if (category.tripId !== args.tripId) {
        throw new ConvexError("Category does not belong to this trip");
      }
    }

    const existingLocations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const maxSortOrder = existingLocations.reduce(
      (max, loc) => Math.max(max, loc.sortOrder),
      0
    );

    const now = Date.now();

    return await ctx.db.insert("locations", {
      tripId: args.tripId,
      name: args.name,
      latitude: args.latitude,
      longitude: args.longitude,
      dateTime: args.dateTime,
      endDateTime: args.endDateTime,
      locationType: args.locationType,
      categoryId: args.categoryId,
      notes: args.notes,
      address: args.address,
      sortOrder: maxSortOrder + 1,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });
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
    locationType: v.optional(
      v.union(
        v.literal("attraction"),
        v.literal("restaurant"),
        v.literal("accommodation"),
        v.literal("shop"),
        v.literal("snack")
      )
    ),
    categoryId: v.optional(v.id("categories")),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
    attachmentId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireEditorAccess(ctx, location.tripId, userId);

    // Validate coordinates if provided
    if (args.latitude !== undefined && (args.latitude < -90 || args.latitude > 90)) {
      throw new ConvexError("Invalid latitude: must be between -90 and 90");
    }
    if (args.longitude !== undefined && (args.longitude < -180 || args.longitude > 180)) {
      throw new ConvexError("Invalid longitude: must be between -180 and 180");
    }

    // Validate categoryId if provided
    if (args.categoryId) {
      const category = await ctx.db.get(args.categoryId);
      if (!category) {
        throw new ConvexError("Category not found");
      }
      if (category.tripId !== location.tripId) {
        throw new ConvexError("Category does not belong to this trip");
      }
    }

    const { id, ...updates } = args;

    const updateData: Partial<Doc<"locations">> = {
      updatedAt: Date.now(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.dateTime !== undefined) updateData.dateTime = updates.dateTime || undefined;
    if (updates.endDateTime !== undefined) updateData.endDateTime = updates.endDateTime || undefined;
    if (updates.locationType !== undefined) updateData.locationType = updates.locationType;
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId;
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
    const userId = await requireAuth(ctx);

    const location = await ctx.db.get(args.id);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireEditorAccess(ctx, location.tripId, userId);

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
    const userId = await requireAuth(ctx);
    await requireEditorAccess(ctx, args.tripId, userId);

    const now = Date.now();

    for (const item of args.locationOrders) {
      const location = await ctx.db.get(item.id);
      if (!location) {
        throw new ConvexError(`Location ${item.id} not found`);
      }

      if (location.tripId !== args.tripId) {
        throw new ConvexError(`Location ${item.id} does not belong to this trip`);
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
    const userId = await requireAuth(ctx);
    await requireTripAccess(ctx, args.tripId, userId);

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
        if (loc.locationType === "accommodation" && loc.endDateTime) {
          const endDate = loc.endDateTime.substring(0, 10);
          const currentDate = new Date(date);
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

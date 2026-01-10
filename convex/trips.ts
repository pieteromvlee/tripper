import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  requireAuth,
  requireTripAccess,
  requireOwnerAccess,
} from "./helpers";

// QUERIES

/**
 * List all trips the current user has access to (either owns or is a member of)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all trip memberships for the current user
    const memberships = await ctx.db
      .query("tripMembers")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Fetch all trips the user has access to
    const trips = await Promise.all(
      memberships.map(async (membership) => {
        const trip = await ctx.db.get(membership.tripId);
        if (!trip) return null;
        return {
          ...trip,
          role: membership.role,
        };
      })
    );

    // Filter out null values (deleted trips) and sort by createdAt descending
    return trips
      .filter((trip): trip is NonNullable<typeof trip> => trip !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get a single trip by ID (with access check)
 */
export const get = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    const membership = await requireTripAccess(ctx, args.tripId, userId);

    return {
      ...trip,
      role: membership.role,
    };
  },
});

// MUTATIONS

/**
 * Create a new trip, also create tripMembers entry with role "owner"
 */
export const create = mutation({
  args: {
    name: v.string(),
    defaultLat: v.optional(v.number()),
    defaultLng: v.optional(v.number()),
    defaultZoom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const now = Date.now();

    // Create the trip
    const tripId = await ctx.db.insert("trips", {
      name: args.name,
      ownerId: userId,
      defaultLat: args.defaultLat,
      defaultLng: args.defaultLng,
      defaultZoom: args.defaultZoom,
      createdAt: now,
      updatedAt: now,
    });

    // Create tripMembers entry with role "owner"
    await ctx.db.insert("tripMembers", {
      tripId,
      userId,
      role: "owner",
      invitedBy: userId,
      invitedAt: now,
    });

    return tripId;
  },
});

/**
 * Update trip name and/or default map position (check user has editor/owner role)
 */
export const update = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.optional(v.string()),
    defaultLat: v.optional(v.number()),
    defaultLng: v.optional(v.number()),
    defaultZoom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user has access (owner or member can edit)
    await requireTripAccess(ctx, args.tripId, userId);

    // Build update object with only provided fields
    const updates: Partial<{
      name: string;
      defaultLat: number;
      defaultLng: number;
      defaultZoom: number;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.defaultLat !== undefined) {
      updates.defaultLat = args.defaultLat;
    }
    if (args.defaultLng !== undefined) {
      updates.defaultLng = args.defaultLng;
    }
    if (args.defaultZoom !== undefined) {
      updates.defaultZoom = args.defaultZoom;
    }

    await ctx.db.patch(args.tripId, updates);

    return args.tripId;
  },
});

/**
 * Delete trip and all related tripMembers and locations (owner only)
 */
export const remove = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    await requireOwnerAccess(ctx, args.tripId, userId);

    // Delete all tripMembers for this trip
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all pending invites for this trip
    const invites = await ctx.db
      .query("tripInvites")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete all locations and their attachments for this trip
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const location of locations) {
      // Delete legacy attachmentId from storage if exists
      if (location.attachmentId) {
        await ctx.storage.delete(location.attachmentId);
      }

      // Delete all attachments from the attachments table
      const attachments = await ctx.db
        .query("attachments")
        .withIndex("by_locationId", (q) => q.eq("locationId", location._id))
        .collect();

      for (const attachment of attachments) {
        await ctx.storage.delete(attachment.fileId);
        await ctx.db.delete(attachment._id);
      }

      await ctx.db.delete(location._id);
    }

    // Delete the trip itself
    await ctx.db.delete(args.tripId);

    return args.tripId;
  },
});

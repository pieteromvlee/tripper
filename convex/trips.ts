import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

// Helper function to check if user has access to a trip and return their role
async function getUserTripRole(
  ctx: { db: any },
  tripId: any,
  userId: any
): Promise<"owner" | "member" | null> {
  const membership = await ctx.db
    .query("tripMembers")
    .withIndex("by_tripId", (q: any) => q.eq("tripId", tripId))
    .filter((q: any) => q.eq(q.field("userId"), userId))
    .first();

  return membership?.role ?? null;
}

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user has access to this trip
    const role = await getUserTripRole(ctx, args.tripId, userId);
    if (!role) {
      throw new ConvexError("You don't have access to this trip");
    }

    return {
      ...trip,
      role,
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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user has access (owner or member can edit)
    const role = await getUserTripRole(ctx, args.tripId, userId);
    if (!role) {
      throw new ConvexError("You don't have permission to edit this trip");
    }

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
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new ConvexError("Trip not found");
    }

    // Check if user is the owner
    const role = await getUserTripRole(ctx, args.tripId, userId);
    if (role !== "owner") {
      throw new ConvexError("Only the trip owner can delete this trip");
    }

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

    // Delete all locations for this trip
    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    for (const location of locations) {
      await ctx.db.delete(location._id);
    }

    // Delete the trip itself
    await ctx.db.delete(args.tripId);

    return args.tripId;
  },
});

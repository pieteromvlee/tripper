import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Helper to check if user has access to a trip
async function checkTripAccess(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
) {
  const membership = await ctx.db
    .query("tripMembers")
    .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();
  return membership;
}

// Helper to check if user is owner
async function checkOwnerAccess(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  return membership?.role === "owner";
}

// Helper to get user by email
async function getUserByEmail(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("email"), email))
    .first();
}

// QUERIES

/**
 * List all members of a trip (any member can view)
 */
export const list = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user has access to this trip
    const membership = await checkTripAccess(ctx, args.tripId, userId);
    if (!membership) {
      throw new ConvexError("You don't have access to this trip");
    }

    // Get all members
    const members = await ctx.db
      .query("tripMembers")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    // Fetch user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          email: user?.email ?? "Unknown",
          name: user?.name ?? user?.email ?? "Unknown",
        };
      })
    );

    return membersWithDetails;
  },
});

/**
 * List pending invites for a trip (owner only)
 */
export const listPendingInvites = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user is owner
    const isOwner = await checkOwnerAccess(ctx, args.tripId, userId);
    if (!isOwner) {
      throw new ConvexError("Only the trip owner can view pending invites");
    }

    // Get all pending invites
    const invites = await ctx.db
      .query("tripInvites")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    return invites;
  },
});

/**
 * Get pending invites for the current user's email
 */
export const getMyInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get current user's email
    const user = await ctx.db.get(userId);
    const userEmail = user?.email;
    if (!userEmail) {
      return [];
    }

    // Get all pending invites for this email
    const invites = await ctx.db
      .query("tripInvites")
      .withIndex("by_email", (q) => q.eq("email", userEmail))
      .collect();

    // Fetch trip details for each invite
    const invitesWithDetails = await Promise.all(
      invites.map(async (invite) => {
        const trip = await ctx.db.get(invite.tripId);
        const inviter = await ctx.db.get(invite.invitedBy);
        return {
          ...invite,
          tripName: trip?.name ?? "Unknown Trip",
          inviterEmail: inviter?.email ?? "Unknown",
        };
      })
    );

    return invitesWithDetails;
  },
});

// MUTATIONS

/**
 * Invite a user by email (owner only)
 * - If user exists, add directly to tripMembers
 * - If user doesn't exist, create tripInvites entry
 */
export const invite = mutation({
  args: {
    tripId: v.id("trips"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    // Check if user is owner
    const isOwner = await checkOwnerAccess(ctx, args.tripId, userId);
    if (!isOwner) {
      throw new ConvexError("Only the trip owner can invite members");
    }

    const email = args.email.toLowerCase().trim();

    // Check if this email is already a member
    const existingUser = await getUserByEmail(ctx, email);
    if (existingUser) {
      const existingMembership = await checkTripAccess(
        ctx,
        args.tripId,
        existingUser._id
      );
      if (existingMembership) {
        throw new ConvexError("This user is already a member of the trip");
      }

      // User exists, add directly to tripMembers
      await ctx.db.insert("tripMembers", {
        tripId: args.tripId,
        userId: existingUser._id,
        role: "member",
        invitedBy: userId,
        invitedAt: Date.now(),
      });

      return { status: "added", email };
    }

    // Check if there's already a pending invite
    const existingInvite = await ctx.db
      .query("tripInvites")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (existingInvite) {
      throw new ConvexError("This email already has a pending invite");
    }

    // User doesn't exist, create pending invite
    await ctx.db.insert("tripInvites", {
      tripId: args.tripId,
      email,
      role: "member",
      invitedBy: userId,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { status: "invited", email };
  },
});

/**
 * Accept a pending invite (converts to tripMember)
 */
export const acceptInvite = mutation({
  args: {
    inviteId: v.id("tripInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    // Check invite belongs to current user
    const user = await ctx.db.get(userId);
    const userEmail = user?.email;
    if (!userEmail || userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ConvexError("This invite is not for you");
    }

    // Check if trip still exists
    const trip = await ctx.db.get(invite.tripId);
    if (!trip) {
      // Clean up orphaned invite
      await ctx.db.delete(args.inviteId);
      throw new ConvexError("Trip no longer exists");
    }

    // Check if already a member
    const existingMembership = await checkTripAccess(ctx, invite.tripId, userId);
    if (existingMembership) {
      // Clean up duplicate invite
      await ctx.db.delete(args.inviteId);
      throw new ConvexError("You are already a member of this trip");
    }

    // Create membership
    await ctx.db.insert("tripMembers", {
      tripId: invite.tripId,
      userId,
      role: invite.role,
      invitedBy: invite.invitedBy,
      invitedAt: Date.now(),
    });

    // Delete the invite
    await ctx.db.delete(args.inviteId);

    return { tripId: invite.tripId };
  },
});

/**
 * Decline a pending invite
 */
export const declineInvite = mutation({
  args: {
    inviteId: v.id("tripInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    // Check invite belongs to current user
    const user = await ctx.db.get(userId);
    const userEmail = user?.email;
    if (!userEmail || userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      throw new ConvexError("This invite is not for you");
    }

    // Delete the invite
    await ctx.db.delete(args.inviteId);

    return { success: true };
  },
});

/**
 * Cancel a pending invite (owner only)
 */
export const cancelInvite = mutation({
  args: {
    inviteId: v.id("tripInvites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new ConvexError("Invite not found");
    }

    // Check if user is owner of the trip
    const isOwner = await checkOwnerAccess(ctx, invite.tripId, userId);
    if (!isOwner) {
      throw new ConvexError("Only the trip owner can cancel invites");
    }

    // Delete the invite
    await ctx.db.delete(args.inviteId);

    return { success: true };
  },
});

/**
 * Remove a member from trip (owner only, can't remove self)
 */
export const removeMember = mutation({
  args: {
    memberId: v.id("tripMembers"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new ConvexError("Member not found");
    }

    // Check if user is owner of the trip
    const isOwner = await checkOwnerAccess(ctx, member.tripId, userId);
    if (!isOwner) {
      throw new ConvexError("Only the trip owner can remove members");
    }

    // Can't remove self (owner)
    if (member.userId === userId) {
      throw new ConvexError("You cannot remove yourself from the trip");
    }

    // Delete the membership
    await ctx.db.delete(args.memberId);

    return { success: true };
  },
});

/**
 * Leave a trip voluntarily (non-owners only)
 */
export const leaveTrip = mutation({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const membership = await checkTripAccess(ctx, args.tripId, userId);
    if (!membership) {
      throw new ConvexError("You are not a member of this trip");
    }

    // Owners can't leave
    if (membership.role === "owner") {
      throw new ConvexError("Owners cannot leave their trip. Delete the trip instead.");
    }

    // Delete the membership
    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

/**
 * Internal mutation to process pending invites when a user signs up/logs in
 * Called from auth callbacks
 */
export const processInvitesForUser = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find all pending invites for this email
    const invites = await ctx.db
      .query("tripInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .collect();

    // Convert each invite to a membership
    for (const invite of invites) {
      // Check trip still exists
      const trip = await ctx.db.get(invite.tripId);
      if (!trip) {
        await ctx.db.delete(invite._id);
        continue;
      }

      // Check not already a member
      const existingMembership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", invite.tripId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (existingMembership) {
        await ctx.db.delete(invite._id);
        continue;
      }

      // Create membership
      await ctx.db.insert("tripMembers", {
        tripId: invite.tripId,
        userId: args.userId,
        role: invite.role,
        invitedBy: invite.invitedBy,
        invitedAt: Date.now(),
      });

      // Delete the invite
      await ctx.db.delete(invite._id);
    }

    return { processed: invites.length };
  },
});

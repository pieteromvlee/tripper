import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

type Ctx = QueryCtx | MutationCtx;

/**
 * Get the authenticated user ID or throw an error
 */
export async function requireAuth(ctx: Ctx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Not authenticated");
  }
  return userId;
}

/**
 * Check if a user has access to a trip (returns membership or null)
 */
export async function checkTripAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<Doc<"tripMembers"> | null> {
  return await ctx.db
    .query("tripMembers")
    .withIndex("by_tripId", (q) => q.eq("tripId", tripId))
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();
}

/**
 * Require trip access or throw an error
 */
export async function requireTripAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<Doc<"tripMembers">> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  if (!membership) {
    throw new ConvexError("You don't have access to this trip");
  }
  return membership;
}

/**
 * Check if user has editor access (owner or member role)
 */
export async function hasEditorAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  if (!membership) return false;
  return membership.role === "owner" || membership.role === "member";
}

/**
 * Require editor access or throw an error
 */
export async function requireEditorAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<void> {
  const hasAccess = await hasEditorAccess(ctx, tripId, userId);
  if (!hasAccess) {
    throw new ConvexError("You need editor or owner role to perform this action");
  }
}

/**
 * Check if user is trip owner
 */
export async function isOwner(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  return membership?.role === "owner";
}

/**
 * Require owner access or throw an error
 */
export async function requireOwnerAccess(
  ctx: Ctx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<void> {
  const ownerStatus = await isOwner(ctx, tripId, userId);
  if (!ownerStatus) {
    throw new ConvexError("Only the trip owner can perform this action");
  }
}

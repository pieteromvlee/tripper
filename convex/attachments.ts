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

// Helper function to check if user has editor or owner role on a trip
async function checkEditorAccess(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<boolean> {
  const membership = await checkTripAccess(ctx, tripId, userId);
  if (!membership) return false;
  return membership.role === "owner" || membership.role === "editor";
}

// Helper to get location and verify access
async function getLocationWithAccess(
  ctx: QueryCtx | MutationCtx,
  locationId: Id<"locations">,
  userId: Id<"users">,
  requireEditor: boolean = false
): Promise<Doc<"locations">> {
  const location = await ctx.db.get(locationId);
  if (!location) {
    throw new Error("Location not found");
  }

  if (requireEditor) {
    const hasAccess = await checkEditorAccess(ctx, location.tripId, userId);
    if (!hasAccess) {
      throw new Error("You need editor or owner role to modify attachments");
    }
  } else {
    const membership = await checkTripAccess(ctx, location.tripId, userId);
    if (!membership) {
      throw new Error("You don't have access to this location");
    }
  }

  return location;
}

// MUTATIONS

/**
 * Generate a presigned upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save attachment metadata after file upload
 */
export const saveAttachment = mutation({
  args: {
    locationId: v.id("locations"),
    fileName: v.string(),
    fileId: v.id("_storage"),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify location exists and user has editor access
    await getLocationWithAccess(ctx, args.locationId, userId, true);

    const attachmentId = await ctx.db.insert("attachments", {
      locationId: args.locationId,
      fileName: args.fileName,
      fileId: args.fileId,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
    });

    return attachmentId;
  },
});

/**
 * List all attachments for a location
 */
export const listByLocation = query({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify location exists and user has access
    await getLocationWithAccess(ctx, args.locationId, userId, false);

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    return attachments;
  },
});

/**
 * Delete an attachment
 */
export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    // Verify location exists and user has editor access
    await getLocationWithAccess(ctx, attachment.locationId, userId, true);

    // Delete the file from storage
    await ctx.storage.delete(attachment.fileId);

    // Delete the attachment record
    await ctx.db.delete(args.attachmentId);

    return args.attachmentId;
  },
});

/**
 * Get download URL for an attachment
 */
export const getDownloadUrl = query({
  args: {
    attachmentId: v.id("attachments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    // Verify location exists and user has access
    await getLocationWithAccess(ctx, attachment.locationId, userId, false);

    const url = await ctx.storage.getUrl(attachment.fileId);
    return url;
  },
});

/**
 * Get attachment count for a location (useful for displaying badge)
 */
export const countByLocation = query({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return 0;
    }

    // Check if user has access to the location's trip
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      return 0;
    }

    const membership = await checkTripAccess(ctx, location.tripId, userId);
    if (!membership) {
      return 0;
    }

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    return attachments.length;
  },
});

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  requireAuth,
  requireTripAccess,
  requireEditorAccess,
  checkTripAccess,
} from "./helpers";

// MUTATIONS

/**
 * Generate a presigned upload URL for file storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
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
    const userId = await requireAuth(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireEditorAccess(ctx, location.tripId, userId);

    return await ctx.db.insert("attachments", {
      locationId: args.locationId,
      fileName: args.fileName,
      fileId: args.fileId,
      mimeType: args.mimeType,
      uploadedAt: Date.now(),
    });
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
    const userId = await requireAuth(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireTripAccess(ctx, location.tripId, userId);

    return await ctx.db
      .query("attachments")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();
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
    const userId = await requireAuth(ctx);

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new ConvexError("Attachment not found");
    }

    const location = await ctx.db.get(attachment.locationId);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireEditorAccess(ctx, location.tripId, userId);

    await ctx.storage.delete(attachment.fileId);
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
    const userId = await requireAuth(ctx);

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new ConvexError("Attachment not found");
    }

    const location = await ctx.db.get(attachment.locationId);
    if (!location) {
      throw new ConvexError("Location not found");
    }

    await requireTripAccess(ctx, location.tripId, userId);

    return await ctx.storage.getUrl(attachment.fileId);
  },
});

/**
 * Get attachment count for a location (useful for displaying badge)
 * Returns 0 for unauthenticated users or if location doesn't exist
 */
export const countByLocation = query({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const location = await ctx.db.get(args.locationId);
    if (!location) return 0;

    const membership = await checkTripAccess(ctx, location.tripId, userId);
    if (!membership) return 0;

    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_locationId", (q) => q.eq("locationId", args.locationId))
      .collect();

    return attachments.length;
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  trips: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    defaultLat: v.optional(v.number()),
    defaultLng: v.optional(v.number()),
    defaultZoom: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerId", ["ownerId"]),

  categories: defineTable({
    tripId: v.id("trips"),
    name: v.string(),
    iconName: v.string(),
    color: v.string(),
    sortOrder: v.number(),
    isDefault: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tripId", ["tripId"]),

  tripMembers: defineTable({
    tripId: v.id("trips"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
  })
    .index("by_tripId", ["tripId"])
    .index("by_userId", ["userId"]),

  tripInvites: defineTable({
    tripId: v.id("trips"),
    email: v.string(),
    role: v.literal("member"),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
  })
    .index("by_tripId", ["tripId"])
    .index("by_email", ["email"]),

  locations: defineTable({
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
    attachmentId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    notes: v.optional(v.string()),
    address: v.optional(v.string()),
    sortOrder: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tripId", ["tripId"]),

  attachments: defineTable({
    locationId: v.id("locations"),
    fileName: v.string(),
    fileId: v.id("_storage"),
    mimeType: v.string(),
    uploadedAt: v.number(),
  }).index("by_locationId", ["locationId"]),
});

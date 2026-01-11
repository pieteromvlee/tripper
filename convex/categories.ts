import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

// Query to list all categories for a trip
export const list = query({
  args: {
    tripId: v.id("trips"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to this trip
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      // Check if user is a member
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    // Get all categories for this trip, sorted by sortOrder
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

// Query to get a single category by ID
export const get = query({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Verify user has access to the trip
    const trip = await ctx.db.get(category.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", category.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    return category;
  },
});

// Mutation to create a new category
export const create = mutation({
  args: {
    tripId: v.id("trips"),
    name: v.string(),
    iconName: v.string(),
    color: v.string(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to this trip
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    // Validate name (no duplicates within trip)
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingCategory) {
      throw new Error("A category with this name already exists");
    }

    // Validate color format
    if (!isValidHexColor(args.color)) {
      throw new Error("Invalid color format. Must be a hex color (e.g., #3B82F6)");
    }

    // If no sortOrder provided, put it at the end
    let sortOrder = args.sortOrder;
    if (sortOrder === undefined) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
        .collect();
      sortOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.sortOrder)) + 1
        : 1;
    }

    const now = Date.now();
    const categoryId = await ctx.db.insert("categories", {
      tripId: args.tripId,
      name: args.name,
      iconName: args.iconName,
      color: args.color,
      sortOrder,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

// Mutation to update an existing category
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    iconName: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Verify user has access to the trip
    const trip = await ctx.db.get(category.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", category.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    // Validate name (no duplicates within trip)
    if (args.name !== undefined && args.name !== category.name) {
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("by_tripId", (q) => q.eq("tripId", category.tripId))
        .filter((q) => q.eq(q.field("name"), args.name))
        .first();

      if (existingCategory) {
        throw new Error("A category with this name already exists");
      }
    }

    // Validate color format if provided
    if (args.color !== undefined && !isValidHexColor(args.color)) {
      throw new Error("Invalid color format. Must be a hex color (e.g., #3B82F6)");
    }

    // Build update object
    const updates: Record<string, any> = {
      updatedAt: Date.now(),
    };
    if (args.name !== undefined) updates.name = args.name;
    if (args.iconName !== undefined) updates.iconName = args.iconName;
    if (args.color !== undefined) updates.color = args.color;
    if (args.sortOrder !== undefined) updates.sortOrder = args.sortOrder;

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

// Mutation to delete a category
export const remove = mutation({
  args: {
    id: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const category = await ctx.db.get(args.id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Verify user has access to the trip
    const trip = await ctx.db.get(category.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", category.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    // Check if any locations are using this category
    const locationsWithCategory = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", category.tripId))
      .filter((q) => q.eq(q.field("categoryId"), args.id))
      .collect();

    if (locationsWithCategory.length > 0) {
      throw new Error(
        `Cannot delete category: ${locationsWithCategory.length} location(s) are using it`
      );
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Mutation to reorder categories (for drag-drop)
export const reorder = mutation({
  args: {
    tripId: v.id("trips"),
    categoryIds: v.array(v.id("categories")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify user has access to this trip
    const trip = await ctx.db.get(args.tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }
    if (trip.ownerId !== userId) {
      const membership = await ctx.db
        .query("tripMembers")
        .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();
      if (!membership) {
        throw new Error("Access denied");
      }
    }

    // Update sortOrder for each category
    const now = Date.now();
    for (let i = 0; i < args.categoryIds.length; i++) {
      const categoryId = args.categoryIds[i];
      const category = await ctx.db.get(categoryId);

      if (!category || category.tripId !== args.tripId) {
        throw new Error("Invalid category ID");
      }

      await ctx.db.patch(categoryId, {
        sortOrder: i + 1,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

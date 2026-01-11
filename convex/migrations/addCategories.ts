import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

/**
 * Migration script to add categories support to existing trips
 *
 * This script:
 * 1. Creates default categories for all existing trips
 * 2. Maps existing location.locationType values to category IDs
 * 3. Updates all locations with categoryId references
 *
 * Run this once after deploying the schema changes
 */
export const migrateToCategories = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, only log what would be done without making changes
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const results = {
      tripsProcessed: 0,
      categoriesCreated: 0,
      locationsUpdated: 0,
      errors: [] as string[],
    };

    try {
      // Get all trips
      const trips = await ctx.db.query("trips").collect();
      console.log(`Found ${trips.length} trips to process`);

      for (const trip of trips) {
        try {
          results.tripsProcessed++;

          // Check if categories already exist for this trip
          const existingCategories = await ctx.db
            .query("categories")
            .withIndex("by_tripId", (q) => q.eq("tripId", trip._id))
            .collect();

          if (existingCategories.length > 0) {
            console.log(`Trip ${trip._id} already has categories, skipping`);
            continue;
          }

          // Create default categories for this trip
          const defaultCategories = [
            { name: "Attraction", iconName: "Camera", color: "#3B82F6", sortOrder: 1, type: "attraction" },
            { name: "Restaurant", iconName: "UtensilsCrossed", color: "#F97316", sortOrder: 2, type: "restaurant" },
            { name: "Accommodation", iconName: "Hotel", color: "#A855F7", sortOrder: 3, type: "accommodation" },
            { name: "Shop", iconName: "ShoppingBag", color: "#10B981", sortOrder: 4, type: "shop" },
            { name: "Snack", iconName: "Coffee", color: "#EC4899", sortOrder: 5, type: "snack" },
          ];

          // Map to store locationType -> categoryId mapping
          const categoryMap = new Map<string, Id<"categories">>();

          const now = Date.now();

          // Create categories and build mapping
          for (const category of defaultCategories) {
            if (dryRun) {
              console.log(`[DRY RUN] Would create category ${category.name} for trip ${trip._id}`);
              // Generate a fake ID for dry run
              categoryMap.set(category.type, "fake_id" as Id<"categories">);
            } else {
              const categoryId = await ctx.db.insert("categories", {
                tripId: trip._id,
                name: category.name,
                iconName: category.iconName,
                color: category.color,
                sortOrder: category.sortOrder,
                isDefault: true,
                createdBy: trip.ownerId,
                createdAt: now,
                updatedAt: now,
              });
              categoryMap.set(category.type, categoryId);
              results.categoriesCreated++;
              console.log(`Created category ${category.name} (${categoryId}) for trip ${trip._id}`);
            }
          }

          // Update all locations for this trip
          const locations = await ctx.db
            .query("locations")
            .withIndex("by_tripId", (q) => q.eq("tripId", trip._id))
            .collect();

          console.log(`Found ${locations.length} locations for trip ${trip._id}`);

          for (const location of locations) {
            if (!location.locationType) {
              console.warn(`Location ${location._id} has no locationType, skipping`);
              continue;
            }

            const categoryId = categoryMap.get(location.locationType);
            if (!categoryId) {
              const error = `No category mapping found for locationType: ${location.locationType}`;
              console.error(error);
              results.errors.push(error);
              continue;
            }

            if (dryRun) {
              console.log(`[DRY RUN] Would update location ${location._id} with categoryId ${categoryId}`);
            } else {
              await ctx.db.patch(location._id, {
                categoryId,
                updatedAt: now,
              });
              results.locationsUpdated++;
            }
          }

          console.log(`Completed processing trip ${trip._id}`);
        } catch (error) {
          const errorMsg = `Error processing trip ${trip._id}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log("Migration completed", results);
      return {
        success: true,
        dryRun,
        ...results,
      };
    } catch (error) {
      const errorMsg = `Migration failed: ${error}`;
      console.error(errorMsg);
      return {
        success: false,
        dryRun,
        error: errorMsg,
        ...results,
      };
    }
  },
});

/**
 * Rollback migration - removes all categories and clears categoryId from locations
 * WARNING: This will delete all custom categories created by users!
 */
export const rollbackCategoriesMigration = mutation({
  args: {
    confirmRollback: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmRollback) {
      throw new Error("Must set confirmRollback to true to proceed with rollback");
    }

    const results = {
      categoriesDeleted: 0,
      locationsUpdated: 0,
      errors: [] as string[],
    };

    try {
      // Delete all categories
      const categories = await ctx.db.query("categories").collect();
      console.log(`Found ${categories.length} categories to delete`);

      for (const category of categories) {
        try {
          await ctx.db.delete(category._id);
          results.categoriesDeleted++;
        } catch (error) {
          const errorMsg = `Error deleting category ${category._id}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // Clear categoryId from all locations
      const locations = await ctx.db.query("locations").collect();
      console.log(`Found ${locations.length} locations to update`);

      const now = Date.now();
      for (const location of locations) {
        if (location.categoryId) {
          try {
            await ctx.db.patch(location._id, {
              categoryId: undefined,
              updatedAt: now,
            });
            results.locationsUpdated++;
          } catch (error) {
            const errorMsg = `Error updating location ${location._id}: ${error}`;
            console.error(errorMsg);
            results.errors.push(errorMsg);
          }
        }
      }

      console.log("Rollback completed", results);
      return {
        success: true,
        ...results,
      };
    } catch (error) {
      const errorMsg = `Rollback failed: ${error}`;
      console.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
        ...results,
      };
    }
  },
});

/**
 * Category utility functions
 */

import type { Doc } from "../../convex/_generated/dataModel";

/**
 * Check if a category is an accommodation category
 * @param category The category to check
 * @returns true if the category name is "accommodation" (case-insensitive)
 */
export function isAccommodationCategory(category: Doc<"categories"> | undefined): boolean {
  return category?.name.toLowerCase() === "accommodation";
}

/**
 * Time calculation utilities for drag-and-drop reordering
 *
 * These functions handle intelligent time calculation when dropping locations
 * between other locations in the list view.
 */

import type { Doc } from "../../convex/_generated/dataModel";
import { getTimePart } from "./dateUtils";

/**
 * Parse "HH:mm" time string to minutes since midnight
 * @param time Time string in "HH:mm" format (e.g., "13:30")
 * @returns Minutes since midnight (e.g., 810 for "13:30")
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to "HH:mm" string
 * @param minutes Minutes since midnight (0-1439)
 * @returns Time string in "HH:mm" format
 */
function minutesToTime(minutes: number): string {
  // Handle wraparound (negative or >= 24 hours)
  const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;

  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Add hours to a time string
 * @param time Time string in "HH:mm" format
 * @param hours Number of hours to add (default: 1)
 * @returns New time string, handles 24h wraparound
 */
export function addHour(time: string, hours = 1): string {
  const minutes = timeToMinutes(time);
  const newMinutes = minutes + hours * 60;
  return minutesToTime(newMinutes);
}

/**
 * Compare two time strings
 * @param time1 First time in "HH:mm" format
 * @param time2 Second time in "HH:mm" format
 * @returns -1 if time1 < time2, 0 if equal, 1 if time1 > time2
 */
export function timeCompare(time1: string, time2: string): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);

  if (minutes1 < minutes2) return -1;
  if (minutes1 > minutes2) return 1;
  return 0;
}

/**
 * Calculate midpoint between two times
 * @param time1 First time in "HH:mm" format
 * @param time2 Second time in "HH:mm" format
 * @returns Midpoint time in "HH:mm" format
 */
export function getMidpoint(time1: string, time2: string): string {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);

  const midpointMinutes = Math.floor((minutes1 + minutes2) / 2);
  return minutesToTime(midpointMinutes);
}

/**
 * Round time to nearest 15 minutes
 * @param time Time string in "HH:mm" format
 * @returns Rounded time in "HH:mm" format
 */
export function roundToNearest15(time: string): string {
  const minutes = timeToMinutes(time);
  const roundedMinutes = Math.round(minutes / 15) * 15;
  return minutesToTime(roundedMinutes);
}

/**
 * Calculate suggested drop time based on neighboring locations
 *
 * Logic:
 * - If no previous location (top of list): return 09:00
 * - If no next location (bottom of list): return previousTime + 1 hour (rounded)
 * - If between two locations:
 *   - Try: previousTime + 1 hour
 *   - If that would be >= nextTime: use midpoint instead
 *   - Round to nearest 15 minutes
 *
 * @param previousLocation Location before drop position (undefined if dropping at top)
 * @param nextLocation Location after drop position (undefined if dropping at bottom)
 * @param targetDate Target date (used for validation, currently unused)
 * @returns Suggested time in "HH:mm" format
 */
export function calculateDropTime(
  previousLocation: Doc<"locations"> | undefined,
  nextLocation: Doc<"locations"> | undefined,
  _targetDate: string
): string {
  // Case 1: Dropping at top (no previous location)
  if (!previousLocation || !previousLocation.dateTime) {
    return "09:00";
  }

  const prevTime = getTimePart(previousLocation.dateTime);

  // Case 2: Dropping at bottom (no next location)
  if (!nextLocation || !nextLocation.dateTime) {
    return roundToNearest15(addHour(prevTime, 1));
  }

  const nextTime = getTimePart(nextLocation.dateTime);

  // Case 3: Between two locations
  const tentativeTime = addHour(prevTime, 1);

  // Check if tentativeTime would collide with nextTime
  if (timeCompare(tentativeTime, nextTime) >= 0) {
    // Collision: use midpoint instead
    return roundToNearest15(getMidpoint(prevTime, nextTime));
  }

  return roundToNearest15(tentativeTime);
}

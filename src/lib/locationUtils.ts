/**
 * Shared location utility functions
 */

import { formatDateTime as formatDateTimeUtil, formatTime as formatTimeUtil } from './dateUtils';

/**
 * Detects if the user is on an Apple device (iOS or macOS)
 */
function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isMac = platform.includes("mac") || /macintosh/.test(userAgent);

  return isIOS || isMac;
}

/**
 * Generates a maps URL for directions to the given coordinates.
 * Uses Apple Maps for Apple devices, Google Maps for others.
 */
export function getDirectionsUrl(latitude: number, longitude: number): string {
  if (isAppleDevice()) {
    return `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

/**
 * Formats a naive datetime string for display (timezone-independent)
 * Input: "2026-01-16T13:00" → Output: "Fri, Jan 16, 13:00"
 */
export function formatDateTime(dateTime: string | undefined): string {
  return formatDateTimeUtil(dateTime);
}

/**
 * Formats a naive datetime string to show only the time (24-hour format)
 * Input: "2026-01-16T13:00" → Output: "13:00"
 */
export function formatTime(dateTime: string | undefined): string {
  return formatTimeUtil(dateTime);
}

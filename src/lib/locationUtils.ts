/**
 * Shared location utility functions
 */

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

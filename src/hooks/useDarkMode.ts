import { useSyncExternalStore } from "react";

/**
 * Hook to detect system dark mode preference.
 * Automatically updates when the user changes their OS theme setting.
 */
export function useDarkMode(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false // Server-side fallback
  );
}

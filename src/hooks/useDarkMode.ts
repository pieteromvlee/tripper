import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme-preference";

type ThemePreference = "light" | "dark" | "system";

function getStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getEffectiveDark(): boolean {
  const preference = getStoredPreference();
  if (preference === "system") return getSystemPreference();
  return preference === "dark";
}

function applyTheme(isDark: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

// Initialize theme immediately to prevent flash
if (typeof document !== "undefined") {
  applyTheme(getEffectiveDark());
}

let listeners: Set<() => void> = new Set();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  // Listen to system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    applyTheme(getEffectiveDark());
    callback();
  };
  mediaQuery.addEventListener("change", handleChange);

  // Listen to storage changes (for cross-tab sync)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      applyTheme(getEffectiveDark());
      callback();
    }
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function notifyListeners(): void {
  listeners.forEach((callback) => callback());
}

export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribe, getEffectiveDark, () => false);
}

export function useTheme(): { isDark: boolean; toggleTheme: () => void } {
  const isDark = useSyncExternalStore(subscribe, getEffectiveDark, () => false);

  const toggleTheme = useCallback(() => {
    const currentlyDark = getEffectiveDark();
    const newPreference: ThemePreference = currentlyDark ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, newPreference);
    applyTheme(!currentlyDark);
    notifyListeners();
  }, []);

  return { isDark, toggleTheme };
}

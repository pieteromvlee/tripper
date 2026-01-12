import { useState, useEffect, useRef } from "react";

type ViewMode = "list" | "map" | "calendar";
type DetailViewMode = "map" | "calendar";

interface UseViewModeReturn {
  // State
  isMobile: boolean;
  viewMode: ViewMode;
  detailViewMode: DetailViewMode;
  sidebarVisible: boolean;

  // Setters
  setViewMode: (mode: ViewMode) => void;
  setDetailViewMode: (mode: DetailViewMode) => void;
  setSidebarVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;

  // Computed values
  isMapView: boolean;
  isCalendarView: boolean;
  isListView: boolean;
}

/**
 * Custom hook for managing view mode state across mobile and desktop
 *
 * Mobile: Three-way toggle (list/map/calendar)
 * Desktop: Sidebar toggle + detail view mode (map/calendar)
 *
 * @returns View mode state and setters, plus computed view flags
 */
export function useViewMode(): UseViewModeReturn {
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [detailViewMode, setDetailViewMode] = useState<DetailViewMode>("map");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const prevIsMobileRef = useRef(isMobile);

  // Detect mobile viewport and handle calendar fallback
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 1024;
      const wasMobile = prevIsMobileRef.current;

      // Transition from desktop to mobile with calendar active
      if (!wasMobile && newIsMobile && viewMode === "calendar") {
        setViewMode("list");
      }

      prevIsMobileRef.current = newIsMobile;
      setIsMobile(newIsMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [viewMode]);

  // Computed values for cleaner conditionals
  const isMapView = isMobile ? viewMode === "map" : detailViewMode === "map";
  const isCalendarView = isMobile ? viewMode === "calendar" : detailViewMode === "calendar";
  const isListView = isMobile ? viewMode === "list" : sidebarVisible;

  return {
    isMobile,
    viewMode,
    detailViewMode,
    sidebarVisible,
    setViewMode,
    setDetailViewMode,
    setSidebarVisible,
    isMapView,
    isCalendarView,
    isListView,
  };
}

import { useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CompactCalendarColumn } from "./CompactCalendarColumn";
import { formatDateString, isSameDay, getDatePart, parseISODate } from "../../lib/dateUtils";

interface KanbanViewProps {
  tripId: Id<"trips">;
  locations: Doc<"locations">[] | undefined;
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  visibleCategories: Set<Id<"categories">>;
}

function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function KanbanView({
  tripId,
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
  visibleCategories,
}: KanbanViewProps) {
  const uniqueDates = useQuery(api.locations.getUniqueDates, { tripId });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper: Check if a location is active on a given date (handles multi-day ranges)
  function isLocationActiveOnDate(loc: Doc<"locations">, targetDateStr: string): boolean {
    if (!loc.dateTime) return false;

    const startDate = getDatePart(loc.dateTime);

    // If no end date, only active on start date
    if (!loc.endDateTime) {
      return startDate === targetDateStr;
    }

    // Has end date: check if target falls within range (inclusive)
    const endDate = getDatePart(loc.endDateTime);
    return targetDateStr >= startDate && targetDateStr <= endDate;
  }

  // Calculate visible dates - only show days with events
  const visibleDates: Date[] = (() => {
    if (!uniqueDates || uniqueDates.length === 0) {
      // Show 7 days from today if no events scheduled
      return generateDateRange(
        today,
        new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
    }

    // Convert unique dates to Date objects and filter to only days with visible locations
    return uniqueDates
      .map((dateStr) => parseISODate(dateStr))
      .filter((date) => {
        // Check if this date has any visible locations (including multi-day spans)
        const dateStr = formatDateString(date);
        const hasLocations = locations?.some((loc) => {
          if (loc.categoryId && !visibleCategories.has(loc.categoryId)) return false;
          return isLocationActiveOnDate(loc, dateStr);
        });
        return hasLocations;
      });
  })();

  function getLocationsForDate(targetDate: Date): Doc<"locations">[] {
    if (!locations) return [];

    const dateStr = formatDateString(targetDate);

    return locations.filter((loc) => {
      if (loc.categoryId && !visibleCategories.has(loc.categoryId)) return false;
      return isLocationActiveOnDate(loc, dateStr);
    });
  }

  function scrollToToday(): void {
    if (!scrollContainerRef.current) return;

    const todayIndex = visibleDates.findIndex((date) => isSameDay(date, today));
    if (todayIndex === -1) {
      // Today has no events, nothing to scroll to
      return;
    }

    // Check if horizontal scrolling is needed
    const container = scrollContainerRef.current;
    if (container.scrollWidth <= container.clientWidth) {
      // All columns fit in viewport, no need to scroll
      return;
    }

    // On mobile (<1024px), use fixed column width
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      const columnWidth = 192 + 8; // w-48 (192px) + gap-2 (8px)
      container.scrollTo({
        left: todayIndex * columnWidth - container.clientWidth / 2 + columnWidth / 2,
        behavior: "smooth",
      });
    } else {
      // On desktop with flex columns, calculate actual width
      const columns = container.querySelectorAll('[data-column]');
      if (columns.length > todayIndex) {
        const todayColumn = columns[todayIndex] as HTMLElement;
        todayColumn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }


  // Format visible range for display
  const rangeDisplay = (() => {
    if (visibleDates.length === 0) return "";

    const first = visibleDates[0];
    const last = visibleDates[visibleDates.length - 1];

    const firstStr = first.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const lastStr = last.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    return `${firstStr} - ${lastStr}`;
  })();

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header with navigation */}
      <div className="flex items-center px-4 py-3 border-b border-border bg-surface-elevated">
        <h2 className="text-sm font-medium text-text-secondary">
          {rangeDisplay}
        </h2>
      </div>

      {/* Horizontally scrollable columns */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth"
      >
        <div className="flex gap-2 p-4 h-full">
          {visibleDates.map((date) => (
            <CompactCalendarColumn
              key={date.toISOString()}
              date={date}
              isToday={isSameDay(date, today)}
              locations={getLocationsForDate(date)}
              categories={categories}
              selectedLocationId={selectedLocationId}
              onLocationSelect={onLocationSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

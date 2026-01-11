import { useState, useEffect, useRef } from "react";
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
  const [visibleRangeStart, setVisibleRangeStart] = useState<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate date range from scheduled locations
  useEffect(() => {
    if (!uniqueDates || uniqueDates.length === 0) {
      // No scheduled dates: show current week (7 days from today)
      const start = new Date(today);
      setVisibleRangeStart(start);
      return;
    }

    // Parse scheduled dates (use parseISODate to avoid timezone conversion)
    const scheduledDates = uniqueDates.map((dateStr) => parseISODate(dateStr));
    scheduledDates.sort((a, b) => a.getTime() - b.getTime());

    // Get earliest scheduled date
    const earliest = scheduledDates[0];

    // Add 1 day padding before
    const rangeStart = new Date(earliest);
    rangeStart.setDate(rangeStart.getDate() - 1);

    setVisibleRangeStart(rangeStart);
  }, [uniqueDates]);

  // Calculate visible dates
  const visibleDates: Date[] = (() => {
    if (!visibleRangeStart) return [];

    if (!uniqueDates || uniqueDates.length === 0) {
      // Show 7 days when no scheduled locations
      return generateDateRange(
        visibleRangeStart,
        new Date(visibleRangeStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      );
    }

    // Parse scheduled dates (use parseISODate to avoid timezone conversion)
    const scheduledDates = uniqueDates.map((dateStr) => parseISODate(dateStr));
    scheduledDates.sort((a, b) => a.getTime() - b.getTime());

    const latest = scheduledDates[scheduledDates.length - 1];

    // Add 1 day padding after
    const rangeEnd = new Date(latest);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    return generateDateRange(visibleRangeStart, rangeEnd);
  })();

  function getLocationsForDate(targetDate: Date): Doc<"locations">[] {
    if (!locations) return [];

    const dateStr = formatDateString(targetDate);

    return locations.filter((loc) => {
      if (!loc.dateTime) return false;
      if (loc.categoryId && !visibleCategories.has(loc.categoryId)) return false;
      return getDatePart(loc.dateTime) === dateStr;
    });
  }

  function scrollToToday(): void {
    if (!scrollContainerRef.current) return;

    const todayIndex = visibleDates.findIndex((date) => isSameDay(date, today));
    if (todayIndex === -1) {
      // Today not in visible range, adjust range to show today
      const newStart = new Date(today);
      newStart.setDate(newStart.getDate() - 3); // Show 3 days before today
      setVisibleRangeStart(newStart);
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

  function navigateWeek(delta: number): void {
    if (!visibleRangeStart) return;

    const newStart = new Date(visibleRangeStart);
    newStart.setDate(newStart.getDate() + delta * 7);
    setVisibleRangeStart(newStart);
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

  if (!visibleRangeStart) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header with navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
        <h2 className="text-sm font-medium text-text-secondary">
          {rangeDisplay}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToToday()}
            className="px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-secondary transition"
          >
            Today
          </button>
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
            title="Previous week"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
            title="Next week"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
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

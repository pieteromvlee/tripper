import { useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DaySelectorProps {
  tripId: Id<"trips">;
  selectedDate: string | null; // null means "All" is selected
  onDateSelect: (date: string | null) => void;
}

export function DaySelector({
  tripId,
  selectedDate,
  onDateSelect,
}: DaySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const uniqueDates = useQuery(api.locations.getUniqueDates, { tripId });

  // Get today's date in ISO format
  const today = new Date().toISOString().split("T")[0];

  // Scroll selected date into view
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a date is today
  const isToday = (dateStr: string): boolean => {
    return dateStr === today;
  };

  // Loading state
  if (uniqueDates === undefined) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No dates available - hide the bar entirely
  if (uniqueDates.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {/* "All" option */}
      <button
        ref={selectedDate === null ? selectedRef : undefined}
        onClick={() => onDateSelect(null)}
        className={`
          flex-shrink-0 px-3 py-1.5 text-xs font-medium
          transition-colors touch-manipulation border
          ${
            selectedDate === null
              ? "bg-blue-600 text-white border-blue-400"
              : "bg-surface-elevated text-text-secondary border-border hover:border-border-focus hover:bg-surface-secondary"
          }
        `}
      >
        All
      </button>

      {/* Date pills */}
      {uniqueDates.map((date) => {
        const isSelected = selectedDate === date;
        const todayFlag = isToday(date);

        return (
          <button
            key={date}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onDateSelect(date)}
            className={`
              flex-shrink-0 px-3 py-1.5 text-xs font-medium
              transition-colors touch-manipulation whitespace-nowrap border
              ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-400"
                  : todayFlag
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20"
                  : "bg-surface-elevated text-text-secondary border-border hover:border-border-focus hover:bg-surface-secondary"
              }
            `}
          >
            {formatDate(date)}
            {todayFlag && !isSelected && (
              <span className="ml-1 opacity-70">(Today)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

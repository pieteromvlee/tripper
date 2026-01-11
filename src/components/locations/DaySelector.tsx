import { useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getTodayDateString, formatDateForDisplay } from "../../lib/dateUtils";

interface DaySelectorProps {
  tripId: Id<"trips">;
  selectedDate: string | null | "unscheduled"; // null = "All", "unscheduled" = unscheduled filter
  onDateSelect: (date: string | null | "unscheduled") => void;
}

const BASE_BUTTON_CLASSES =
  "flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-colors touch-manipulation border";

type ButtonVariant = "selected" | "today" | "default";

function getButtonClasses(variant: ButtonVariant): string {
  switch (variant) {
    case "selected":
      return `${BASE_BUTTON_CLASSES} bg-blue-600 text-white border-blue-400`;
    case "today":
      return `${BASE_BUTTON_CLASSES} bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20`;
    case "default":
      return `${BASE_BUTTON_CLASSES} bg-surface-elevated text-text-secondary border-border hover:border-border-focus hover:bg-surface-secondary`;
  }
}


export function DaySelector({
  tripId,
  selectedDate,
  onDateSelect,
}: DaySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const uniqueDates = useQuery(api.locations.getUniqueDates, { tripId });
  const allLocations = useQuery(api.locations.listByTrip, { tripId });

  const hasUnscheduledLocations = allLocations?.some(loc => !loc.dateTime);
  const today = getTodayDateString();

  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedDate]);

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
      <button
        ref={selectedDate === null ? selectedRef : undefined}
        onClick={() => onDateSelect(null)}
        className={getButtonClasses(selectedDate === null ? "selected" : "default")}
      >
        All
      </button>

      {hasUnscheduledLocations && (
        <button
          ref={selectedDate === "unscheduled" ? selectedRef : undefined}
          onClick={() => onDateSelect("unscheduled")}
          className={`${getButtonClasses(selectedDate === "unscheduled" ? "selected" : "default")} whitespace-nowrap`}
        >
          Unscheduled
        </button>
      )}

      {uniqueDates.map((date) => {
        const isSelected = selectedDate === date;
        const isToday = date === today;

        function getVariant(): ButtonVariant {
          if (isSelected) return "selected";
          if (isToday) return "today";
          return "default";
        }

        return (
          <button
            key={date}
            ref={isSelected ? selectedRef : undefined}
            onClick={() => onDateSelect(date)}
            className={`${getButtonClasses(getVariant())} whitespace-nowrap`}
          >
            {formatDateForDisplay(date)}
            {isToday && !isSelected && (
              <span className="ml-1 opacity-70">(Today)</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

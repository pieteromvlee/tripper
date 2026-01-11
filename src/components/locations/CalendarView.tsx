import { useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarCell } from "./CalendarCell";
import { formatDateString, getTimePart, isSameDay, getDatePart } from "../../lib/dateUtils";

interface CalendarViewProps {
  tripId: Id<"trips">;
  locations: Doc<"locations">[] | undefined;
  categories: Doc<"categories">[] | undefined;
  selectedLocationId: Id<"locations"> | null;
  onLocationSelect: (id: Id<"locations">) => void;
  visibleCategories: Set<Id<"categories">>;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Generate calendar grid days for a given month
 *
 * Business rule: Calendar always shows exactly 42 days (6 weeks x 7 days) for consistent UI height
 *
 * Why 42 days?
 * - Most months need 5 weeks when starting mid-week
 * - Some months need 6 weeks (e.g., 31-day month starting on Saturday)
 * - Fixed 6-week grid prevents layout shifting between months
 *
 * Algorithm:
 * 1. Fill previous month padding (to align first day with correct weekday)
 * 2. Fill current month days (1 to lastDay)
 * 3. Fill next month padding (to reach exactly 42 cells)
 */
function generateCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0 (Sunday) to 6 (Saturday)
  const daysInMonth = lastDay.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  // Step 1: Add trailing days from previous month
  // Why: Align first day of month with correct weekday column (e.g., if month starts on Wed, show Sun-Tue from prev month)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }

  // Step 2: Add all days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  // Step 3: Add leading days from next month to fill grid to 42 cells
  // Why: Ensures consistent 6-week grid height across all months
  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  return days;
}

export function CalendarView({
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
  visibleCategories,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const updateLocation = useMutation(api.locations.update);
  const today = new Date();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    })
  );

  function getLocationsForDate(targetDate: Date): Doc<"locations">[] {
    if (!locations) return [];

    const dateStr = formatDateString(targetDate);

    return locations.filter((loc) => {
      if (!loc.dateTime) return false;
      if (loc.categoryId && !visibleCategories.has(loc.categoryId)) return false;
      return getDatePart(loc.dateTime) === dateStr;
    });
  }

  /**
   * Handle drag-and-drop of location to a new date
   *
   * Business rule: When dragging a location to a different day, preserve its time but update the date
   * Edge case: If location has no time, default to "00:00" (midnight)
   *
   * Why preserve time?
   * - User likely wants to keep "dinner at 7pm" as 7pm, just on a different day
   * - Changing the time would require extra work to fix
   */
  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event;
    if (!over) return; // Dropped outside any droppable area

    // Extract location being dragged
    const locationId = active.id as Id<"locations">;
    const location = locations?.find((loc) => loc._id === locationId);
    if (!location) return;

    // Extract target date from droppable area ID (format: "day-YYYY-MM-DD")
    const overId = over.id.toString();
    if (!overId.startsWith("day-")) return; // Not dropped on a calendar cell

    const newDate = overId.replace("day-", "");
    const time = location.dateTime ? getTimePart(location.dateTime) : "00:00";

    await updateLocation({
      id: locationId,
      dateTime: `${newDate}T${time}`,
    });
  }

  function navigateMonth(delta: number): void {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1)
    );
  }

  const calendarDays = generateCalendarGrid(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const monthName = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-surface">
        {/* Calendar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
          <h2 className="text-lg font-semibold text-text-primary">
            {monthName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-secondary transition"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
              title="Previous month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
              title="Next month"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main calendar area */}
        <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col overflow-x-auto">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-px bg-border border-b border-border sticky top-0 z-10">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-xs font-bold text-center py-2 bg-surface-secondary text-text-secondary"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div
                  className="grid grid-cols-7 grid-rows-6 gap-px bg-border"
                  style={{ gridTemplateRows: 'repeat(6, minmax(120px, 1fr))' }}
                >
                {calendarDays.map((day, index) => (
                  <CalendarCell
                    key={index}
                    date={day.date}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={isSameDay(day.date, today)}
                    locations={getLocationsForDate(day.date)}
                    categories={categories}
                    selectedLocationId={selectedLocationId}
                    onLocationSelect={onLocationSelect}
                  />
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>
    </DndContext>
  );
}

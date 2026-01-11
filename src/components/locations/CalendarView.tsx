import { useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarCell } from "./CalendarCell";

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

export function CalendarView({
  locations,
  categories,
  selectedLocationId,
  onLocationSelect,
  visibleCategories,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const updateLocation = useMutation(api.locations.update);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms delay for touch
        tolerance: 5,
      },
    })
  );

  // Generate calendar grid for current month
  function generateCalendarGrid(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Next month padding (fill to 42 cells = 6 weeks)
    const remainingCells = 42 - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  }

  // Check if a date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  // Get locations for a specific date
  function getLocationsForDate(targetDate: Date): Doc<"locations">[] {
    if (!locations) return [];

    const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

    return locations.filter((loc) => {
      if (!loc.dateTime) return false;
      if (loc.categoryId && !visibleCategories.has(loc.categoryId)) return false;

      const locDate = loc.dateTime.substring(0, 10);

      // Show location on its start date
      return locDate === dateStr;
    });
  }


  // Handle drag end
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const locationId = active.id as Id<"locations">;
    const location = locations?.find((loc) => loc._id === locationId);
    if (!location) return;

    // Only handle drops on calendar days
    if (over.id.toString().startsWith("day-")) {
      const newDate = over.id.toString().replace("day-", ""); // YYYY-MM-DD
      await updateLocationDate(locationId, newDate, location.dateTime);
    }
  }

  // Update location date (preserve time)
  async function updateLocationDate(
    locationId: Id<"locations">,
    newDate: string, // YYYY-MM-DD
    currentDateTime: string | undefined
  ) {
    // Extract time from existing dateTime, or default to 00:00
    let time = "00:00";
    if (currentDateTime) {
      const parsed = new Date(currentDateTime);
      time = `${parsed.getHours().toString().padStart(2, "0")}:${parsed
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }

    const newDateTime = `${newDate}T${time}`;

    await updateLocation({
      id: locationId,
      dateTime: newDateTime,
    });
  }

  // Navigate months
  function goToPreviousMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    setCurrentMonth(new Date());
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
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium border border-border bg-surface hover:bg-surface-secondary transition"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
              title="Previous month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1.5 border border-border bg-surface hover:bg-surface-secondary transition"
              title="Next month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Main calendar area */}
        <div className="flex-1 overflow-auto">
            <div className="min-w-[700px]">
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

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {calendarDays.map((day, index) => (
                  <CalendarCell
                    key={index}
                    date={day.date}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={isToday(day.date)}
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
    </DndContext>
  );
}

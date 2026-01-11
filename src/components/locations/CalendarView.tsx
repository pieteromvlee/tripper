import { useState } from "react";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CalendarCell } from "./CalendarCell";
import { formatDateString, getTimePart } from "../../lib/dateUtils";

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

function generateCalendarGrid(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month padding
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

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
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
      return loc.dateTime.substring(0, 10) === dateStr;
    });
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event;
    if (!over) return;

    const locationId = active.id as Id<"locations">;
    const location = locations?.find((loc) => loc._id === locationId);
    if (!location) return;

    const overId = over.id.toString();
    if (!overId.startsWith("day-")) return;

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
            <div className="min-w-[700px] flex-1 flex flex-col">
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

              <div
                className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-border"
                style={{ gridTemplateRows: 'repeat(6, 1fr)' }}
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
    </DndContext>
  );
}

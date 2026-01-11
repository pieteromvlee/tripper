/**
 * Date/Time utility functions for timezone-naive date handling
 *
 * Philosophy: All dates and times are timezone-naive. "13:00 on Jan 16" means
 * exactly that, regardless of viewer's timezone. Perfect for trip planning.
 *
 * Storage format: ISO strings without timezone suffix (e.g., "2026-01-16T13:00")
 */

/**
 * Extract date part from ISO datetime string
 * @param dateTime ISO string like "2026-01-16T13:00"
 * @returns Date part like "2026-01-16"
 */
export function getDatePart(dateTime: string): string {
  return dateTime.slice(0, 10);
}

/**
 * Extract time part from ISO datetime string
 * @param dateTime ISO string like "2026-01-16T13:00"
 * @returns Time part like "13:00"
 */
export function getTimePart(dateTime: string): string {
  return dateTime.slice(11, 16);
}

/**
 * Format a Date object to YYYY-MM-DD string (without timezone conversion)
 * Use this to compare Date objects with stored ISO date strings
 * @param date Date object
 * @returns Date string like "2026-01-16"
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD string (without timezone conversion)
 * @returns Today's date like "2026-01-16"
 */
export function getTodayDateString(): string {
  return formatDateString(new Date());
}

/**
 * Parse ISO date string (YYYY-MM-DD) to Date object in local time
 * Use this when you need a Date object for display formatting
 * @param dateStr Date string like "2026-01-16" or malformed like "01/16/2026"
 * @returns Date object set to midnight local time
 */
export function parseISODate(dateStr: string): Date {
  let year: number, month: number, day: number;

  if (dateStr.includes('-')) {
    // ISO format: YYYY-MM-DD
    [year, month, day] = dateStr.split('-').map(Number);
  } else if (dateStr.includes('/')) {
    // Corrupted format: MM/DD/YYYY
    const parts = dateStr.split('/').map(Number);
    if (parts.length === 3) {
      // Assume MM/DD/YYYY
      [month, day, year] = parts;
    } else {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  } else {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return new Date(year, month - 1, day);
}

/**
 * Parse ISO datetime string (YYYY-MM-DDTHH:mm) to Date object in local time
 * Use this when you need a Date object for display formatting
 * @param dateTime ISO string like "2026-01-16T13:00" or malformed like "01/16/2026T13:00"
 * @returns Date object in local time
 */
export function parseISODateTime(dateTime: string): Date {
  const [datePart, timePart] = dateTime.split('T');

  // Handle both ISO format (YYYY-MM-DD) and corrupted format (MM/DD/YYYY)
  let year: number, month: number, day: number;

  if (datePart.includes('-')) {
    // ISO format: YYYY-MM-DD
    [year, month, day] = datePart.split('-').map(Number);
  } else if (datePart.includes('/')) {
    // Corrupted format: MM/DD/YYYY
    const parts = datePart.split('/').map(Number);
    if (parts.length === 3) {
      // Assume MM/DD/YYYY
      [month, day, year] = parts;
    } else {
      throw new Error(`Invalid date format: ${datePart}`);
    }
  } else {
    throw new Error(`Invalid date format: ${datePart}`);
  }

  const [hour, minute] = (timePart || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/**
 * Combine date and time parts into ISO datetime string
 * @param date Date part like "2026-01-16"
 * @param time Time part like "13:00" (optional)
 * @returns ISO string like "2026-01-16T13:00" or "2026-01-16T00:00"
 */
export function combineDateTime(date: string, time: string): string {
  if (!date) return "";
  return time ? `${date}T${time}` : `${date}T00:00`;
}

/**
 * Format a naive datetime string for display (timezone-independent)
 * @param dateTime ISO string like "2026-01-16T13:00"
 * @returns Formatted string like "Fri, Jan 16, 13:00"
 */
export function formatDateTime(dateTime: string | undefined): string {
  if (!dateTime) return "";

  try {
    const date = parseISODateTime(dateTime);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date (please edit)";
    }

    const timePart = dateTime.split('T')[1];
    if (!timePart) {
      return "Invalid date (please edit)";
    }

    const [hour, minute] = timePart.split(':').map(Number);

    // Format date part
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Check if dateStr is valid
    if (dateStr === "Invalid Date") {
      return "Invalid date (please edit)";
    }

    // Format time as 24-hour
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    return `${dateStr}, ${timeStr}`;
  } catch {
    return "Invalid date (please edit)";
  }
}

/**
 * Format a naive datetime string to show only the time (24-hour format)
 * @param dateTime ISO string like "2026-01-16T13:00"
 * @returns Time string like "13:00"
 */
export function formatTime(dateTime: string | undefined): string {
  if (!dateTime) return "";

  try {
    return getTimePart(dateTime);
  } catch {
    return dateTime;
  }
}

/**
 * Format a date string for display
 * @param dateStr Date string like "2026-01-16"
 * @returns Formatted string like "Fri, Jan 16"
 */
export function formatDateForDisplay(dateStr: string): string {
  try {
    const date = parseISODate(dateStr);
    const result = date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    // Check if result is "Invalid Date"
    if (result === "Invalid Date" || isNaN(date.getTime())) {
      return "Invalid date";
    }
    return result;
  } catch {
    return "Invalid date";
  }
}

/**
 * Check if two Date objects represent the same calendar day
 * @param date1 First date
 * @param date2 Second date
 * @returns true if both dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

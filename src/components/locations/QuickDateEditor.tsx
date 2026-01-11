import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getDatePart, getTimePart, combineDateTime } from "../../lib/dateUtils";

interface QuickDateEditorProps {
  locationId: Id<"locations">;
  dateTime: string;
  isDesktop: boolean;
  className?: string;
  isEndDate?: boolean;
  displayText: string;
}

export function QuickDateEditor({
  locationId,
  dateTime,
  isDesktop,
  className = "",
  isEndDate = false,
  displayText,
}: QuickDateEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"below" | "above">("below");
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updateLocation = useMutation(api.locations.update);

  // Position calculation
  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      setPosition("above");
    } else {
      setPosition("below");
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;

    try {
      const timePart = getTimePart(dateTime);
      const newDateTime = combineDateTime(newDate, timePart);

      await updateLocation({
        id: locationId,
        ...(isEndDate ? { endDateTime: newDateTime } : { dateTime: newDateTime }),
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update date:", error);
      // Keep popover open on error
    }
  };

  return (
    <span ref={triggerRef} className="relative">
      <span
        onClick={handleClick}
        className={`${className} ${isDesktop ? "cursor-pointer hover:underline" : ""}`}
        title={isDesktop ? "Click to change date" : undefined}
      >
        {displayText}
      </span>

      {isOpen && isDesktop && (
        <div
          ref={popoverRef}
          className={`
            absolute left-0 z-50 bg-surface-elevated border border-border shadow-lg p-2
            ${position === "above" ? "bottom-full mb-1" : "top-full mt-1"}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="date"
            defaultValue={getDatePart(dateTime)}
            onChange={handleDateChange}
            className="px-2 py-1 border border-border focus:outline-none focus:border-blue-400 bg-surface-elevated text-text-primary"
            autoFocus
          />
        </div>
      )}
    </span>
  );
}

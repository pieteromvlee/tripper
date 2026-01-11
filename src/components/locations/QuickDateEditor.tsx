import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { getDatePart, getTimePart, combineDateTime } from "../../lib/dateUtils";
import { useClickOutside, useInlineEditor } from "../../hooks";

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
}: QuickDateEditorProps): React.ReactElement {
  const [position, setPosition] = useState<"below" | "above">("below");
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const { isEditing: isOpen, startEditing, cancelEditing, saveField } = useInlineEditor({
    locationId,
    isDesktop,
    isEndField: isEndDate,
  });

  // Calculate popover position based on available space
  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? "above" : "below");
  }, [isOpen]);

  useClickOutside(popoverRef, cancelEditing, isOpen);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        cancelEditing();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, cancelEditing]);

  function handleClick(e: React.MouseEvent): void {
    if (!isDesktop) return;
    e.stopPropagation();
    if (isOpen) {
      cancelEditing();
    } else {
      startEditing();
    }
  }

  async function handleDateChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const newDate = e.target.value;
    if (!newDate) return;

    const timePart = getTimePart(dateTime);
    const newDateTime = combineDateTime(newDate, timePart);

    try {
      await saveField(newDateTime);
    } catch {
      // Error already handled by hook
    }
  }

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

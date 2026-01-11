import { useState, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { getTimePart, getDatePart, combineDateTime } from "../../lib/dateUtils";
import { useInlineEditor } from "../../hooks";

interface QuickTimeEditorProps {
  locationId: Id<"locations">;
  dateTime: string;
  isDesktop: boolean;
  className?: string;
  isEndTime?: boolean;
  displayText: string;
}

const TIME_PATTERN = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export function QuickTimeEditor({
  locationId,
  dateTime,
  isDesktop,
  className = "",
  isEndTime = false,
  displayText,
}: QuickTimeEditorProps): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { isEditing, hasError, startEditing, cancelEditing, saveField } = useInlineEditor({
    locationId,
    isDesktop,
    isEndField: isEndTime,
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleClick(e: React.MouseEvent): void {
    if (!isDesktop) return;
    e.stopPropagation();
    setInputValue(getTimePart(dateTime));
    startEditing();
  }

  async function saveTime(): Promise<void> {
    if (!TIME_PATTERN.test(inputValue)) {
      setInputValue(getTimePart(dateTime));
      cancelEditing();
      return;
    }

    const datePart = getDatePart(dateTime);
    const newDateTime = combineDateTime(datePart, inputValue);

    try {
      await saveField(newDateTime);
    } catch {
      setInputValue(getTimePart(dateTime));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTime();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  if (!isEditing) {
    return (
      <span
        onClick={handleClick}
        className={`${className} ${isDesktop ? "cursor-pointer hover:underline" : ""} ${hasError ? "text-red-400" : ""}`}
        title={isDesktop ? "Click to edit time" : undefined}
      >
        {displayText}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onBlur={saveTime}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      placeholder="HH:mm"
      pattern="[0-2][0-9]:[0-5][0-9]"
      className={`${className} inline-block w-12 px-1 text-xs border-b-2 border-blue-400 focus:outline-none bg-transparent`}
    />
  );
}

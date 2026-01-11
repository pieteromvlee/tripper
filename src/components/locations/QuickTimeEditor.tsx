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

export function QuickTimeEditor({
  locationId,
  dateTime,
  isDesktop,
  className = "",
  isEndTime = false,
  displayText,
}: QuickTimeEditorProps) {
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

  const validateTime = (value: string): boolean => {
    return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(value);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDesktop) return;
    e.stopPropagation();
    setInputValue(getTimePart(dateTime));
    startEditing();
  };

  const saveTime = async () => {
    if (!validateTime(inputValue)) {
      setInputValue(getTimePart(dateTime));
      cancelEditing();
      return;
    }

    const datePart = getDatePart(dateTime);
    const newDateTime = combineDateTime(datePart, inputValue);

    try {
      await saveField(newDateTime);
    } catch (error) {
      // Error already handled by hook
      setInputValue(getTimePart(dateTime));
    }
  };

  const handleBlur = () => {
    saveTime();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTime();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  if (!isDesktop || !isEditing) {
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
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      placeholder="HH:mm"
      pattern="[0-2][0-9]:[0-5][0-9]"
      className={`${className} inline-block w-12 px-1 text-xs border-b-2 border-blue-400 focus:outline-none bg-transparent`}
    />
  );
}

import { useState, useRef, useEffect } from "react";
import type { LocationType } from "../../lib/locationStyles";
import { locationTypeOptions } from "../../lib/locationStyles";

interface TypeFilterProps {
  visibleTypes: Set<LocationType>;
  onToggleType: (type: LocationType) => void;
}

export function TypeFilter({ visibleTypes, onToggleType }: TypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count how many types are hidden (total 5 types)
  const hiddenCount = 5 - visibleTypes.size;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Filter button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
          transition-colors touch-manipulation border
          ${hiddenCount > 0
            ? "bg-blue-600 text-white border-blue-400"
            : "bg-surface-elevated text-text-secondary border-border hover:border-border-focus hover:bg-surface-secondary"
          }
        `}
        title="Filter by type"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {hiddenCount > 0 && (
          <span>{hiddenCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border z-50">
          {locationTypeOptions.map((option, index) => {
            const isActive = visibleTypes.has(option.value);
            return (
              <button
                key={option.value}
                onClick={() => onToggleType(option.value)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-secondary transition-colors ${index < locationTypeOptions.length - 1 ? "border-b border-border-muted" : ""}`}
              >
                {/* Checkbox */}
                <div
                  className={`
                    w-4 h-4 flex items-center justify-center flex-shrink-0 border
                    ${isActive ? `${option.color} border-transparent` : "bg-surface-secondary border-border"}
                  `}
                >
                  {isActive && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Icon and label */}
                <div className="flex items-center gap-2 flex-1">
                  <span className={isActive ? "text-text-primary" : "text-text-muted"}>
                    <TypeIcon type={option.value} />
                  </span>
                  <span className={`text-xs ${isActive ? "text-text-primary" : "text-text-muted"}`}>
                    {option.label}s
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TypeIcon({ type }: { type: LocationType }) {
  switch (type) {
    case "attraction":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      );
    case "restaurant":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
        </svg>
      );
    case "accommodation":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    case "shop":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
        </svg>
      );
    case "snack":
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 12.414V17a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4.586L3.293 7.707A1 1 0 013 7V5z" clipRule="evenodd" />
        </svg>
      );
  }
}

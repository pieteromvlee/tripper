import { useState, useRef, useEffect } from "react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { CategoryIcon } from "../../lib/typeIcons";

interface CategoryFilterProps {
  categories: Doc<"categories">[] | undefined;
  visibleCategories: Set<Id<"categories">>;
  onToggleCategory: (categoryId: Id<"categories">) => void;
}

export function CategoryFilter({
  categories,
  visibleCategories,
  onToggleCategory
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Count how many categories are hidden
  const hiddenCount = categories ? categories.length - visibleCategories.size : 0;

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

  if (!categories) {
    return null;
  }

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
        title="Filter by category"
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
        <div className="absolute right-0 top-full mt-1 w-48 bg-surface-elevated border border-border z-50 shadow-lg">
          {categories.map((category, index) => {
            const isActive = visibleCategories.has(category._id);
            return (
              <button
                key={category._id}
                onClick={() => onToggleCategory(category._id)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-secondary transition-colors ${index < categories.length - 1 ? "border-b border-border-muted" : ""}`}
              >
                {/* Checkbox */}
                <div
                  className={`
                    w-4 h-4 flex items-center justify-center flex-shrink-0 border
                    ${isActive ? "border-transparent" : "bg-surface-secondary border-border"}
                  `}
                  style={isActive ? { backgroundColor: category.color } : undefined}
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
                    <CategoryIcon
                      iconName={category.iconName}
                      className="w-4 h-4"
                      color={isActive ? category.color : undefined}
                    />
                  </span>
                  <span className={`text-xs ${isActive ? "text-text-primary" : "text-text-muted"}`}>
                    {category.name}s
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

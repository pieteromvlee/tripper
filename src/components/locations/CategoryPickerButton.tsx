import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { CategoryIcon } from "../../lib/typeIcons";

interface CategoryPickerButtonProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  currentCategory?: Doc<"categories">;
  isDesktop: boolean;
}

export function CategoryPickerButton({
  location,
  categories,
  currentCategory,
  isDesktop,
}: CategoryPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateLocation = useMutation(api.locations.update);

  // Close dropdown when clicking outside (must be called before any conditional returns)
  useEffect(() => {
    if (!isDesktop) return; // Skip effect on mobile

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isDesktop]);

  // Mobile: Show static icon only
  if (!isDesktop) {
    return (
      <div className="flex-shrink-0 mt-0.5">
        {currentCategory ? (
          <CategoryIcon
            iconName={currentCategory.iconName}
            color={currentCategory.color}
            className="w-4 h-4"
          />
        ) : (
          <CategoryIcon
            iconName="MapPin"
            className="w-4 h-4 text-text-muted"
          />
        )}
      </div>
    );
  }

  const handleCategorySelect = async (categoryId: Id<"categories">) => {
    try {
      await updateLocation({
        id: location._id,
        categoryId,
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update category:", error);
      // Keep dropdown open on error so user can retry
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2.5 -m-2 rounded hover:bg-surface-secondary transition-colors touch-manipulation"
        title="Change category"
      >
        {currentCategory ? (
          <CategoryIcon
            iconName={currentCategory.iconName}
            color={currentCategory.color}
            className="w-4 h-4"
          />
        ) : (
          <CategoryIcon
            iconName="MapPin"
            className="w-4 h-4 text-text-muted"
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && categories && categories.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-surface-elevated border border-border z-50 shadow-lg">
          {categories.map((category, index) => {
            const isActive = category._id === location.categoryId;
            return (
              <button
                key={category._id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategorySelect(category._id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-secondary transition-colors ${index < categories.length - 1 ? "border-b border-border-muted" : ""}`}
              >
                <CategoryIcon
                  iconName={category.iconName}
                  color={isActive ? category.color : undefined}
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className={`text-sm ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`}>
                  {category.name}
                </span>
                {isActive && (
                  <svg className="w-4 h-4 ml-auto text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Doc } from "../../../convex/_generated/dataModel";
import { CategoryIcon } from "../../lib/typeIcons";

interface CalendarLocationChipProps {
  location: Doc<"locations">;
  categories: Doc<"categories">[] | undefined;
  isSelected: boolean;
  onClick: () => void;
}

const CalendarLocationChipComponent = ({
  location,
  categories,
  isSelected,
  onClick,
}: CalendarLocationChipProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: location._id,
  });

  // Find category for this location
  const category = categories?.find(c => c._id === location.categoryId);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        px-1.5 py-0.5 text-xs truncate cursor-pointer border
        flex items-center gap-1 flex-shrink-0
        transition-all touch-manipulation
        ${
          isSelected
            ? "ring-2 ring-blue-400 bg-blue-500/10 border-blue-400"
            : "bg-surface-elevated border-border hover:bg-surface-secondary"
        }
        ${isDragging ? "opacity-50" : ""}
      `}
      style={
        category
          ? {
              borderColor: `${category.color}80`,
              backgroundColor: `${category.color}1A`,
            }
          : undefined
      }
    >
      {category && (
        <CategoryIcon
          iconName={category.iconName}
          className="w-3 h-3 flex-shrink-0"
          color={category.color}
        />
      )}
      <span
        className="truncate flex-1"
        style={category ? { color: category.color } : undefined}
      >
        {location.name}
      </span>
    </div>
  );
};

export const CalendarLocationChip = memo(CalendarLocationChipComponent);
CalendarLocationChip.displayName = "CalendarLocationChip";

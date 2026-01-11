import { useDraggable } from "@dnd-kit/core";
import type { Doc } from "../../../convex/_generated/dataModel";
import { formatDateTime, formatTime } from "../../lib/dateUtils";
import { CategoryIcon } from "../../lib/typeIcons";
import { isAccommodationCategory } from "../../lib/categoryUtils";

interface LocationCardProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  isSelected: boolean;
  onClick: () => void;
  selectedDate?: string;
}

function formatLocationTime(
  dateTime: string,
  selectedDate: string | undefined
): string {
  if (selectedDate) {
    return formatTime(dateTime);
  }
  return formatDateTime(dateTime);
}

export function LocationCard({
  location,
  categories,
  isSelected,
  onClick,
  selectedDate,
}: LocationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: location._id,
  });

  const category = categories?.find(c => c._id === location.categoryId);
  const isAccommodation = isAccommodationCategory(category);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`
        p-3 cursor-pointer transition-colors
        touch-manipulation border
        ${
          isSelected
            ? "bg-blue-500/10 border-blue-400"
            : "bg-surface-elevated border-border hover:bg-surface-secondary hover:border-border-focus"
        }
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        {category && (
          <CategoryIcon
            iconName={category.iconName}
            className="w-4 h-4 flex-shrink-0 mt-0.5"
            color={category.color}
          />
        )}

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm truncate ${isSelected ? "text-blue-300" : "text-text-primary"}`}>
            {location.name}
          </h3>

          {location.address && (
            <p className="text-xs text-text-secondary truncate mt-0.5">{location.address}</p>
          )}

          {location.dateTime && (
            <p className={`text-xs mt-1 ${isSelected ? "text-blue-400" : "text-text-secondary"}`}>
              {formatLocationTime(location.dateTime, selectedDate)}
              {isAccommodation && location.endDateTime && (
                <span className="text-text-muted">
                  {" "}- {formatLocationTime(location.endDateTime, selectedDate)}
                </span>
              )}
            </p>
          )}

          {location.notes && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{location.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

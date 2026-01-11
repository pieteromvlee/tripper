import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { Doc } from "../../../convex/_generated/dataModel";
import { formatDateTime, formatTime, formatDateForDisplay, getDatePart } from "../../lib/dateUtils";
import { isAccommodationCategory } from "../../lib/categoryUtils";
import { CategoryPickerButton } from "./CategoryPickerButton";
import { QuickTimeEditor } from "./QuickTimeEditor";
import { QuickDateEditor } from "./QuickDateEditor";
import { useIsDesktop } from "../../hooks/useMediaQuery";

interface LocationCardProps {
  location: Doc<"locations">;
  categories?: Doc<"categories">[];
  isSelected: boolean;
  onClick: () => void;
  selectedDate?: string;
  isDndEnabled?: boolean;
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

const LocationCardComponent = ({
  location,
  categories,
  isSelected,
  onClick,
  selectedDate,
  isDndEnabled = false,
}: LocationCardProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: location._id,
    disabled: !isDndEnabled,
  });

  const category = categories?.find(c => c._id === location.categoryId);
  const isAccommodation = isAccommodationCategory(category);
  const isDesktop = useIsDesktop();

  return (
    <div
      ref={setNodeRef}
      {...(isDndEnabled ? { ...listeners, ...attributes } : {})}
      onClick={onClick}
      className={`
        p-3 transition-colors touch-manipulation border
        ${isDndEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        ${
          isSelected
            ? "bg-blue-500/10 border-blue-400"
            : "bg-surface-elevated border-border hover:bg-surface-secondary hover:border-border-focus"
        }
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-start gap-2">
        <CategoryPickerButton
          location={location}
          categories={categories}
          currentCategory={category}
          isDesktop={isDesktop}
        />

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm truncate ${isSelected ? "text-blue-300" : "text-text-primary"}`}>
            {location.name}
          </h3>

          {location.address && (
            <p className="text-xs text-text-secondary truncate mt-0.5">{location.address}</p>
          )}

          {location.dateTime && (
            <p className={`text-xs mt-1 ${isSelected ? "text-blue-400" : "text-text-secondary"}`}>
              {isDesktop ? (
                <>
                  {selectedDate ? (
                    // When date selected: Show only time (editable on desktop)
                    <QuickTimeEditor
                      locationId={location._id}
                      dateTime={location.dateTime}
                      isDesktop={isDesktop}
                      displayText={formatTime(location.dateTime)}
                      className={isSelected ? "text-blue-400" : "text-text-secondary"}
                    />
                  ) : (
                    // Full datetime: Show date (editable) + time (editable)
                    <>
                      <QuickDateEditor
                        locationId={location._id}
                        dateTime={location.dateTime}
                        isDesktop={isDesktop}
                        displayText={formatDateForDisplay(getDatePart(location.dateTime))}
                        className={isSelected ? "text-blue-400" : "text-text-secondary"}
                      />
                      {", "}
                      <QuickTimeEditor
                        locationId={location._id}
                        dateTime={location.dateTime}
                        isDesktop={isDesktop}
                        displayText={formatTime(location.dateTime)}
                        className={isSelected ? "text-blue-400" : "text-text-secondary"}
                      />
                    </>
                  )}

                  {/* Accommodation checkout time */}
                  {isAccommodation && location.endDateTime && (
                    <>
                      <span className="text-text-muted"> - </span>
                      {selectedDate ? (
                        <QuickTimeEditor
                          locationId={location._id}
                          dateTime={location.endDateTime}
                          isEndTime={true}
                          isDesktop={isDesktop}
                          displayText={formatTime(location.endDateTime)}
                          className="text-text-muted"
                        />
                      ) : (
                        <>
                          <QuickDateEditor
                            locationId={location._id}
                            dateTime={location.endDateTime}
                            isEndDate={true}
                            isDesktop={isDesktop}
                            displayText={formatDateForDisplay(getDatePart(location.endDateTime))}
                            className="text-text-muted"
                          />
                          {", "}
                          <QuickTimeEditor
                            locationId={location._id}
                            dateTime={location.endDateTime}
                            isEndTime={true}
                            isDesktop={isDesktop}
                            displayText={formatTime(location.endDateTime)}
                            className="text-text-muted"
                          />
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                // Mobile: Static text (existing behavior)
                <>
                  {formatLocationTime(location.dateTime, selectedDate)}
                  {isAccommodation && location.endDateTime && (
                    <span className="text-text-muted">
                      {" "}- {formatLocationTime(location.endDateTime, selectedDate)}
                    </span>
                  )}
                </>
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
};

export const LocationCard = memo(LocationCardComponent);
LocationCard.displayName = "LocationCard";

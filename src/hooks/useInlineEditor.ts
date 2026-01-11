import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseInlineEditorOptions {
  locationId: Id<"locations">;
  isDesktop: boolean;
  isEndField?: boolean; // true for endDateTime, false for dateTime
}

interface UseInlineEditorReturn {
  isEditing: boolean;
  hasError: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  saveField: (newDateTime: string) => Promise<void>;
}

/**
 * Custom hook for inline editing of location date/time fields
 *
 * Handles common logic for QuickTimeEditor and QuickDateEditor:
 * - State management (isEditing, hasError)
 * - Mutation logic (updating dateTime or endDateTime)
 * - Error handling
 * - Desktop-only behavior
 *
 * @param locationId - ID of the location to update
 * @param isDesktop - Whether the user is on desktop (editing only enabled on desktop)
 * @param isEndField - true to update endDateTime, false to update dateTime
 */
export function useInlineEditor({
  locationId,
  isDesktop,
  isEndField = false,
}: UseInlineEditorOptions): UseInlineEditorReturn {
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const updateLocation = useMutation(api.locations.update);

  const startEditing = () => {
    if (!isDesktop) return;
    setIsEditing(true);
    setHasError(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setHasError(false);
  };

  const saveField = async (newDateTime: string): Promise<void> => {
    try {
      await updateLocation({
        id: locationId,
        ...(isEndField ? { endDateTime: newDateTime } : { dateTime: newDateTime }),
      });

      setIsEditing(false);
      setHasError(false);
    } catch (error) {
      console.error("Failed to update location:", error);
      setHasError(true);
      setIsEditing(false);
      throw error; // Re-throw so component can handle if needed
    }
  };

  return {
    isEditing,
    hasError,
    startEditing,
    cancelEditing,
    saveField,
  };
}

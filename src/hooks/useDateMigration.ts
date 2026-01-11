import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

interface UseDateMigrationReturn {
  migrationStatus: string | null;
  migrateDates: () => Promise<void>;
}

/**
 * Custom hook for migrating date formats from MM/DD/YYYY to YYYY-MM-DD
 *
 * TEMPORARY: This hook should be removed after all dates are migrated.
 * It validates and fixes date formats by re-saving them through the backend,
 * which automatically normalizes the format.
 *
 * @param locations - All locations to check for invalid dates
 * @returns Migration status and migration function
 */
export function useDateMigration(locations: Doc<"locations">[] | undefined): UseDateMigrationReturn {
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const updateLocation = useMutation(api.locations.update);

  const migrateDates = useCallback(async () => {
    if (!locations) return;

    try {
      setMigrationStatus("Scanning for corrupted dates...");

      // Log all locations for debugging
      console.log('=== ALL LOCATIONS ===');
      locations.forEach(loc => {
        console.log(`${loc.name}: dateTime="${loc.dateTime}" endDateTime="${loc.endDateTime || 'none'}"`);
      });

      // Pattern for valid YYYY-MM-DD format
      const validPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

      // Find locations with invalid date formats
      const locationsToFix = locations.filter(loc => {
        const hasInvalidDateTime = loc.dateTime && !validPattern.test(loc.dateTime);
        const hasInvalidEndDateTime = loc.endDateTime && !validPattern.test(loc.endDateTime);

        // Also check if dates parse to valid Date objects
        let hasUnparsableDateTime = false;
        let hasUnparsableEndDateTime = false;

        if (loc.dateTime && validPattern.test(loc.dateTime)) {
          try {
            const [datePart] = loc.dateTime.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const testDate = new Date(year, month - 1, day);
            if (isNaN(testDate.getTime())) {
              console.log('Found unparsable dateTime:', loc.name, loc.dateTime);
              hasUnparsableDateTime = true;
            }
          } catch (e) {
            console.log('Error parsing dateTime:', loc.name, loc.dateTime, e);
            hasUnparsableDateTime = true;
          }
        }

        if (loc.endDateTime && validPattern.test(loc.endDateTime)) {
          try {
            const [datePart] = loc.endDateTime.split('T');
            const [year, month, day] = datePart.split('-').map(Number);
            const testDate = new Date(year, month - 1, day);
            if (isNaN(testDate.getTime())) {
              console.log('Found unparsable endDateTime:', loc.name, loc.endDateTime);
              hasUnparsableEndDateTime = true;
            }
          } catch (e) {
            console.log('Error parsing endDateTime:', loc.name, loc.endDateTime, e);
            hasUnparsableEndDateTime = true;
          }
        }

        // Log invalid dates
        if (hasInvalidDateTime) {
          console.log('Found invalid format dateTime:', loc.name, loc.dateTime);
        }
        if (hasInvalidEndDateTime) {
          console.log('Found invalid format endDateTime:', loc.name, loc.endDateTime);
        }

        return hasInvalidDateTime || hasInvalidEndDateTime || hasUnparsableDateTime || hasUnparsableEndDateTime;
      });

      if (locationsToFix.length === 0) {
        setMigrationStatus("No corrupted dates found!");
        setTimeout(() => setMigrationStatus(null), 3000);
        return;
      }

      setMigrationStatus(`Fixing ${locationsToFix.length} location(s)...`);

      // Update each location - backend validation will auto-fix the format
      for (const location of locationsToFix) {
        console.log('Fixing location:', location.name, 'dateTime:', location.dateTime, 'endDateTime:', location.endDateTime);
        await updateLocation({
          id: location._id,
          dateTime: location.dateTime,
          endDateTime: location.endDateTime,
        });
      }

      setMigrationStatus(`Fixed ${locationsToFix.length} location(s) with corrupted dates!`);
      setTimeout(() => setMigrationStatus(null), 5000);
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setTimeout(() => setMigrationStatus(null), 5000);
    }
  }, [locations, updateLocation]);

  return {
    migrationStatus,
    migrateDates,
  };
}

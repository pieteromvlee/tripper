# Tripper Codebase Improvements

This document lists improvements for the Tripper codebase, organized by priority. Each item includes a clear problem description and proposed solution.

---

## Critical Issues (Fix Immediately)

### 1. Missing `getUniqueDates` Query

**Problem:** `DaySelector.tsx:20` references `api.locations.getUniqueDates` but this query is not defined in `convex/locations.ts`. This will cause a runtime error when the DaySelector component mounts.

**Solution:** Add the missing query to `convex/locations.ts`:

```typescript
export const getUniqueDates = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const locations = await ctx.db
      .query("locations")
      .withIndex("by_tripId", (q) => q.eq("tripId", args.tripId))
      .collect();

    const dates = [...new Set(locations.map((l) => l.date).filter(Boolean))];
    return dates.sort();
  },
});
```

---

### 2. Duplicate Form Components in TripPage

**Problem:** `TripPage.tsx` contains two nearly identical form components:
- `LocationFormWithCoords` (lines 474-652)
- `AddLocationFullscreen` (lines 655-844)

Both have identical logic for form submission, state management, and validation. Only styling differs. This duplication increases maintenance burden and risk of bugs.

**Solution:** Extract a single `LocationForm` component with a `variant` prop:

1. Create `src/components/locations/LocationForm.tsx`
2. Accept prop `variant: 'inline' | 'fullscreen'` to control styling
3. Move all shared logic into this component
4. Import and use in TripPage with appropriate variant

---

### 3. Orphaned Attachments on Location/Trip Deletion

**Problem:** When locations or trips are deleted:
- `trips.remove()` deletes members, invites, locations but NOT attachments
- `locations.remove()` does NOT delete its attachments from storage

This causes orphaned files in Convex storage, leading to storage bloat and potential data leaks.

**Solution:** Update deletion mutations:

In `convex/locations.ts` `remove` mutation:
```typescript
// Before deleting location, delete all its attachments
const attachments = await ctx.db
  .query("attachments")
  .withIndex("by_locationId", (q) => q.eq("locationId", args.id))
  .collect();

for (const attachment of attachments) {
  await ctx.storage.delete(attachment.storageId);
  await ctx.db.delete(attachment._id);
}
```

In `convex/trips.ts` `remove` mutation, before deleting locations, delete their attachments too.

---

### 4. Inconsistent Error Handling in Backend

**Problem:** Backend code inconsistently uses `new Error()` vs `ConvexError`:
- `trips.ts` uses `ConvexError`
- `locations.ts` uses `new Error()` (lines 43, 49, 159, 214, 224, 272)
- `tripMembers.ts` uses `ConvexError`
- `attachments.ts` uses `new Error()`

This inconsistency makes error handling unpredictable on the frontend.

**Solution:** Standardize on `ConvexError` throughout all Convex functions:

1. Add `import { ConvexError } from "convex/values";` to all files
2. Replace all `throw new Error(...)` with `throw new ConvexError(...)`
3. Update frontend error handling to expect ConvexError structure

---

## High Priority (Refactor)

### 5. TripPage.tsx is Too Large (845 lines)

**Problem:** `TripPage.tsx` has too many responsibilities:
- 13+ state variables managing complex UI state
- Three view modes (list, map, both) with complex conditionals
- Multiple embedded form components
- Complex event handlers scattered throughout

This makes the component hard to understand, test, and maintain.

**Solution:** Split into focused components:

1. `TripPageHeader.tsx` - Title, actions, view mode toggles
2. `TripPageLayout.tsx` - Handles view mode switching logic
3. `LocationFormModal.tsx` - Consolidated form (see item #2)
4. `TripInviteBanner.tsx` - Invite acceptance UI
5. Keep `TripPage.tsx` as orchestrator only (state + composition)

Consider using `useReducer` to consolidate the 13+ state variables into a single state object.

---

### 6. Duplicate Utility Functions

**Problem:** Several utility functions are duplicated across components:

1. **`formatDateTime`** - Identical in `LocationCard.tsx:62-77` and `LocationDetail.tsx:29-43`
2. **`getDirectionsUrl`** - Identical in `LocationCard.tsx:35-40`, `TripPage.tsx:141-146`, `LocationDetail.tsx:46-51`

**Solution:** Create `src/lib/location-utils.ts`:

```typescript
export function formatDateTime(date: string, time?: string): string {
  // consolidated logic
}

export function getDirectionsUrl(lat: number, lng: number, name: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
}
```

Update all components to import from this file.

---

### 7. Duplicate Type Definitions

**Problem:** `LocationType` type and `locationTypeOptions` array are defined in 4+ components separately:
- `LocationCard.tsx`
- `LocationForm.tsx`
- `TripPage.tsx`
- `LocationDetail.tsx`

**Solution:** Create `src/types/location.ts`:

```typescript
export type LocationType = "attraction" | "restaurant" | "hotel" | "transport" | "other";

export const locationTypeOptions: { value: LocationType; label: string; color: string }[] = [
  { value: "attraction", label: "Attraction", color: "blue" },
  { value: "restaurant", label: "Restaurant", color: "orange" },
  { value: "hotel", label: "Hotel", color: "purple" },
  { value: "transport", label: "Transport", color: "green" },
  { value: "other", label: "Other", color: "gray" },
];

export function getLocationTypeColor(type: LocationType): string {
  return locationTypeOptions.find(o => o.value === type)?.color ?? "gray";
}
```

---

### 8. Weak TypeScript Typing in trips.ts

**Problem:** `convex/trips.ts` uses `any` types in the helper function:

```typescript
async function getUserTripRole(
  ctx: { db: any },  // Should be QueryCtx or MutationCtx
  tripId: any,       // Should be Id<"trips">
  userId: any        // Should be Id<"users">
)
```

This defeats TypeScript's type safety benefits.

**Solution:** Fix typing:

```typescript
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function getUserTripRole(
  ctx: QueryCtx | MutationCtx,
  tripId: Id<"trips">,
  userId: Id<"users">
): Promise<"owner" | "member" | null>
```

---

### 9. Missing Input Validation in Backend

**Problem:** Several mutations lack input validation:

1. **`locations.create()`** doesn't validate:
   - Latitude bounds (-90 to 90)
   - Longitude bounds (-180 to 180)
   - Date format

2. **`tripMembers.invite()`** doesn't validate:
   - Email format (accepts any string)

**Solution:** Add validation:

```typescript
// In locations.create()
if (args.latitude < -90 || args.latitude > 90) {
  throw new ConvexError("Invalid latitude");
}
if (args.longitude < -180 || args.longitude > 180) {
  throw new ConvexError("Invalid longitude");
}

// In tripMembers.invite()
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(args.email)) {
  throw new ConvexError("Invalid email format");
}
```

---

## Medium Priority (Code Quality)

### 10. Empty Hooks Directory - Extract Custom Hooks

**Problem:** `src/hooks/index.ts` is empty. Complex logic is scattered across components instead of being extracted into reusable hooks.

**Solution:** Create custom hooks:

1. **`useLocationForm.ts`** - Form state, validation, submission logic from LocationCard and TripPage
2. **`useAddressSearch.ts`** - Debounced search, dropdown state, selection handling from LocationCard
3. **`useTripAccess.ts`** - Permission checking logic
4. **`useViewMode.ts`** - View mode state and persistence for TripPage

---

### 11. LocationCard.tsx is Too Complex (460 lines)

**Problem:** `LocationCard.tsx` handles too many responsibilities:
- Display location info
- Edit mode with inline form
- Delete confirmation modal
- Attachment management
- Address search dropdown

This violates Single Responsibility Principle.

**Solution:** Split into focused components:

1. `LocationCard.tsx` - Display only (reduced to ~100 lines)
2. `LocationEditForm.tsx` - Edit mode form
3. `LocationDeleteConfirm.tsx` - Delete confirmation modal
4. `AddressSearchInput.tsx` - Reusable address search with dropdown (currently inline at lines 564-577)

---

### 12. Silent Error Handling - No User Feedback

**Problem:** Several operations fail silently with only console.error:

1. **`LocationCard.tsx:390-397`** - Delete mutation has no error feedback
2. **`LocationSearch.tsx:184`** - Search errors logged but not shown
3. **`TripPage.tsx:48-62`** - Invite accept/decline errors hidden

Users have no way to know operations failed.

**Solution:** Add error states and UI feedback:

1. Create a toast/notification system or use a library like `react-hot-toast`
2. Add error state to components that perform mutations
3. Display error messages when operations fail

---

### 13. Accessibility Issues

**Problem:** Several accessibility concerns:

1. **Missing ARIA labels** - Icon buttons without accessible names
2. **No focus trapping** - Modals (CreateTripModal, TripShareModal) don't trap focus
3. **Escape key not handled** - Can't dismiss modals with keyboard
4. **Color-only differentiation** - Location types distinguished only by color

**Solution:**

1. Add `aria-label` to all icon buttons
2. Use a focus trap library (e.g., `@radix-ui/react-dialog` or `focus-trap-react`)
3. Add keyboard event handlers for Escape key in modals
4. Add icons or text patterns to distinguish location types beyond color

---

### 14. N+1 Query Problem - Attachment Counts

**Problem:** `LocationCard.tsx` queries attachment count individually for each card:

```typescript
const attachmentCount = useQuery(api.attachments.countByLocation, { locationId: location._id });
```

For a trip with 50 locations, this causes 50 separate queries.

**Solution:** Create a batch query:

```typescript
// In convex/attachments.ts
export const countByLocations = query({
  args: { locationIds: v.array(v.id("locations")) },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};
    for (const id of args.locationIds) {
      const count = await ctx.db
        .query("attachments")
        .withIndex("by_locationId", (q) => q.eq("locationId", id))
        .collect();
      counts[id] = count.length;
    }
    return counts;
  },
});
```

Query this once in LocationList and pass counts as props to LocationCard.

---

### 15. LocationList Queries Both Filtered and Unfiltered Data

**Problem:** `LocationList.tsx` runs two queries:
- `listByTrip` - all locations
- `listByTripAndDate` - filtered by date

Both always run, but only one result is used based on `selectedDate`.

**Solution:** Use conditional query arguments:

```typescript
const locations = useQuery(
  selectedDate ? api.locations.listByTripAndDate : api.locations.listByTrip,
  selectedDate ? { tripId, date: selectedDate } : { tripId }
);
```

Or better, create a single query that handles optional date filtering.

---

## Low Priority (Enhancements)

### 16. HTTP Route Security - CORS Too Permissive

**Problem:** `convex/http.ts:50` uses:
```typescript
"Access-Control-Allow-Origin": "*"
```

This allows any domain to make requests to the Foursquare proxy endpoint.

**Solution:** Restrict to your domain:
```typescript
"Access-Control-Allow-Origin": "https://your-domain.com"
```

Or read from environment variable for flexibility between environments.

---

### 17. Dark Mode Color Contrast Issue

**Problem:** In `src/index.css:74`:
```css
--surface-elevated: #1f2937
```

This is the same as `--surface-secondary`, making it difficult to distinguish elevated surfaces in dark mode.

**Solution:** Use a slightly lighter shade for elevated surfaces:
```css
--surface-elevated: #374151  /* gray-700 instead of gray-800 */
```

---

### 18. Password Visibility Toggle Missing

**Problem:** `LoginPage.tsx` password field has no show/hide toggle. Users can't verify what they're typing.

**Solution:** Add password visibility toggle:

```tsx
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    ...
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

---

### 19. CSS Variables Not Used in Tailwind Config

**Problem:** `src/index.css` defines CSS variables for theming, but components use hardcoded Tailwind colors like `bg-blue-600` instead of referencing the CSS variables.

**Solution:** Extend Tailwind config to use CSS variables:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
          elevated: 'var(--surface-elevated)',
        },
      },
    },
  },
}
```

Then use `bg-primary` instead of `bg-blue-600`.

---

### 20. Missing Rate Limiting on HTTP Routes

**Problem:** `convex/http.ts` proxies requests to Foursquare API without:
- Query parameter length validation
- Rate limiting
- Request timeout handling

Could be abused to make excessive API calls.

**Solution:**

1. Validate query parameter length
2. Implement rate limiting (per user/IP if possible)
3. Add timeout handling

```typescript
if (query.length > 200) {
  return new Response("Query too long", { status: 400 });
}
// Consider using Convex's rate limiting features
```

---

## Summary

| Priority | Count | Focus Area |
|----------|-------|------------|
| Critical | 4 | Runtime errors, data integrity |
| High | 5 | Code organization, type safety |
| Medium | 6 | Code quality, UX, performance |
| Low | 5 | Security hardening, polish |

**Recommended order of execution:**
1. Fix critical issues first (1-4)
2. Tackle high priority refactoring (5-9)
3. Address medium priority improvements (10-15)
4. Polish with low priority enhancements (16-20)

Each item is designed to be tackled independently in a single session.

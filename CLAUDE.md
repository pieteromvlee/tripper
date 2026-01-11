# Tripper - Project Guide for Claude

## Project Overview

Tripper is a trip planning application with interactive maps. Built with:

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Convex (serverless backend with real-time sync)
- **Auth:** @convex-dev/auth
- **Maps:** Mapbox GL + react-map-gl
- **Deployment:** Vercel

## Project Structure

```
src/
├── components/
│   ├── locations/    # Location cards, forms, lists, day selector
│   ├── map/          # TripMap, LocationMarker, MapView
│   └── trips/        # TripCard, TripList, CreateTripModal
├── pages/            # TripPage and other routes
├── hooks/            # Custom React hooks
└── lib/              # Utilities

convex/
├── _generated/       # Auto-generated Convex types (don't edit)
├── locations.ts      # Location CRUD operations
├── trips.ts          # Trip CRUD operations
└── auth.ts           # Authentication config
```

## Running the App

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npx convex dev       # Start Convex backend (run in separate terminal)
npm run build        # Production build
```

## Headless Browser Testing (Puppeteer)

Puppeteer is installed for automated UI testing and visual verification. Use it to:
- Take screenshots of the running app after making UI changes
- Verify visual changes without manual browser testing
- Automate login and navigation flows
- Check for console errors and debug rendering issues

### Prerequisites & Setup

- ✅ Puppeteer is already installed (no action needed)
- ✅ Test credentials are in `.env` file (already configured)
- ⚠️  Dev server must be running: `npm run dev` (localhost:5173)
- ⚠️  Convex backend must be running: `npx convex dev` (separate terminal)

### Quick Start - Visual Verification After Making Changes

**Fast verification** (recommended after UI changes):
```bash
npm run test:quick
```
Takes 3-4 screenshots: landing page, authenticated home, trip detail, final state.

**Full UI audit** (comprehensive testing):
```bash
npm run test:ui
```
Takes 8+ screenshots: all pages, modals, forms, and interactions.

**Screenshot locations:**
- Quick verify: `/tmp/tripper-verify/`
- Full audit: `/tmp/tripper-ui-audit/`

### Reading Screenshots with Claude

After running tests, use the Read tool to view screenshots:

```
Read tool with file_path: /tmp/tripper-verify/01-landing.png
Read tool with file_path: /tmp/tripper-verify/02-authenticated-home.png
```

This allows you to visually verify your UI changes without manual browser testing.

### Debugging with Headed Mode

To see the browser automation in action (useful for debugging):

```bash
PUPPETEER_HEADLESS=false npm run test:quick
```

This opens a visible browser window so you can watch the automation happen.

### Writing Custom Puppeteer Scripts

For custom testing scenarios, use the test helper utilities in `test-helpers.cjs`:

```javascript
const { loadEnv, login, takeScreenshot, setupBrowserLogging } = require('./test-helpers.cjs');
const puppeteer = require('puppeteer');

(async () => {
  const env = loadEnv();  // Load test credentials from .env
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Setup error logging
  setupBrowserLogging(page);

  // Navigate and login
  await page.goto('http://localhost:5173');
  await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);

  // Take screenshots
  await takeScreenshot(page, 'my-test', '/tmp');

  await browser.close();
})();
```

### Available Helper Functions

Located in `test-helpers.cjs`:

| Function | Purpose |
|----------|---------|
| `loadEnv()` | Load test credentials from `.env` file |
| `login(page, email, password)` | Handle login flow with proper waits |
| `takeScreenshot(page, name, dir)` | Take screenshot with error handling |
| `waitForAuth(page)` | Wait for authentication state to settle |
| `setupBrowserLogging(page)` | Capture console logs and errors |
| `clickAndWait(page, selector, time)` | Click element and wait |
| `waitForNetworkIdle(page, timeout)` | Wait for network requests to complete |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Connection refused" or "Navigation timeout" | Check dev server is running (`npm run dev`) |
| "Cannot find module" errors | Check Convex backend is running (`npx convex dev`) |
| Login fails | Verify credentials in `.env` file |
| Blank screenshots | Check console output for JavaScript errors |
| Script crashes | Check `page.on('error')` output in console |

### Example Claude Workflow

**After making UI changes:**

1. Ensure dev server and Convex backend are running
2. Run `npm run test:quick` to generate screenshots
3. Use Read tool to view `/tmp/tripper-verify/01-landing.png`, `02-authenticated-home.png`, etc.
4. Verify the changes appear correctly in screenshots
5. If issues found, check console output for errors
6. Fix issues and re-run until screenshots look correct

**For comprehensive testing:**

1. Run `npm run test:ui` for full audit
2. Review all 8+ screenshots in `/tmp/tripper-ui-audit/`
3. Verify all modals, forms, and interactions work correctly

## Convex Notes

- Always use `import type` for type-only imports from `convex/_generated/dataModel`
- The `_generated` folder is auto-generated by `npx convex dev`
- Convex functions are in `convex/*.ts` and exposed via `api` object

## Date/Time Handling - CRITICAL

**Philosophy:** Dates and times are **timezone-naive** (no timezone awareness). For trip planning, "13:00 on Jan 16" means exactly that, regardless of where you're viewing from. Nobody crosses timezones on short trips, and mental models of days/times should not shift based on viewer location.

### Storage Format

- All `dateTime` and `endDateTime` fields store ISO strings: `"YYYY-MM-DDTHH:mm"` (e.g., `"2026-01-16T13:00"`)
- No timezone suffix (no `Z`, no `+00:00`)
- Times use 24-hour format

### ⚠️ NEVER Use Date Object Conversions

**DO NOT** convert ISO strings through Date objects for parsing or formatting:

```typescript
// ❌ WRONG - Causes timezone conversion!
const date = new Date(isoString);
const dateStr = date.toISOString().split("T")[0];  // Shifts date!

// ❌ WRONG - Interprets time in UTC, shifts hours!
const date = new Date(isoString);
const hours = date.getHours();  // Wrong hours!

// ✅ CORRECT - Direct string slicing
const datePart = isoString.slice(0, 10);  // "2026-01-16"
const timePart = isoString.slice(11, 16);  // "13:00"
```

### Common Operations - Use Utilities

```typescript
import { getDatePart, getTimePart, formatDateString, combineDateTime } from './lib/dateUtils';

// ✅ Extract date from "2026-01-16T13:00"
const date = getDatePart(location.dateTime);  // "2026-01-16"

// ✅ Extract time from "2026-01-16T13:00"
const time = getTimePart(location.dateTime);  // "13:00"

// ✅ Format Date object for comparison
const today = new Date();
const todayStr = formatDateString(today);  // "2026-01-16"

// ✅ Combine date and time
const dateTime = combineDateTime("2026-01-16", "13:00");  // "2026-01-16T13:00"

// ❌ WRONG - Don't do these manually
const date = dateTime.slice(0, 10);  // Use getDatePart() instead
const time = dateTime.slice(11, 16);  // Use getTimePart() instead
const dateStr = new Date().toISOString().split("T")[0];  // Use getTodayDateString() instead
```

### Time Input Fields

- Use `<input type="text">` with `placeholder="HH:mm"` for 24-hour time input
- Do NOT use `<input type="time">` (displays AM/PM or 24-hour based on browser locale)

```tsx
// ✅ CORRECT - Always 24-hour format
<input
  type="text"
  placeholder="HH:mm"
  pattern="[0-2][0-9]:[0-5][0-9]"
  value={time}
  onChange={(e) => setTime(e.target.value)}
/>

// ❌ WRONG - May show AM/PM format
<input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
```

### Sorting

```typescript
// ✅ String comparison works for ISO format
locations.sort((a, b) => a.dateTime.localeCompare(b.dateTime));

// ❌ WRONG - Unnecessary Date conversion
locations.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
```

### Centralized Utilities

**ALL date/time operations should use functions from `src/lib/dateUtils.ts`:**

```typescript
import {
  getDatePart,           // Extract date from ISO string
  getTimePart,           // Extract time from ISO string
  formatDateString,      // Format Date object to YYYY-MM-DD
  getTodayDateString,    // Get today as YYYY-MM-DD
  parseISODate,          // Parse YYYY-MM-DD to Date object
  parseISODateTime,      // Parse YYYY-MM-DDTHH:mm to Date object
  combineDateTime,       // Combine date + time to ISO string
  formatDateTime,        // Display: "Fri, Jan 16, 13:00"
  formatTime,            // Display: "13:00"
  formatDateForDisplay,  // Display: "Fri, Jan 16"
} from '../../lib/dateUtils';
```

**DO NOT** duplicate date parsing logic inline. Always use these utilities.

### Why This Matters

Timezone conversion bugs cause:
- Events appearing on wrong days in calendar view
- Times shifting (13:00 becomes 03:00 or 23:00 depending on timezone)
- Confusion when users view from different timezones
- The mental model of "Friday at 1pm" not matching what's displayed

## Environment Variables

- `.env` - Test credentials for Puppeteer (gitignored)
- `.env.local` - Convex deployment URL and other secrets (gitignored)

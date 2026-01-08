# Tripper - Trip Planning Web App

## Overview
A mobile-optimized trip planning app for city trips with interactive maps, day-based views, and real-time collaboration.

## Tech Stack
- **Backend**: Convex (database, auth, real-time, file storage)
- **Frontend**: React + Vite + TypeScript
- **Maps**: Mapbox (maps + geocoding search)
- **Styling**: Tailwind CSS
- **Auth**: Google OAuth via Convex Auth

## Data Model (Convex Schema)

```
trips
├── name: string
├── ownerId: Id<users>
├── defaultLat/Lng/Zoom: optional (map center)
└── timestamps

tripMembers (many-to-many)
├── tripId: Id<trips>
├── userId: Id<users>
├── role: "owner" | "editor" | "viewer"
└── invitedBy, invitedAt

tripInvites (pending, by email)
├── tripId, email, role, expiresAt

locations
├── tripId: Id<trips>
├── name: string
├── latitude, longitude: number
├── dateTime: optional ISO string
├── endDateTime: optional (for hotels)
├── isHotel: boolean
├── attachmentId: optional Id<_storage>
├── attachmentName: optional string
├── notes: optional string
├── address: optional string
├── sortOrder: number
└── createdBy, timestamps
```

## Project Structure

```
tripper/
├── convex/
│   ├── schema.ts          # Database schema
│   ├── auth.ts            # Google OAuth config
│   ├── trips.ts           # Trip CRUD
│   ├── locations.ts       # Location CRUD
│   ├── invites.ts         # Invitation logic
│   └── storage.ts         # File uploads
├── src/
│   ├── components/
│   │   ├── auth/          # SignInButton
│   │   ├── layout/        # AppLayout, Header, MobileNav
│   │   ├── trips/         # TripList, TripCard, CreateTripModal
│   │   ├── locations/     # LocationList, LocationCard, LocationForm, DaySelector
│   │   ├── map/           # TripMap, LocationMarker, LocationSearch
│   │   └── shared/        # ViewToggle, FileUpload, DateTimePicker
│   ├── hooks/
│   │   ├── useMapSync.ts       # Bidirectional map-list sync
│   │   ├── useCurrentTime.ts   # Time awareness
│   │   └── useViewport.ts      # Mobile/desktop detection
│   ├── lib/
│   │   ├── mapbox.ts      # Geocoding API
│   │   └── export.ts      # Google/Apple Maps URLs
│   └── pages/
│       ├── index.tsx      # Trip list
│       └── trip/[id].tsx  # Trip detail
```

## Key Features

### Views
- **Mobile (<1024px)**: Full-screen list OR map, bottom nav
- **Desktop (>=1024px)**: Split view with list + map side-by-side
- Toggle between: List / Map / Both (desktop only for "both")

### Bidirectional Sync
- Tap list item → map flies to location
- Tap map marker → list scrolls to item
- Shared selection state via React Context

### Day-Based Filtering
- DaySelector shows dates with events
- Default to "today" on load
- Hotel locations span multiple days (via endDateTime)

### Time Awareness
- Current time indicator in timeline
- Auto-scroll to current/next event
- "Hotel" button jumps to current accommodation

### Location Creation
- Search via Mapbox Geocoding
- OR tap map to place pin
- Form: name (required), date/time, end date, notes, PDF attachment, isHotel

### External Maps Export
- "Get Directions" opens Google Maps or Apple Maps
- Deep link with coordinates and destination name

## Implementation Phases

### Phase 1: Setup & Auth
- [ ] Initialize Vite + React + TypeScript
- [ ] Set up Convex (`npx convex dev`)
- [ ] Configure Tailwind CSS
- [ ] Implement schema.ts with all tables
- [ ] Set up Convex Auth with Google OAuth
- [ ] Build login page and protected routes
- [ ] Create basic routing with react-router-dom

### Phase 2: Trip Management
- [ ] TripList and TripCard components
- [ ] CreateTripModal with name input
- [ ] Trip queries/mutations (create, list, get, update, delete)
- [ ] Trip detail page shell
- [ ] Trip settings (rename, delete)
- [ ] Invitation system (by email)

### Phase 3: Location Management
- [ ] LocationList and LocationCard components
- [ ] LocationForm (create/edit)
- [ ] Location queries/mutations
- [ ] Date/time picker integration
- [ ] Hotel flag and end date support
- [ ] DaySelector for date filtering

### Phase 4: Map Integration
- [ ] Set up Mapbox (react-map-gl)
- [ ] TripMap with markers
- [ ] LocationMarker with custom styling
- [ ] LocationPopup on click
- [ ] LocationSearch (Mapbox Geocoding)
- [ ] "Tap map to add" flow

### Phase 5: Sync & Timeline
- [ ] useMapSync hook for bidirectional sync
- [ ] Fly-to on list click
- [ ] Scroll-to on marker click
- [ ] TimelineView with visual timeline
- [ ] Current time indicator
- [ ] Auto-scroll to current event

### Phase 6: Attachments
- [ ] Convex file upload setup
- [ ] FileUpload component (PDF only)
- [ ] Attachment display in LocationCard
- [ ] Download/preview functionality

### Phase 7: Export & Polish
- [ ] Google/Apple Maps URL builders
- [ ] "Get Directions" per location
- [ ] Mobile responsiveness polish
- [ ] Touch targets and gestures
- [ ] Loading states and error handling

### Phase 8: PWA / Offline Support
- [ ] Add vite-plugin-pwa for service worker generation
- [ ] Configure manifest.json (icons, name, theme color)
- [ ] Cache static assets (JS, CSS, map tiles)
- [ ] Store last-viewed trip in localStorage for offline access
- [ ] Show "offline" indicator when disconnected
- [ ] Auto-sync changes when back online (Convex handles this)

## Verification Plan

1. **Auth Flow**: Sign in with Google, verify user created in Convex
2. **Trip CRUD**: Create trip, verify appears in list, edit name, delete
3. **Invitations**: Invite email, sign in as that user, verify access
4. **Locations**: Add location via search, verify on map; add via map tap
5. **Day Filter**: Add events on different days, switch days, verify filtering
6. **Map Sync**: Click list item → map flies; click marker → list scrolls
7. **Attachments**: Upload PDF, verify appears, download works
8. **Export**: Click "Get Directions", verify opens correct map app
9. **Mobile**: Test on phone, verify touch targets and full-screen views
10. **Desktop**: Test split view, verify both panels work together

## Environment Variables Needed

```bash
# Convex (auto-configured)
VITE_CONVEX_URL=

# Mapbox
VITE_MAPBOX_TOKEN=

# Google OAuth (set via `npx convex env set`)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
```

## Key Technical Decisions

1. **react-map-gl** over raw Mapbox GL JS for React-friendly controlled components
2. **ISO 8601 strings** for dates (human-readable, sortable, timezone-aware)
3. **React Context** for UI state (Convex handles server state)
4. **Separate tripMembers table** for clean role-based access control
5. **Mobile-first** development, enhance for desktop
6. **Vite SPA** (not Next.js) - Convex handles backend, no SSR needed

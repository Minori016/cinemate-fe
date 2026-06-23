# 🎬 CineStar - Movie Theater Management System: Frontend Design Document

## 1. Design Philosophy & Theme System
CineStar implements a dual-theme system depending on user roles and usage context to optimize user experience:
- **Customer Facing (Client App)**: Uses a premium, immersive **Dark Mode** theme. Highlights cinema aesthetics with glowing text, transparent glassmorphic containers, red accent highlights (`from-red-600 to-red-700`), and dark backdrops (`#06080F`, `#0c0d14`).
- **Management Portal (Admin & Staff Dashboard)**: Uses a clean, high-productivity **Light Mode** theme. Increases visibility and data readability with a light grey/blue backdrop (`#f8fafc`), white card borders, slate grey labels, and clean dark blue highlights for select active items (`bg-slate-900 text-white`).

### Color Palette Custom Variables (`theme.css`)
- `--color-primary`: Red accent (`#e50914` / `#dc2626`)
- `--color-surface`: Base surface (`#ffffff` in Light Mode, `#141414` in Dark Mode)
- `--color-surface-container`: Panel backgrounds (`#f3f4f6` in Light Mode, `#1a1a1a` in Dark Mode)
- `--color-border`: Container border grids (`#e5e7eb` in Light Mode, `#2a2a2a` in Dark Mode)
- `--color-text-muted`: Label gray colors (`#6b7280`)

---

## 2. Key UI Architectures & Components

### 2.1 Seat Layout Builder (`SeatLayoutBuilder.jsx`)
An interactive seat template editor allowing administrators to design cinema room seating plans dynamically.
- **Responsive Drawing Grid**: Renders standard, VIP, and couple seats using drag-to-draw mouse actions (mouse down + shift-key mouse move triggers brush style edits).
- **THX Sweet Spot Formula**: Implements a Gaussian scoring algorithm based on SMPTE and THX cinema standards:
  - *Distance Comfort*: Ideal row depth is computed at 66% from the screen (THX two-thirds recommendation).
  - *Angle Symmetry*: Center column represents the optimal viewing axis.
  - *Neck Strain Penalty*: The first 15% rows are penalized to prevent viewing angles $> 35^\circ$.
  - *Zone Highlighting*: Shows a live gold/blue heatmap overlay recommending VIP zones.
- **Contiguous Couple Seat Bindings**: Automatically binds seat numbers pairwise for couple seats (e.g. `G1-G2` or `G9-G10`), avoiding splits during grid updates.
- **Automatic Default Walkways**: Initializes 10-column room layouts with default empty walkway slots at columns 3 and 8, cleanly splitting seats into left, middle, and right blocks.

### 2.2 Reusable UI Library (`src/components/common/`)
- **Table Component**: Standardized data rendering with responsive columns mapping, action items, and hover transitions.
- **Modal Component**: Glassmorphic backdrop blurring and fade-in modal animations for form inputs.
- **Toast Notifications**: Slide-in status alert overlays with success checkmarks (`#10b981`) and warning icons (`#ef4444`).

---

## 3. Role-Based Access Control (RBAC) & Router
Defines role authorizations via `ProtectedRoute.jsx`:
- **Role Permissions Mapping**:
  - `MEMBER`: Accesses client booking flows, user settings, ticket histories.
  - `ADMIN`: Fully manages rooms, movies, showtimes, tickets, promotions, and employee databases.
  - `MANAGER` / `STAFF`: Accesses check-in logs, concession counters, shift schedules, and daily checkout trackers.
- **Router Layout Wrappers**: Nested routes wrap components in `AdminLayout.jsx`, `ManagerLayout.jsx`, or `StaffLayout.jsx` with shared sidebar navigations and user contexts.

---

## 4. API Service Layer & Mock Entity Fallbacks
Located in `src/services/` to interface with the Backend REST API. All services implement a transparent fallback to local storage databases (`localStorage`) to guarantee operational offline modes:
- **Authorization Service**: Introspects JWT signatures, extracting user roles (`ADMIN`/`MEMBER`), user email payloads, and login caches.
- **Cinema Room Service**: Coordinates HTTP fetches for rooms lists and updates seat coordinates. If offline, loads preset INITIAL_ROOMS mock arrays.

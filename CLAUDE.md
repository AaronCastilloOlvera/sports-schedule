# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

There are no tests in this project.

## Environment

The app requires a `VITE_API_HOST` env var pointing to the backend. Copy `.env.development` for local dev — it defaults to `http://127.0.0.1:8000`. Vite exposes only vars prefixed `VITE_`.

`VITE_POLLING_INTERVAL_MS` controls the fixture polling interval (defaults to 60 000 ms).

## Architecture

Single-page React 19 app (Vite + SWC) with MUI v6. The header shows sport tabs (Soccer / Basketball / Baseball / Football) but only Soccer is implemented — the other tabs are decorative.

### Data flow

`src/api/api.js` exports a singleton `apiClient` (class `ApiClient` wrapping axios). All components import this directly — there is no state management layer (no Redux/Zustand). API calls happen inside component `useEffect` / event handlers.

Fixtures are polled on an interval. The `Fixtures` component fetches **two days** (selected date + next day) to handle UTC/local timezone edge cases, then filters down to matches whose local date matches the selected date.

A custom DOM event `refresh-leagues` is dispatched by the Header's "Refresh Leagues" button (inside the settings popover) and listened to inside `Fixtures` to force-refresh fixture data via the cache endpoint (`fetchRefreshFixtures`).

### Component tree

```
App
└── AppContent                   (wraps MUI ThemeProvider — separate component so it can
    ├── Header                   consume ThemeModeContext before ThemeProvider mounts)
    └── FutbolDashboard          (tab + date/search state; tabs: Live | My Leagues | Control)
        ├── Fixtures             (fetching, polling, league filter chips)
        │   ├── FixturesDesktopView   (table layout; each row: Insights + ML-export buttons)
        │   │   └── MatchRow          (React.memo'd with areRowsEqual for perf)
        │   ├── FixtureMobileView     (card layout; responsive split at 600px)
        │   │   └── MatchMobileCard   (React.memo'd with areRowsEqual for perf)
        │   └── MatchDetailsModal    (H2H + recent matches; opened by Insights button)
        │       ├── MatchHeader      (hero banner with stadium bg, score, live status, events)
        │       ├── HeadToHead       (H2H tab: win-distribution bar, form guide, match list)
        │       └── RecentForm       (Recent tab: per-team recent matches with expandable stats)
        ├── Leagues              (favorite-league management: search, star toggle)
        └── Bets                 (betting ticket CRUD + profit chart)
            ├── TicketModal      (create/edit ticket dialog; supports clipboard image paste)
            └── FutbolCharts     (Recharts line chart of accumulated profit over time)
```

### Header

`src/components/layout/Header.jsx` — sticky AppBar with:
- Sport tabs (decorative, only Soccer is wired)
- Gear icon opens a settings **Popover** containing:
  - Language switcher (EN / ES)
  - API usage display (`Status` component — calls `fetchUsage`)
  - Dark mode toggle
  - "Refresh Leagues" button (dispatches `refresh-leagues` DOM event)

### API client (`src/api/api.js`)

All methods live on the `ApiClient` class. Key endpoints:

| Method | HTTP | Path |
|---|---|---|
| `fetchUsage()` | GET | `/status/usage` |
| `fetchLeagues()` | GET | `/leagues` |
| `fetchFavoriteLeagues()` | GET | `/leagues/favorite-leagues` |
| `updateLeague(id, isFavorite)` | PUT | `/leagues/update-league` |
| `fetchFixtures(date)` | GET | `/matches/by-date` |
| `fetchRefreshFixtures(date)` | POST | `/redis/refresh-fixtures-cache` |
| `fetchHeadToHeadMatches(id1, id2)` | GET | `/matches/headtohead` |
| `fetchRecentMatches(teamId)` | GET | `/teams/{id}/recent-matches` |
| `fetchMLExportH2H(homeId, awayId)` | GET | `/ml/export-h2h-json` (blob) |
| `fetchTickets()` | GET | `/bets/get-tickets` |
| `createTicket(formData)` | POST | `/bets/create-ticket` |
| `updateTicket(id, formData)` | PUT | `/bets/update-ticket` |
| `deleteTicket(id)` | DELETE | `/bets/delete-ticket` |
| `uploadTicketImage(id, formData)` | POST | `/bets/upload-ticket-image` |
| `fetchAnalyzeTicket(imageData)` | POST | `/bets/analyze-ticket` |

### Key patterns

- **Theme**: `ThemeModeContext` (`src/context/ThemeContext.jsx`) stores `light`/`dark` in `localStorage`. `App` must split `ThemeModeProvider` and `AppContent` because the ThemeProvider consumer must be mounted inside the provider.
- **i18n**: `i18next` with `es` as fallback language. Translation files live in `src/i18n/locales/{en,es}/translation.json`. Always add keys to both files when adding new UI strings.
- **Fixture status codes**: Match statuses (`1H`, `HT`, `2H`, `FT`, etc.) come from the API-Football API. Priority ordering for display is defined in `src/components/Futbol/Fixtures/consts.js` (`statusPriority` map: 1 = live, 2 = not started, 3 = finished).
- **Responsive layout**: MUI `useMediaQuery('(max-width:600px)')` drives the mobile/desktop fixture view split. Prefer MUI `sx` breakpoint props (`{ xs: ..., md: ... }`) for other responsive styling.
- **Render optimization**: `MatchRow` and `MatchMobileCard` are wrapped in `React.memo` with a custom `areRowsEqual` comparator (`src/utils/matchComparisons.js`) that only re-renders when score or status changes.
- **Live dot**: `FutbolDashboard` tracks `hasLiveMatches` state (set by `Fixtures` via `onLiveChange` prop) and renders a pulsing red dot on the "Live" tab label.

### Orphaned / unused files

These files exist in the repo but are not imported anywhere:

- `src/Sidebar.jsx` — also has a broken import path (`"./api"` instead of `"./api/api"`)
- `src/components/modals/FixtureDetailsModal/index.jsx` — superseded by `src/components/modals/MatchDetails/index.jsx`
- `src/components/Futbol/Fixtures/LiveMatchCard.jsx` — not used in the current `Fixtures` component

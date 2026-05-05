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

## Architecture

Single-page React 19 app (Vite + SWC) with MUI v6. Currently only the Soccer/Futbol section is implemented; Basketball/Baseball/Football tabs in the header are placeholders.

### Data flow

`src/api/api.js` exports a singleton `apiClient` (class `ApiClient` wrapping axios). All components import this directly — there is no state management layer (no Redux/Zustand). API calls happen inside component `useEffect` / event handlers.

Fixtures are polled on an interval controlled by `VITE_POLLING_INTERVAL_MS` (defaults to 60 000 ms). The Fixtures component fetches **two days** (selected date + next day) to handle UTC/local timezone edge cases, then filters down to matches whose local date matches the selected date.

A custom DOM event `refresh-leagues` is dispatched by the Header's "Refresh Leagues" button and listened to inside `Fixtures` to force-refresh fixture data from the cache endpoint.

### Component tree

```
App
└── AppContent              (wraps MUI ThemeProvider — separate component so it can
    ├── Header              consume ThemeModeContext before ThemeProvider mounts)
    └── FutbolDashboard     (tab + date/search state)
        ├── Fixtures        (fetching, polling, league filter chips)
        │   ├── FixturesDesktopView / FixtureMobileView  (responsive split at 600px)
        │   └── FixtureDetailsModal  (H2H + recent matches modal)
        │       ├── H2HMatchHeader
        │       ├── H2HMatchHistory
        │       └── RecentMatchHistory
        ├── Leagues         (favorite-league management)
        └── Bets            (betting ticket CRUD)
```

### Key patterns

- **Theme**: `ThemeModeContext` (`src/context/ThemeContext.jsx`) stores `light`/`dark` in `localStorage`. `App` must split `ThemeModeProvider` and `AppContent` because the ThemeProvider consumer must be mounted inside the provider.
- **i18n**: `i18next` with `es` as fallback language. Translation files live in `src/i18n/locales/{en,es}/translation.json`. Always add keys to both files when adding new UI strings.
- **Fixture status codes**: Match statuses (`1H`, `HT`, `2H`, `FT`, etc.) come from the API-Football API. Priority ordering for display is defined in `src/components/Futbol/Fixtures/consts.js`.
- **Responsive layout**: MUI `useMediaQuery('(max-width:600px)')` drives the mobile/desktop fixture view split. Prefer MUI `sx` breakpoint props (`{ xs: ..., md: ... }`) for other responsive styling.

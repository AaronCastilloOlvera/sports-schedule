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
        │       ├── MatchHeader      (hero banner: stadium bg, league context, score, live status, events flanking score)
        │       ├── HeadToHead       (H2H tab: win-distribution bar, form guide, match list)
        │       ├── RecentForm       (Recent tab: per-team recent matches with expandable stats)
        │       └── MatchOdds        (Odds tab: bet365/1xBet/Betano markets for the fixture)
        ├── Leagues              (favorite-league management: search, star toggle)
        └── Bets                 (betting ticket CRUD — 4 tabs: Log, Analytics, Bankroll, Rules)
            ├── TicketModal      (create/edit ticket dialog; supports clipboard image paste)
            ├── BetsAnalytics    (Recharts charts — receives tickets[] as prop, no separate fetch)
            ├── BankrollView     (deposit/withdrawal CRUD + $200K goal progress bar — receives tickets[] for P&L)
            └── BettingRules     (static motivational rules — edit the RULES array in the file directly)
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
| `fetchOdds(fixtureId)` | GET | `/odds/fixture/{id}` |
| `fetchMLExportH2H(homeId, awayId)` | GET | `/ml/export-h2h-json` (blob) |
| `fetchTickets()` | GET | `/bets/get-tickets` |
| `createTicket(formData)` | POST | `/bets/create-ticket` — returns full ticket object incl. `ticket_id` |
| `updateTicket(id, formData)` | PUT | `/bets/update-ticket` |
| `deleteTicket(id)` | DELETE | `/bets/delete-ticket` |
| `uploadTicketImage(id, formData)` | POST | `/bets/upload-ticket-image` |
| `fetchAnalyzeTicket(imageData)` | POST | `/bets/analyze-ticket` |
| `fetchTransactions()` | GET | `/bankroll/transactions` |
| `createTransaction(data)` | POST | `/bankroll/transactions` |
| `updateTransaction(id, data)` | PUT | `/bankroll/transactions/{id}` |
| `deleteTransaction(id)` | DELETE | `/bankroll/transactions/{id}` |

### Key patterns

- **Theme**: `ThemeModeContext` (`src/context/ThemeContext.jsx`) stores `light`/`dark` in `localStorage`. `App` must split `ThemeModeProvider` and `AppContent` because the ThemeProvider consumer must be mounted inside the provider.
- **i18n**: `i18next` with `es` as fallback language. Translation files live in `src/i18n/locales/{en,es}/translation.json`. Always add keys to both files when adding new UI strings. The `bets` namespace covers ticket CRUD toasts and the confirm-delete dialog.
- **Sport values**: The `sport` field uses lowercase snake_case (`futbol`, `basketball`, `american_football`, `baseball`) matching the backend enum. Never use display labels (`Soccer`, `Basketball`) as values.
- **Bets withdrawal goal**: The $200,000 target is hardcoded as `GOAL = 200000` in `BankrollView.jsx`. Change it there if needed.
- **BetsAnalytics / BankrollView**: Both receive `tickets[]` as a prop from `Bets.jsx` — they do not fetch independently. All chart data is derived via `useMemo` from this prop.
- **Fixture status codes**: Match statuses (`1H`, `HT`, `2H`, `FT`, etc.) come from the API-Football API. Priority ordering for display is defined in `src/components/Futbol/Fixtures/consts.js` (`statusPriority` map: 1 = live, 2 = not started, 3 = finished).
- **Responsive layout**: MUI `useMediaQuery('(max-width:600px)')` drives the mobile/desktop fixture view split. Prefer MUI `sx` breakpoint props (`{ xs: ..., md: ... }`) for other responsive styling.
- **Render optimization**: `MatchRow` and `MatchMobileCard` are wrapped in `React.memo` with a custom `areRowsEqual` comparator (`src/utils/matchComparisons.js`) that only re-renders when score or status changes.
- **Live dot**: `FutbolDashboard` tracks `hasLiveMatches` state (set by `Fixtures` via `onLiveChange` prop) and renders a pulsing red dot on the "Live" tab label.

## Possible improvements

| # | Area | Issue | Fix |
|---|---|---|---|
| 1 | ~~**Error boundaries**~~ | ✅ Done — `ErrorBoundary` wraps `MatchHeader` and tab content in `MatchDetailsModal` | |
| 2 | ~~**Orphaned files**~~ | ✅ Done — `Sidebar.jsx` and `LiveMatchCard.jsx` deleted | |
| 3 | ~~**State management**~~ | ✅ Done — React Query (`@tanstack/react-query`) wired in `main.jsx`; H2H, recent matches, and odds use `useQuery` in `MatchDetailsModal` | |
| 4 | ~~**Loading states**~~ | ✅ Done — `FixturesSkeleton` en carga inicial, `MatchDetailsSkeleton` en modal (header + WinBar + AggregateStats + filas H2H) | |
| 5 | **No tests** | Zero test coverage | Component tests for `MatchHeader`, `HeadToHead` with fixture mock data |
| 6 | **apiClient singleton** | Imported directly everywhere — untestable and hard to mock | Pass via context or use React Query's `queryFn` pattern |
| 7 | **i18n coverage** | New UI strings added without always updating both `en`/`es` files | Enforce with a lint rule or CI check that compares key sets |

---

## Future plans

### Feature: US sports leagues
The sport tabs (Basketball / Baseball / Football) are already stubbed in the UI — wire them up. NBA is the natural starting point: two teams, live score, recent form — closest to the existing soccer UX. Each sport will need its own fixture layout, status codes, and potentially different league management logic.

### Feature: Bet of the Day
A daily highlighted pick on the Bets tab — one match the model is most confident about, with the suggested market and the key reasons behind it (H2H edge, recent form, odds value). The pick is generated server-side so it's the same across sessions and resets at midnight.

### Feature: Self-evaluating predictions
After a match reaches `FT`, compare the pre-match prediction against the actual result and log the outcome. Over time this builds a real-world accuracy record (last 30 days, per league, per bet type) so model performance is measurable beyond training metrics — the model knows when it was right.

### Improvement: Audit React Query vs. Redis overlap
React Query already caches responses client-side with configurable `staleTime`. Some server-side Redis keys may be redundant if they're only consumed by this client and don't need cross-user sharing. Audit which keys could be dropped in favor of RQ's stale-while-revalidate strategy to reduce backend cache complexity.

### Improvement: Redis cache health indicator
Surface which Redis keys are currently warm for the selected date — either in the existing dev-tools panel or as an extension of `/status/usage`. Useful for diagnosing pipeline issues (e.g. "0 fixtures prewarmed") without needing to inspect Redis directly.

---

### State management

`@tanstack/react-query` is installed and wired via `QueryClientProvider` in `main.jsx`. Use `useQuery` for all API calls in components — it handles caching, loading, and error states. The `queryKey` is the cache identity: same key = instant result from cache without a new network request.

Current queries and their keys:
| queryKey | Data |
|---|---|
| `['h2h', team1Id, team2Id]` | Head-to-head matches |
| `['recent', teamId]` | Recent matches per team |
| `['odds', fixtureId]` | Fixture odds |

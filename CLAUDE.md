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

Single-page React 19 app (Vite + SWC) with MUI v6. The top-level nav (in `Header`) is **Home / My Leagues / Control** — sport-agnostic. Sport selection lives one level down, as filter chips inside the unified schedule (`Fixtures`), not as separate pages. Soccer and Baseball both have real data sources merged into one table; Basketball/Football chips are present but decorative (no data source yet).

### Data flow

`src/api/api.js` exports a singleton `apiClient` (class `ApiClient` wrapping axios). All components import this directly — there is no state management layer (no Redux/Zustand). API calls happen inside component `useEffect` / event handlers.

`Fixtures` is the unified schedule — it fetches soccer fixtures **and** baseball games (both LMB and MLB) unconditionally on every load/poll, regardless of which sport chips are active; the chips only filter what's *displayed*, so toggling a sport is instant instead of waiting on a request. Baseball games are reshaped by `src/utils/normalizeBaseball.js` into the exact same `{fixture, league, teams, goals}` shape soccer fixtures use, so both flow through the same `FixturesDesktopView`/`FixtureMobileView`/`MatchRow` — no sport-specific branching in those components. The one exception: baseball's "Insights" click opens `BoxscoreModal` instead of `MatchDetailsModal` (soccer's H2H/Stats/Odds modal doesn't apply — different data source, no backend support for it).

Soccer fixtures fetch **two days** (selected date + next day) to handle UTC/local timezone edge cases, then filter down to matches whose local date matches the selected date. Baseball fixture ids are stored as **negative numbers** in the combined list so they can never collide with a real (always-positive) API-Football fixture id — soccer's id doubles as a live API param (odds lookup) elsewhere, so it can't be the one that gets reshaped.

A custom DOM event `refresh-leagues` is dispatched by the Header's "Refresh Leagues" button (inside the settings popover) and listened to inside `Fixtures` to force-refresh fixture data via the cache endpoint (`fetchRefreshFixtures`).

### Component tree

```
App
└── AppContent                   (wraps MUI ThemeProvider — separate component so it can
    ├── Header                   consume ThemeModeContext before ThemeProvider mounts)
    │                            Top-level tabs: Home | My Leagues | Control — sport-agnostic,
    │                            no longer nested under a sport selector.
    ├── FutbolDashboard          ("Home" section — date/search filter bar + Fixtures. No
    │   └── Fixtures                 internal tabs anymore; this IS the schedule.)
    │       (sport filter chips: Soccer/Baseball toggle real data, Basketball/Football are
    │        decorative; league filter chips reflect whichever sports are active; 🌊 button
    │        opens SimultaneousChart — an hourly overlap "wave" of the currently filtered matches)
    │       ├── FixturesDesktopView   (table layout; each row: single "Insights" action button)
    │       │   └── MatchRow          (React.memo'd with areRowsEqual for perf; sport-agnostic)
    │       ├── FixtureMobileView     (card layout; responsive split at 600px)
    │       │   └── MatchMobileCard   (React.memo'd with areRowsEqual for perf; sport-agnostic)
    │       ├── MatchDetailsModal    (soccer only; opened by Insights button on a soccer row)
    │       │   ├── MatchHeader      (hero banner: stadium bg, league context, score, live status, events flanking score)
    │       │   ├── HeadToHead       (H2H tab: win-distribution bar, form guide, match list)
    │       │   ├── BettingStats     (Stats tab: H2H/local/visitante averages for Goals/Corners/Cards)
    │       │   ├── ValuePicksTab    (Value Picks tab: scans Bet365 odds for +EV picks priced 1.50–2.00
    │       │   │                     across Goals/Corners/Cards/BTTS/1X2/Double Chance/Handicap —
    │       │   │                     see useBettingStats.js)
    │       │   ├── RecentForm       (Recent tab: per-team recent matches with expandable stats)
    │       │   └── MatchOdds        (Odds tab: bet365/1xBet/Betano markets for the fixture)
    │       └── BoxscoreModal        (baseball only; opened by Insights button on a baseball row —
    │                                 pitching/batting tables, shared with the now-orphaned
    │                                 BaseballSchedule.jsx, see Possible improvements)
    ├── Leagues                  ("My Leagues" section — favorite-league management: search, star toggle)
    └── Bets                     ("Control" section — betting ticket CRUD — 4 tabs: Log, Analytics, Bankroll, Rules)
        ├── TicketModal          (create/edit ticket dialog; supports clipboard image paste)
        ├── BetsAnalytics        (Recharts charts — receives tickets[] as prop, no separate fetch;
        │                         7 tabs: General, By Sport, By League, By Bet Type, By Odds,
        │                         Studied, Timing — the last three are hit-rate/ROI/discipline
        │                         breakdowns, not just P&L)
        ├── BankrollView         (deposit/withdrawal CRUD + $200K goal progress bar — receives tickets[] for P&L)
        └── BettingRules         (static motivational rules — edit the RULES array in the file directly)
```

### Header

`src/components/layout/Header.jsx` — sticky AppBar with:
- Top-level tabs: **Home** (`activeSection`/`onSectionChange` props) | **My Leagues** | **Control**. No sport tabs here anymore — sport selection is inside `Fixtures` as filter chips.
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
| `fetchBaseballSchedule(date, league)` | GET | `/baseball/schedule` — `league` is `'lmb'` or `'mlb'`, fetched in parallel for the unified schedule |
| `fetchBaseballBoxscore(gamePk)` | GET | `/baseball/boxscore/{gamePk}` |
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
- **Fixture status codes**: Match statuses (`1H`, `HT`, `2H`, `FT`, etc.) come from the API-Football API. Priority ordering for display is defined in `src/components/Futbol/Fixtures/consts.js` (`statusPriority` map: 1 = live, 2 = not started, 3 = finished). Baseball games don't have these codes natively — `normalizeBaseball.js` maps MLB Stats API's `abstractGameState`/`detailedState` onto the closest soccer code (`'1H'` for live, `'NS'` for scheduled, `'FT'` for final, and a synthetic `'SUSP'` for suspended games, since MLB's API leaves a suspended game's `abstractGameState` as `"Live"` indefinitely — sometimes for weeks — until it's officially resumed or cancelled).
- **Responsive layout**: MUI `useMediaQuery('(max-width:600px)')` drives the mobile/desktop fixture view split. Prefer MUI `sx` breakpoint props (`{ xs: ..., md: ... }`) for other responsive styling.
- **Render optimization**: `MatchRow` and `MatchMobileCard` are wrapped in `React.memo` with a custom `areRowsEqual` comparator (`src/utils/matchComparisons.js`) that only re-renders when score or status changes.
- **Live dot**: `Fixtures` computes `liveBySport` per sport and renders a pulsing red dot directly on the relevant sport chip (Soccer/Baseball) when that sport has a live match — not a single global indicator, and not tied to a "Live" tab (that tab no longer exists).
- **Baseball team/league logos**: fetched from `https://www.mlbstatic.com/team-logos/{id}.svg` — this CDN serves real logos for **both** MLB and LMB team ids (verified against all 20 LMB teams on a live schedule), not just the 30 MLB franchises. Don't reintroduce a league-based branch here. League badges (`/logos/mlb.webp`, `/logos/lmb.webp`) are local static files in `public/logos/` since there's no equivalent single-logo CDN endpoint for the leagues themselves. A team with no logo at all falls back to a generated colored-initials SVG (`data:image/svg+xml;base64,...` — must be base64, the `;utf8,`+`encodeURIComponent` variant renders inconsistently across browsers).

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
| 8 | **Orphaned file** | `src/components/Baseball/BaseballSchedule.jsx` (the old standalone per-sport baseball page) is no longer imported anywhere — superseded by baseball games being merged into the unified `Fixtures` schedule. Its reusable pieces (`BoxscoreModal.jsx`, `baseballHelpers.js`) were already extracted out and are still used. | Delete the file, or repurpose it if a dedicated baseball-only view is wanted later |

---

## Future plans

### Feature: US sports leagues
Baseball is done — LMB + MLB schedules are merged into the unified `Fixtures` view via `normalizeBaseball.js`, with their own `BoxscoreModal` for detail (no H2H/Stats/Odds analysis yet, unlike soccer). Basketball and Football sport chips are still decorative (no data source). NBA is the natural next pick: two teams, live score, recent form — closest to the existing soccer/baseball UX. Each new sport needs its own normalizer into the shared fixture shape (see `normalizeBaseball.js` for the pattern) plus its own detail modal if the existing ones don't fit.

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

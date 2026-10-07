// Shared ESPN-shaped helpers — used by normalizeBaseball.js, BaseballSchedule.jsx
// and BoxscoreModal.jsx. `game` here is always a raw ESPN scoreboard event
// (events[].competitions[0]...), the same shape NFL/NBA already use, just with
// baseball-specific fields (status.type.shortDetail already reads like
// "Top 6th", linescores carry hits/errors, competitors carry `probables`).

export const TZ = 'America/Mexico_City';

export const fmtTime = (utcStr) =>
  new Date(utcStr).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: true,
  });

export const getCompetition   = (game) => game?.competitions?.[0] ?? {};
export const getCompetitors   = (game) => getCompetition(game).competitors ?? [];
export const getHomeCompetitor = (game) => getCompetitors(game).find((c) => c.homeAway === 'home') ?? {};
export const getAwayCompetitor = (game) => getCompetitors(game).find((c) => c.homeAway === 'away') ?? {};

const statusType = (game) => getCompetition(game).status?.type ?? {};
export const isFinal     = (game) => statusType(game).completed === true;
export const isLive      = (game) => statusType(game).state === 'in';
export const isPostponed = (game) => statusType(game).name === 'STATUS_POSTPONED';
export const isCanceled  = (game) => statusType(game).name === 'STATUS_CANCELED';
export const isWinner    = (competitor) => competitor?.winner === true;

// ESPN already formats this as "Top 6th" / "Bottom 9th" — no half+number
// reconstruction needed, unlike MLB Stats API's separate fields.
export const inningDetail = (game) => statusType(game).shortDetail || '';
export const outsLabel    = (game) => getCompetition(game).outsText || '';

export const teamOverallRecord = (competitor) =>
  (competitor?.records ?? []).find((r) => r.type === 'total')?.summary;

const AVATAR_COLORS = [
  '#1565c0', '#2e7d32', '#b71c1c', '#e65100', '#6a1b9a',
  '#00695c', '#ad1457', '#4527a0', '#37474f', '#558b2f',
];
export const teamColor = (id) => AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length];
export const teamInitials = (name = '') => {
  const words = name.split(' ').filter(Boolean);
  // Use last meaningful word (e.g. "Cleveland Guardians" → "GUA")
  return words[words.length - 1]?.substring(0, 3).toUpperCase() ?? '?';
};

// Same CDN family as NFL/NBA's team logos — keyed by lowercase abbreviation,
// not by a stats-provider numeric id.
export const teamLogoUrl = (abbr) =>
  (abbr ? `https://a.espncdn.com/i/teamlogos/mlb/500/${abbr.toLowerCase()}.png` : undefined);

// Public headshot CDN, same "no API key" pattern as team logos (confirmed via
// probables[].athlete.headshot on the live scoreboard). Not every id has a
// photo — 404s should fall back to a generic avatar wherever this is used.
export const playerHeadshotUrl = (id) =>
  (id ? `https://a.espncdn.com/i/headshots/mlb/players/full/${id}.png` : undefined);

// ─────────────────────────────────────────────────────────────────────────
// Pitcher game-log aggregation — consumes the backend's own synthesized
// "gamelog" contract from /baseball/pitcher-gamelog (opponent/isHome/stat per
// start). This is a backend-built abstraction independent of the underlying
// data source (MLB Stats API or ESPN), so its shape doesn't change with the
// ESPN migration — only the `league` param going away does.
// ─────────────────────────────────────────────────────────────────────────

// MLB's "IP" string is base-3, not decimal — "4.2" means 4 and 2/3 innings
// (2 outs into the 5th), not 4.2 innings. Convert to outs to do real math on it.
const ipToOuts = (ipStr) => {
  const [whole, thirds] = String(ipStr ?? '0.0').split('.');
  return (parseInt(whole, 10) || 0) * 3 + (parseInt(thirds, 10) || 0);
};
const outsToIp = (outs) => `${Math.floor(outs / 3)}.${outs % 3}`;

// Filters a pitcher's gameLog splits down to starts against one opponent,
// optionally narrowed to home-only (`isHome: true`) or away-only (`false`).
// Pass `isHome: undefined` (default) to keep both.
export function filterGamesVsOpponent(splits, opponentId, isHome) {
  return (splits ?? []).filter((s) => {
    if (s.opponent?.id !== opponentId) return false;
    if (isHome === true && !s.isHome) return false;
    if (isHome === false && s.isHome) return false;
    return true;
  });
}

// Aggregates a list of gameLog splits (already filtered) into one summary —
// used to answer "how has this pitcher done in these starts" without the
// caller needing to know MLB's base-3 IP notation.
export function aggregateGames(games) {
  if (!games?.length) return null;

  let outs = 0, earnedRuns = 0, strikeOuts = 0, baseOnBalls = 0, hits = 0;
  games.forEach(({ stat = {} }) => {
    outs += ipToOuts(stat.inningsPitched);
    earnedRuns += stat.earnedRuns ?? 0;
    strikeOuts += stat.strikeOuts ?? 0;
    baseOnBalls += stat.baseOnBalls ?? 0;
    hits += stat.hits ?? 0;
  });
  const ip = outs / 3;

  return {
    starts: games.length,
    ip: outsToIp(outs),
    era: ip > 0 ? (earnedRuns * 9 / ip).toFixed(2) : '—',
    strikeOuts,
    baseOnBalls,
    hits,
    games,
  };
}

// Convenience composition for the existing "vs this opponent" inline summary
// (current-season-only, both home and away).
export function aggregatePitcherVsOpponent(splits, opponentId) {
  return aggregateGames(filterGamesVsOpponent(splits, opponentId));
}

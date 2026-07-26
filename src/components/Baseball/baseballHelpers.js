// Shared MLB Stats API helpers — used by BaseballSchedule.jsx, BoxscoreModal.jsx,
// and the fixture-normalizer that feeds baseball games into the unified schedule.

export const TZ = 'America/Mexico_City';

export const fmtTime = (utcStr) =>
  new Date(utcStr).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: true,
  });

export const inningLabel = (half, num) => {
  if (!num) return '';
  const halves = { Top: 'Alta', Bottom: 'Baja' };
  return `${halves[half] ?? half} ${num}°`;
};

export const outsLabel = (outs) => (outs != null ? `${outs} out${outs !== 1 ? 's' : ''}` : '');

// MLB Stats API keeps a "Suspended" game's abstractGameState as "Live" forever,
// even weeks after it stopped — it's not actually in progress, so it needs its
// own bucket instead of showing a pulsing "EN VIVO" badge for a dead game.
export const isSuspended = (g) => g?.status?.detailedState === 'Suspended';
export const isWarmup = (g) => g?.status?.detailedState === 'Warmup';
export const isLive   = (g) => g?.status?.abstractGameState === 'Live' && !isSuspended(g) && !isWarmup(g);
export const isFinal  = (g) => g?.status?.abstractGameState === 'Final';
export const isWinner = (side) => side?.isWinner === true;

const AVATAR_COLORS = [
  '#1565c0','#2e7d32','#b71c1c','#e65100','#6a1b9a',
  '#00695c','#ad1457','#4527a0','#37474f','#558b2f',
];
export const teamColor    = (id) => AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
// LMB teams have real logos at this CDN path too, not just MLB franchises.
export const teamLogoUrl  = (id) => (id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : undefined);
export const teamInitials = (name = '') => {
  const words = name.split(' ').filter(Boolean);
  // Use last meaningful word (e.g. "Diablos Rojos del Mexico" → "MEX")
  return words[words.length - 1]?.substring(0, 3).toUpperCase() ?? '?';
};

// Public headshot CDN, same "no API key" pattern as team logos. Not every
// person id has a photo (prospects/rare LMB-only players) — 404s should fall
// back to a generic avatar wherever this is used.
export const playerHeadshotUrl = (id) =>
  (id ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_180,q_100/v1/people/${id}/headshot/67/current.png` : undefined);

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

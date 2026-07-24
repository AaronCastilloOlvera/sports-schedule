// Reshapes MLB Stats API game objects into the same shape soccer fixtures use
// (fixture/league/teams/goals), so baseball games can flow through the exact
// same table/card rendering, sorting, and status-chip components as soccer —
// no changes needed to FixturesDesktopView/FixtureMobileView/MatchRow.
import { isSuspended, isLive, isFinal, inningLabel, outsLabel, teamLogoUrl } from '../components/Baseball/baseballHelpers';

const AVATAR_COLORS = [
  '#1565c0', '#2e7d32', '#b71c1c', '#e65100', '#6a1b9a',
  '#00695c', '#ad1457', '#4527a0', '#37474f', '#558b2f',
];

const initials = (name = '') => {
  const words = name.split(' ').filter(Boolean);
  return words[words.length - 1]?.substring(0, 3).toUpperCase() ?? '?';
};

// Turns out the MLB Stats API CDN also serves real logos for LMB team ids
// (verified against all 20 LMB teams on today's schedule) — no need to special
// case it by league. Only missing/unknown ids fall back to a generated avatar.
function fallbackLogo(id, name) {
  const color = AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
  const text = initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="20" fill="${color}"/><text x="50%" y="54%" font-size="15" fill="white" font-family="sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  // base64, not `;utf8,` + encodeURIComponent — the latter is inconsistently
  // supported as an <img src> data URI across browsers.
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

const teamLogo = (id, name) => teamLogoUrl(id) ?? fallbackLogo(id, name);

// Only bucket-classification matters here (statusPriority reads this) — the
// exact soccer code is never shown for baseball rows except as a fallback text.
function shortStatusFor(game) {
  if (isSuspended(game)) return 'SUSP';
  if (isLive(game)) return '1H';
  if (isFinal(game)) return 'FT';
  return 'NS';
}

function liveElapsedLabel(game) {
  const ls = game.linescore ?? {};
  const label = inningLabel(ls.inningHalf, ls.currentInning) || 'En vivo';
  return ls.outs != null ? `${label} · ${outsLabel(ls.outs)}` : label;
}

export function normalizeBaseballGame(game, league) {
  const shortStatus = shortStatusFor(game);
  const home = game.teams?.home ?? {};
  const away = game.teams?.away ?? {};
  const homeId = home.team?.id;
  const awayId = away.team?.id;

  return {
    sport: 'baseball',
    raw: game,
    fixture: {
      // Negative so it can never collide with a real (always-positive) API-Football
      // fixture id in the same combined list — soccer's id doubles as a live API
      // param (odds lookup) elsewhere, so it can't be the one that gets reshaped.
      id: -game.gamePk,
      date: game.gameDate,
      venue: { name: game.venue?.name ?? '' },
      status: {
        short: shortStatus,
        elapsed: shortStatus === 'NS' ? null : (shortStatus === '1H' ? liveElapsedLabel(game) : shortStatus),
        extra: null,
      },
    },
    league: { id: league, logo: `/logos/${league}.webp`, name: league === 'mlb' ? 'MLB' : 'LMB' },
    teams: {
      home: { id: homeId, name: home.team?.name ?? '—', logo: teamLogo(homeId, home.team?.name) },
      away: { id: awayId, name: away.team?.name ?? '—', logo: teamLogo(awayId, away.team?.name) },
    },
    goals: { home: home.score ?? null, away: away.score ?? null },
  };
}

export function normalizeBaseballGames(games, league) {
  return (games ?? []).map(g => normalizeBaseballGame(g, league));
}

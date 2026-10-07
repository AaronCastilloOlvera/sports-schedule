// Reshapes ESPN baseball scoreboard events into the same shape soccer fixtures
// use (fixture/league/teams/goals), so baseball games can flow through the
// exact same table/card rendering, sorting, and status-chip components as
// soccer and the other ESPN-sourced sports (NFL/NBA) — no changes needed to
// FixturesDesktopView/FixtureMobileView/MatchRow. MLB only now — LMB has no
// ESPN coverage and was dropped entirely.
import {
  getHomeCompetitor, getAwayCompetitor, getCompetition,
  isFinal, isLive, isPostponed, isCanceled, inningDetail, outsLabel, teamLogoUrl,
} from '../components/Baseball/baseballHelpers';

function shortStatusFor(game) {
  if (isFinal(game)) return 'FT';
  if (isPostponed(game)) return 'PST';
  if (isCanceled(game)) return 'CANC';
  if (!isLive(game)) return 'NS';
  return 'LIVE';
}

function liveElapsedLabel(game) {
  const detail = inningDetail(game);
  const outs = outsLabel(game);
  if (detail && outs) return `${detail} · ${outs}`;
  return detail || 'En vivo';
}

export function normalizeBaseballGame(game) {
  const shortStatus = shortStatusFor(game);
  const home = getHomeCompetitor(game);
  const away = getAwayCompetitor(game);

  return {
    sport: 'baseball',
    raw: game,
    fixture: {
      // Negative so it can never collide with a real (always-positive) API-Football
      // fixture id in the same combined list — same convention as NFL/NBA.
      id: -Number(game.id),
      date: game.date,
      venue: { name: getCompetition(game).venue?.fullName ?? '' },
      status: {
        short: shortStatus,
        elapsed: shortStatus === 'LIVE' ? liveElapsedLabel(game) : shortStatus,
        extra: null,
      },
    },
    league: { id: 'mlb', logo: '/logos/mlb.webp', name: 'MLB' },
    teams: {
      home: {
        id: home.team?.id,
        name: home.team?.displayName ?? '—',
        logo: teamLogoUrl(home.team?.abbreviation),
      },
      away: {
        id: away.team?.id,
        name: away.team?.displayName ?? '—',
        logo: teamLogoUrl(away.team?.abbreviation),
      },
    },
    goals: shortStatus === 'NS'
      ? { home: null, away: null }
      : { home: home.score != null ? Number(home.score) : null, away: away.score != null ? Number(away.score) : null },
  };
}

export function normalizeBaseballGames(games) {
  return (games ?? []).map(normalizeBaseballGame);
}

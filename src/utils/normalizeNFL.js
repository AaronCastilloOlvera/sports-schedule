// Reshapes NFL Radar's schedule objects into the shape soccer fixtures use —
// same trick as normalizeBaseball.js, so NFL flows through the existing UI.

const teamLogo = (abbr) => (abbr ? `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png` : null);

function shortStatusFor(game) {
  if (game.completed) return 'FT';
  if (game.state === 'STATUS_POSTPONED') return 'PST';
  if (game.state === 'STATUS_CANCELED') return 'CANC';
  if (game.state === 'STATUS_SCHEDULED') return 'NS';
  return 'LIVE';
}

function liveElapsedLabel(game) {
  if (game.state === 'STATUS_HALFTIME') return 'Medio tiempo';
  if (game.period == null) return 'En vivo';
  const q = game.period > 4 ? `OT${game.period - 4 > 1 ? game.period - 4 : ''}` : `Q${game.period}`;
  return game.display_clock ? `${q} ${game.display_clock}` : q;
}

export function normalizeNFLGame(game) {
  const shortStatus = shortStatusFor(game);
  const home = game.home ?? {};
  const away = game.away ?? {};

  return {
    sport: 'nfl',
    raw: game,
    fixture: {
      id: -Number(game.event_id), // negative, like baseball's ids — avoids collisions
      date: game.game_date,
      venue: { name: game.venue ?? '' },
      status: {
        short: shortStatus,
        elapsed: shortStatus === 'LIVE' ? liveElapsedLabel(game) : shortStatus,
        extra: null,
      },
    },
    league: { id: 'nfl', logo: '/logos/nfl.webp', name: 'NFL' },
    teams: {
      home: { id: home.id, name: home.name ?? '—', logo: teamLogo(home.abbr) },
      away: { id: away.id, name: away.name ?? '—', logo: teamLogo(away.abbr) },
    },
    goals: shortStatus === 'NS'
      ? { home: null, away: null }
      : { home: home.score ?? null, away: away.score ?? null },
  };
}

export function normalizeNFLGames(games) {
  return (games ?? []).map(normalizeNFLGame);
}

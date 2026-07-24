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
export const isLive   = (g) => g?.status?.abstractGameState === 'Live' && !isSuspended(g);
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

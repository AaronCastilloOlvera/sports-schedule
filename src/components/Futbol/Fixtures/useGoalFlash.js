import { useEffect, useRef, useState } from 'react';
import { keyframes } from '@mui/system';

// Shared by the desktop table and the mobile card so both flash identically.
export const goalFlash = keyframes`
  0% { background-color: transparent; transform: scale(1); }
  10% { background-color: rgba(255, 215, 0, 0.8); transform: scale(1.15); font-weight: 900; color: #d32f2f; }
  50% { background-color: rgba(255, 215, 0, 0.3); transform: scale(1.05); color: inherit; }
  100% { background-color: transparent; transform: scale(1); font-weight: bold; }
`;

// Tracks home/away goal increases between polls and returns which side just
// scored ('home' | 'away' | null) for ~3s. Reads only `goals.home`/`goals.away`,
// which every sport normalizer (soccer, normalizeBaseball, normalizeNFL) fills
// in the same shape, so this works across sports with no extra branching.
export function useGoalFlash(homeGoals, awayGoals) {
  const prevHome = useRef(homeGoals);
  const prevAway = useRef(awayGoals);
  const [goalEvent, setGoalEvent] = useState(null);

  useEffect(() => {
    let timeoutId;

    if (homeGoals !== null && prevHome.current !== null && homeGoals > prevHome.current) {
      setGoalEvent('home');
      timeoutId = setTimeout(() => setGoalEvent(null), 3000);
    } else if (awayGoals !== null && prevAway.current !== null && awayGoals > prevAway.current) {
      setGoalEvent('away');
      timeoutId = setTimeout(() => setGoalEvent(null), 3000);
    }

    prevHome.current = homeGoals;
    prevAway.current = awayGoals;

    return () => clearTimeout(timeoutId);
  }, [homeGoals, awayGoals]);

  return goalEvent;
}

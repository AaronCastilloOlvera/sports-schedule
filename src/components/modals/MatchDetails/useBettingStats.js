import { useMemo } from 'react';

// ── data helpers ────────────────────────────────────────────────────────────

const getStat = (match, teamId, type) => {
  const ts = match.statistics?.find(s => s.team?.id === teamId);
  return ts?.statistics?.find(s => s.type === type)?.value ?? null;
};

const getTotalStat = (match, type) => {
  if (!match.statistics?.length) return null;
  let total = 0, found = false;
  for (const ts of match.statistics) {
    const v = ts.statistics?.find(s => s.type === type)?.value;
    if (typeof v === 'number') { total += v; found = true; }
  }
  return found ? total : null;
};

const teamGoals = (match, teamId) => {
  if (match.teams?.home?.id === teamId) return match.goals?.home ?? null;
  if (match.teams?.away?.id === teamId) return match.goals?.away ?? null;
  return null;
};

// only keep matches where teamId played on the given side (home/away)
const byVenue = (matches, teamId, venue) =>
  (matches ?? []).filter(m => m.teams?.[venue]?.id === teamId);

const avg = (arr) => {
  const valid = arr.filter(v => v !== null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

// median instead of mean — 1-2 blowout matches (25 corners, etc.) drag the mean
// above most of the sample, which biases the line and skews the "Over" hit-rate
// away from 50%. Median sits at the actual middle of the data, so it doesn't.
const median = (arr) => {
  const valid = arr.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
  if (!valid.length) return null;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
};

export const fmt = (v) => (v !== null && !isNaN(v) ? Number(v).toFixed(1) : '—');

// sportsbook-style line derived from the H2H median, so it adapts per matchup
// instead of using one hardcoded number for every league/stat
const lineFromMedian = (medianVal) => (medianVal !== null ? Math.floor(medianVal) + 0.5 : null);

const rateOver = (arr, line) => {
  const valid = arr.filter(v => v !== null && !isNaN(v));
  if (!valid.length || line === null) return null;
  return Math.round(valid.filter(v => v > line).length / valid.length * 100);
};

// ── odds / value helpers ─────────────────────────────────────────────────────

// bet.values looks like [{ value: 'Over 2.5', odd: '1.80' }, { value: 'Under 2.5', odd: '2.00' }, ...]
// group into { 2.5: { over: 1.80, under: 2.00 }, ... }
const parseOverUnderLines = (bet) => {
  const lines = {};
  for (const v of bet.values ?? []) {
    const m = /^(Over|Under)\s+([\d.]+)$/.exec(v.value ?? '');
    if (!m) continue;
    const line = parseFloat(m[2]);
    const odd  = parseFloat(v.odd);
    if (isNaN(line) || isNaN(odd)) continue;
    lines[line] = { ...(lines[line] ?? {}), [m[1].toLowerCase()]: odd };
  }
  return lines;
};

// de-vigged implied probability of "Over" (removes the bookmaker's margin so the
// two sides of the market sum to 100%, instead of the ~105-110% they actually sum to)
const noVigProbPct = (overOdd, underOdd) => {
  const pOver = 1 / overOdd, pUnder = 1 / underOdd;
  const total = pOver + pUnder;
  return total > 0 ? Math.round((pOver / total) * 100) : null;
};

// only surface picks in this odd range — "considerable risk, nada raro":
// no heavy favorites (odd < 1.50) and no longshots (odd > 2.00)
export const MIN_ODD = 1.5;
export const MAX_ODD = 2.0;

// scans Goals/Corners/Cards Over-Under, Both Teams Score, Match Winner, Double
// Chance and Asian Handicap across every bookmaker and every line offered, and
// keeps only the selections priced within [MIN_ODD, MAX_ODD] that show edge.
const scanValuePicks = ({ bookmakers, teamHome, teamAway, h2hGoalArr, h2hCornerArr, h2hYellowArr, bothScoreRate, marginArr, pHome, pDraw, pAway }) => {
  const picks = [];
  const homeName = teamHome?.name ?? 'Home';
  const awayName = teamAway?.name ?? 'Away';

  const addOU = (market, side, odd, bookmaker, ourRate, impliedPct, line) => {
    if (isNaN(odd) || odd < MIN_ODD || odd > MAX_ODD || ourRate === null || impliedPct === null) return;
    picks.push({ market, selection: `${side} ${fmt(line)}`, odd, bookmaker, ourRate, impliedPct, edge: ourRate - impliedPct });
  };

  // Goals / Corners / Cards — every line, both sides
  [
    { name: 'Goals Over/Under', label: 'Goals', arr: h2hGoalArr },
    { name: 'Corners Over Under', label: 'Corners', arr: h2hCornerArr },
    { name: 'Yellow Over/Under', label: 'Cards', arr: h2hYellowArr },
  ].forEach(({ name, label, arr }) => {
    for (const bm of bookmakers) {
      const bet = bm.bets?.find(b => b.name === name);
      if (!bet) continue;
      for (const [lineStr, pair] of Object.entries(parseOverUnderLines(bet))) {
        if (pair.over == null || pair.under == null) continue;
        const line = parseFloat(lineStr);
        const ourOverRate = rateOver(arr, line);
        const impliedOverPct = noVigProbPct(pair.over, pair.under);
        if (ourOverRate === null || impliedOverPct === null) continue;
        addOU(label, 'Over',  pair.over,  bm.name, ourOverRate,       impliedOverPct,       line);
        addOU(label, 'Under', pair.under, bm.name, 100 - ourOverRate, 100 - impliedOverPct, line);
      }
    }
  });

  // Both Teams Score
  if (bothScoreRate !== null) {
    for (const bm of bookmakers) {
      const bet = bm.bets?.find(b => b.name === 'Both Teams Score');
      const yes = bet?.values?.find(v => v.value === 'Yes');
      const no  = bet?.values?.find(v => v.value === 'No');
      if (!yes || !no) continue;
      const yesOdd = parseFloat(yes.odd), noOdd = parseFloat(no.odd);
      const impliedYesPct = noVigProbPct(yesOdd, noOdd);
      if (impliedYesPct === null) continue;
      if (yesOdd >= MIN_ODD && yesOdd <= MAX_ODD) {
        picks.push({ market: 'BTTS', selection: 'Yes', odd: yesOdd, bookmaker: bm.name, ourRate: bothScoreRate, impliedPct: impliedYesPct, edge: bothScoreRate - impliedYesPct });
      }
      if (noOdd >= MIN_ODD && noOdd <= MAX_ODD) {
        const ourNoRate = 100 - bothScoreRate;
        picks.push({ market: 'BTTS', selection: 'No', odd: noOdd, bookmaker: bm.name, ourRate: ourNoRate, impliedPct: 100 - impliedYesPct, edge: ourNoRate - (100 - impliedYesPct) });
      }
    }
  }

  // Match Winner (3-way de-vig) + Double Chance derived from the same de-vig
  for (const bm of bookmakers) {
    const mwBet = bm.bets?.find(b => b.name === 'Match Winner');
    const home = mwBet?.values?.find(v => v.value === 'Home');
    const draw = mwBet?.values?.find(v => v.value === 'Draw');
    const away = mwBet?.values?.find(v => v.value === 'Away');
    if (!home || !draw || !away) continue;

    const oH = parseFloat(home.odd), oD = parseFloat(draw.odd), oA = parseFloat(away.odd);
    const rawH = 1 / oH, rawD = 1 / oD, rawA = 1 / oA;
    const total = rawH + rawD + rawA;
    if (!total) continue;
    const impH = (rawH / total) * 100, impD = (rawD / total) * 100, impA = (rawA / total) * 100;

    const add1x2 = (selection, odd, ourRate, impliedPct) => {
      if (odd < MIN_ODD || odd > MAX_ODD) return;
      const rOurRate = Math.round(ourRate), rImplied = Math.round(impliedPct);
      picks.push({ market: '1X2', selection, odd, bookmaker: bm.name, ourRate: rOurRate, impliedPct: rImplied, edge: rOurRate - rImplied });
    };
    add1x2(homeName, oH, pHome, impH);
    add1x2('Draw', oD, pDraw, impD);
    add1x2(awayName, oA, pAway, impA);

    const dcBet = bm.bets?.find(b => b.name === 'Double Chance');
    if (dcBet) {
      const dc = (label) => dcBet.values?.find(v => v.value === label);
      const hd = dc('Home/Draw'), ha = dc('Home/Away'), da = dc('Draw/Away');
      if (hd) add1x2(`${homeName}/Draw`, parseFloat(hd.odd), pHome + pDraw, impH + impD);
      if (ha) add1x2(`${homeName}/${awayName}`, parseFloat(ha.odd), pHome + pAway, impH + impA);
      if (da) add1x2(`Draw/${awayName}`, parseFloat(da.odd), pDraw + pAway, impD + impA);
    }
  }

  // Asian Handicap — simplified: no de-vig (lines don't pair up cleanly across
  // quarter-lines), and quarter-line push mechanics aren't modeled. Flagged as
  // approximate in the UI.
  if (marginArr?.length) {
    const awayMarginArr = marginArr.map(v => (v === null ? null : -v));
    for (const bm of bookmakers) {
      const bet = bm.bets?.find(b => b.name === 'Asian Handicap');
      if (!bet) continue;
      for (const v of bet.values ?? []) {
        const m = /^(Home|Away)\s+([+-]?[\d.]+)$/.exec(v.value ?? '');
        if (!m) continue;
        const odd = parseFloat(v.odd);
        if (isNaN(odd) || odd < MIN_ODD || odd > MAX_ODD) continue;
        const h = parseFloat(m[2]);
        if (isNaN(h)) continue;
        const ourRate = m[1] === 'Home' ? rateOver(marginArr, -h) : rateOver(awayMarginArr, -h);
        if (ourRate === null) continue;
        const impliedPct = Math.round(100 / odd);
        picks.push({
          market: 'Handicap',
          selection: `${m[1] === 'Home' ? homeName : awayName} ${m[2]}`,
          odd, bookmaker: bm.name, ourRate, impliedPct, edge: ourRate - impliedPct, approx: true,
        });
      }
    }
  }

  return picks.filter(p => p.edge > 0).sort((a, b) => b.edge - a.edge);
};

// ── useBettingStats ──────────────────────────────────────────────────────────
// shared by the Stats tab (BettingStats.jsx) and the Value Picks tab
// (ValuePicksTab.jsx) so both read from one computation instead of duplicating it

export function useBettingStats({ h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData }) {
  return useMemo(() => {
    if (!teamHome?.id || !teamAway?.id) return null;

    // odds barely move between bookmakers — scanning all of them just repeats
    // the same pick 3x, so stick to one reference bookmaker
    const bookmakers = (oddsData?.[0]?.bookmakers ?? []).filter(b => b.name === 'Bet365');

    const h2hFT = (h2hData ?? []).filter(m => m.fixture?.status?.short === 'FT');

    // only the home team's matches as local, only the away team's matches as visitante
    const homeAsLocal   = byVenue(homeRecent, teamHome.id, 'home');
    const awayAsVisitor  = byVenue(awayRecent, teamAway.id, 'away');

    // Goals
    const h2hGoalArr   = h2hFT.map(m => (m.goals?.home ?? 0) + (m.goals?.away ?? 0));
    const homeGoalArr  = homeAsLocal.map(m => teamGoals(m, teamHome.id));
    const awayGoalArr  = awayAsVisitor.map(m => teamGoals(m, teamAway.id));
    const over25Count  = h2hGoalArr.filter(g => g > 2.5).length;
    const bothScoreCount = h2hFT.filter(m => (m.goals?.home ?? 0) > 0 && (m.goals?.away ?? 0) > 0).length;
    const homeGoalAvg  = avg(homeGoalArr);
    const awayGoalAvg  = avg(awayGoalArr);

    // Corners
    const h2hCornerArr  = h2hFT.map(m => getTotalStat(m, 'Corner Kicks'));
    const homeCornerArr = homeAsLocal.map(m => getStat(m, teamHome.id, 'Corner Kicks'));
    const awayCornerArr = awayAsVisitor.map(m => getStat(m, teamAway.id, 'Corner Kicks'));
    const homeCornerAvg = avg(homeCornerArr);
    const awayCornerAvg = avg(awayCornerArr);
    const cornerLine     = lineFromMedian(median(h2hCornerArr));
    const overCornersRate = rateOver(h2hCornerArr, cornerLine);

    // Yellow cards
    const h2hYellowArr  = h2hFT.map(m => getTotalStat(m, 'Yellow Cards'));
    const homeYellowArr = homeAsLocal.map(m => getStat(m, teamHome.id, 'Yellow Cards'));
    const awayYellowArr = awayAsVisitor.map(m => getStat(m, teamAway.id, 'Yellow Cards'));
    const homeYellowAvg = avg(homeYellowArr);
    const awayYellowAvg = avg(awayYellowArr);
    const yellowLine     = lineFromMedian(median(h2hYellowArr));
    const overYellowsRate = rateOver(h2hYellowArr, yellowLine);

    const statsWithData = h2hFT.filter(m => m.statistics?.length > 0).length;

    // win distribution (perspective: current home team vs. current away team)
    const h2hHomeWins = h2hFT.filter(m =>
      (m.teams.home.id === teamHome.id && m.teams.home.winner) ||
      (m.teams.away.id === teamHome.id && m.teams.away.winner)
    ).length;
    const h2hDraws    = h2hFT.filter(m => !m.teams.home.winner && !m.teams.away.winner).length;
    const h2hAwayWins = h2hFT.length - h2hHomeWins - h2hDraws;
    const pHome = h2hFT.length ? (h2hHomeWins / h2hFT.length) * 100 : 0;
    const pDraw = h2hFT.length ? (h2hDraws    / h2hFT.length) * 100 : 0;
    const pAway = h2hFT.length ? (h2hAwayWins / h2hFT.length) * 100 : 0;

    // goal margin from the current home team's perspective, for Asian Handicap
    const marginArr = h2hFT.map(m => {
      const hg = teamGoals(m, teamHome.id), ag = teamGoals(m, teamAway.id);
      return hg !== null && ag !== null ? hg - ag : null;
    });

    const valuePicks = scanValuePicks({
      bookmakers, teamHome, teamAway,
      h2hGoalArr, h2hCornerArr, h2hYellowArr,
      bothScoreRate: h2hFT.length ? Math.round(bothScoreCount / h2hFT.length * 100) : null,
      marginArr, pHome, pDraw, pAway,
    });

    return {
      h2hCount: h2hFT.length,
      statsWithData,
      h2hHomeWins,
      h2hDraws,
      h2hAwayWins,
      homeVenueCount: homeAsLocal.length,
      awayVenueCount: awayAsVisitor.length,
      // goals
      h2hGoals:         avg(h2hGoalArr),
      homeGoals:        homeGoalAvg,
      awayGoals:        awayGoalAvg,
      projGoals:        homeGoalAvg !== null && awayGoalAvg !== null ? homeGoalAvg + awayGoalAvg : null,
      over25Rate:       h2hGoalArr.length ? Math.round(over25Count / h2hGoalArr.length * 100) : null,
      bothScoreRate:    h2hFT.length ? Math.round(bothScoreCount / h2hFT.length * 100) : null,
      // corners
      h2hCorners:       avg(h2hCornerArr),
      homeCorners:      homeCornerAvg,
      awayCorners:      awayCornerAvg,
      projCorners:      homeCornerAvg !== null && awayCornerAvg !== null ? homeCornerAvg + awayCornerAvg : null,
      cornerLine,
      overCornersRate,
      // yellows
      h2hYellows:       avg(h2hYellowArr),
      homeYellows:      homeYellowAvg,
      awayYellows:      awayYellowAvg,
      projYellows:      homeYellowAvg !== null && awayYellowAvg !== null ? homeYellowAvg + awayYellowAvg : null,
      yellowLine,
      overYellowsRate,
      valuePicks,
    };
  }, [h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData]);
}

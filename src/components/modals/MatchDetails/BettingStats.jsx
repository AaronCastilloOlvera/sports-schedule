import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

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

const avg = (arr) => {
  const valid = arr.filter(v => v !== null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

const fmt = (v) => (v !== null && !isNaN(v) ? Number(v).toFixed(1) : '—');

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ icon, title, homeLabel, homeVal, awayLabel, awayVal, h2hVal, children }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{icon} {title}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}>
        {/* Home */}
        <Box sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
          <Typography
            sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={homeLabel}
          >
            {homeLabel}
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#1976d2', lineHeight: 1 }}>
            {fmt(homeVal)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>last 5 avg</Typography>
        </Box>

        {/* H2H */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider', px: 2, minWidth: 76 }}>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mb: 0.5 }}>H2H avg</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>
            {fmt(h2hVal)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>per game</Typography>
        </Box>

        {/* Away */}
        <Box sx={{ textAlign: 'center', py: 1.5, px: 1 }}>
          <Typography
            sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={awayLabel}
          >
            {awayLabel}
          </Typography>
          <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#ed6c02', lineHeight: 1 }}>
            {fmt(awayVal)}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>last 5 avg</Typography>
        </Box>
      </Box>

      {children && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

StatCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  homeLabel: PropTypes.string,
  homeVal: PropTypes.number,
  awayLabel: PropTypes.string,
  awayVal: PropTypes.number,
  h2hVal: PropTypes.number,
  children: PropTypes.node,
};

// ── Pill ─────────────────────────────────────────────────────────────────────

function Pill({ label, value, highlight }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: highlight ?? 'text.primary' }}>{value}</Typography>
    </Box>
  );
}

Pill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  highlight: PropTypes.string,
};

// ── BettingStats ─────────────────────────────────────────────────────────────

export default function BettingStats({ h2hData, homeRecent, awayRecent, teamHome, teamAway }) {
  const stats = useMemo(() => {
    if (!teamHome?.id || !teamAway?.id) return null;

    const h2hFT = (h2hData ?? []).filter(m => m.fixture?.status?.short === 'FT');

    // Goals
    const h2hGoalArr   = h2hFT.map(m => (m.goals?.home ?? 0) + (m.goals?.away ?? 0));
    const homeGoalArr  = (homeRecent ?? []).map(m => teamGoals(m, teamHome.id));
    const awayGoalArr  = (awayRecent ?? []).map(m => teamGoals(m, teamAway.id));
    const over25Count  = h2hGoalArr.filter(g => g > 2.5).length;
    const bothScoreCount = h2hFT.filter(m => (m.goals?.home ?? 0) > 0 && (m.goals?.away ?? 0) > 0).length;
    const homeGoalAvg  = avg(homeGoalArr);
    const awayGoalAvg  = avg(awayGoalArr);

    // Corners
    const h2hCornerArr  = h2hFT.map(m => getTotalStat(m, 'Corner Kicks'));
    const homeCornerArr = (homeRecent ?? []).map(m => getStat(m, teamHome.id, 'Corner Kicks'));
    const awayCornerArr = (awayRecent ?? []).map(m => getStat(m, teamAway.id, 'Corner Kicks'));
    const homeCornerAvg = avg(homeCornerArr);
    const awayCornerAvg = avg(awayCornerArr);

    // Yellow cards
    const h2hYellowArr  = h2hFT.map(m => getTotalStat(m, 'Yellow Cards'));
    const homeYellowArr = (homeRecent ?? []).map(m => getStat(m, teamHome.id, 'Yellow Cards'));
    const awayYellowArr = (awayRecent ?? []).map(m => getStat(m, teamAway.id, 'Yellow Cards'));
    const homeYellowAvg = avg(homeYellowArr);
    const awayYellowAvg = avg(awayYellowArr);

    const statsWithData = h2hFT.filter(m => m.statistics?.length > 0).length;

    return {
      h2hCount: h2hFT.length,
      statsWithData,
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
      // yellows
      h2hYellows:       avg(h2hYellowArr),
      homeYellows:      homeYellowAvg,
      awayYellows:      awayYellowAvg,
      projYellows:      homeYellowAvg !== null && awayYellowAvg !== null ? homeYellowAvg + awayYellowAvg : null,
    };
  }, [h2hData, homeRecent, awayRecent, teamHome, teamAway]);

  if (!stats || !teamHome || !teamAway) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No data available</Typography>
      </Box>
    );
  }

  const homeName = teamHome.name ?? '';
  const awayName = teamAway.name ?? '';

  return (
    <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
      {/* Goals */}
      <StatCard
        icon="⚽" title="Goals"
        homeLabel={homeName} homeVal={stats.homeGoals}
        awayLabel={awayName} awayVal={stats.awayGoals}
        h2hVal={stats.h2hGoals}
      >
        <Pill
          label="Over 2.5:"
          value={stats.over25Rate !== null ? `${stats.over25Rate}%` : '—'}
          highlight={stats.over25Rate !== null ? (stats.over25Rate >= 50 ? '#2e7d32' : '#d32f2f') : undefined}
        />
        <Pill label="Both score:" value={stats.bothScoreRate !== null ? `${stats.bothScoreRate}%` : '—'} />
        <Pill label="Projected:" value={fmt(stats.projGoals)} />
      </StatCard>

      {/* Corners */}
      <StatCard
        icon="🚩" title="Corners"
        homeLabel={homeName} homeVal={stats.homeCorners}
        awayLabel={awayName} awayVal={stats.awayCorners}
        h2hVal={stats.h2hCorners}
      >
        <Pill label="Projected total:" value={fmt(stats.projCorners)} />
        {stats.statsWithData === 0 && (
          <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>No stats in H2H</Typography>
        )}
      </StatCard>

      {/* Yellow Cards */}
      <StatCard
        icon="🟨" title="Yellow Cards"
        homeLabel={homeName} homeVal={stats.homeYellows}
        awayLabel={awayName} awayVal={stats.awayYellows}
        h2hVal={stats.h2hYellows}
      >
        <Pill label="Projected total:" value={fmt(stats.projYellows)} />
      </StatCard>

      <Typography sx={{ fontSize: 10, color: 'text.disabled', textAlign: 'center', mt: 1, pb: 1 }}>
        H2H based on {stats.h2hCount} completed matches · Recent = last 5 games per team
      </Typography>
    </Box>
  );
}

BettingStats.propTypes = {
  h2hData: PropTypes.array,
  homeRecent: PropTypes.array,
  awayRecent: PropTypes.array,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
};

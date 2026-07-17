import { Box, Stack, Typography, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useBettingStats, fmt } from './useBettingStats';

// ── WinDistributionBar ───────────────────────────────────────────────────────
// (moved here from HeadToHead.jsx so the H2H tab stays focused on the match list)

function WinDistributionBar({ homeWins, draws, awayWins, teamHome, teamAway }) {
  const { t } = useTranslation();
  const total = homeWins + draws + awayWins;
  if (total === 0) return null;

  const pHome = Math.round((homeWins / total) * 100);
  const pDraw = Math.round((draws    / total) * 100);
  const pAway = 100 - pHome - pDraw;

  return (
    <Box sx={{ px: { xs: 2, sm: '20px' }, pt: '14px', pb: '12px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: '8px' }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
            {homeWins}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'primary.main', mt: '2px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamHome?.name}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.disabled', lineHeight: 1 }}>
            {draws}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: '2px' }}>
            {t('h2h.draws')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'warning.main', lineHeight: 1 }}>
            {awayWins}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'warning.main', mt: '2px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamAway?.name}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: '1px' }}>
        {pHome > 0 && <Box sx={{ flex: pHome, bgcolor: 'primary.main', borderRadius: '3px 0 0 3px' }} />}
        {pDraw > 0 && <Box sx={{ flex: pDraw, bgcolor: 'action.disabled' }} />}
        {pAway > 0 && <Box sx={{ flex: pAway, bgcolor: 'warning.main', borderRadius: '0 3px 3px 0' }} />}
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: '4px' }}>
        <Typography sx={{ fontSize: 10, color: 'primary.main' }}>{pHome}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>{pDraw}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'warning.main' }}>{pAway}%</Typography>
      </Stack>
    </Box>
  );
}

WinDistributionBar.propTypes = {
  homeWins: PropTypes.number.isRequired,
  draws:    PropTypes.number.isRequired,
  awayWins: PropTypes.number.isRequired,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
};

// ── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ icon, title, tooltip, homeLabel, homeVal, homeCount, awayLabel, awayVal, awayCount, h2hVal, children }) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {icon} {title}
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top" enterTouchDelay={0}>
              <InfoOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
            </Tooltip>
          )}
        </Typography>
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
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>as local ({homeCount ?? 0})</Typography>
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
          <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: 0.5 }}>as visita ({awayCount ?? 0})</Typography>
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
  tooltip: PropTypes.string,
  homeLabel: PropTypes.string,
  homeVal: PropTypes.number,
  homeCount: PropTypes.number,
  awayLabel: PropTypes.string,
  awayVal: PropTypes.number,
  awayCount: PropTypes.number,
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

export default function BettingStats({ h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData }) {
  const stats = useBettingStats({ h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData });

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
      {/* H2H overview: win distribution */}
      <Box sx={{ mx: -2, mt: -2, mb: 2 }}>
        <WinDistributionBar
          homeWins={stats.h2hHomeWins} draws={stats.h2hDraws} awayWins={stats.h2hAwayWins}
          teamHome={teamHome} teamAway={teamAway}
        />
      </Box>

      {/* Goals */}
      <StatCard
        icon="⚽" title="Goals"
        tooltip={`Team averages use only ${homeName}'s matches as local and ${awayName}'s matches as visitante from recent form (goals scored + conceded per game). H2H avg = average total goals in the last ${stats.h2hCount} completed matches between these two teams. Over 2.5 / Both score = % of those H2H matches. Projected = home local avg + away visitante avg.`}
        homeLabel={homeName} homeVal={stats.homeGoals} homeCount={stats.homeVenueCount}
        awayLabel={awayName} awayVal={stats.awayGoals} awayCount={stats.awayVenueCount}
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
        tooltip={`Team averages use only ${homeName}'s matches as local and ${awayName}'s matches as visitante (corner kicks per game). H2H avg = average total corners in the last ${stats.h2hCount} completed matches between these two teams. Over line is set at the H2H average rounded down to the nearest .5, so it's tailored to this matchup rather than a fixed number. Projected total = home local avg + away visitante avg.`}
        homeLabel={homeName} homeVal={stats.homeCorners} homeCount={stats.homeVenueCount}
        awayLabel={awayName} awayVal={stats.awayCorners} awayCount={stats.awayVenueCount}
        h2hVal={stats.h2hCorners}
      >
        {stats.cornerLine !== null && (
          <Pill
            label={`Over ${fmt(stats.cornerLine)}:`}
            value={stats.overCornersRate !== null ? `${stats.overCornersRate}%` : '—'}
            highlight={stats.overCornersRate !== null ? (stats.overCornersRate >= 50 ? '#2e7d32' : '#d32f2f') : undefined}
          />
        )}
        <Pill label="Projected total:" value={fmt(stats.projCorners)} />
        {stats.statsWithData === 0 && (
          <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>No stats in H2H</Typography>
        )}
      </StatCard>

      {/* Yellow Cards */}
      <StatCard
        icon="🟨" title="Yellow Cards"
        tooltip={`Team averages use only ${homeName}'s matches as local and ${awayName}'s matches as visitante (yellow cards per game). H2H avg = average total yellow cards in the last ${stats.h2hCount} completed matches between these two teams. Over line is set at the H2H average rounded down to the nearest .5, so it's tailored to this matchup rather than a fixed number. Projected total = home local avg + away visitante avg.`}
        homeLabel={homeName} homeVal={stats.homeYellows} homeCount={stats.homeVenueCount}
        awayLabel={awayName} awayVal={stats.awayYellows} awayCount={stats.awayVenueCount}
        h2hVal={stats.h2hYellows}
      >
        {stats.yellowLine !== null && (
          <Pill
            label={`Over ${fmt(stats.yellowLine)}:`}
            value={stats.overYellowsRate !== null ? `${stats.overYellowsRate}%` : '—'}
            highlight={stats.overYellowsRate !== null ? (stats.overYellowsRate >= 50 ? '#2e7d32' : '#d32f2f') : undefined}
          />
        )}
        <Pill label="Projected total:" value={fmt(stats.projYellows)} />
      </StatCard>

      <Typography sx={{ fontSize: 10, color: 'text.disabled', textAlign: 'center', mt: 1, pb: 1 }}>
        H2H based on {stats.h2hCount} completed matches · Recent = home team matches as local, away team matches as visitante
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
  oddsData: PropTypes.array,
};

import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
const GRID_COLS        = '110px minmax(0, 1fr) 80px minmax(0, 1fr) 116px';
const GRID_COLS_MOBILE = '80px minmax(0, 1fr) 64px minmax(0, 1fr)';

// ── Sub-components ─────────────────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange }) {
  return (
    <Box sx={{ display: 'inline-flex', bgcolor: 'action.hover', borderRadius: '9px', p: '2px' }}>
      {options.map(opt => (
        <Box
          key={opt.value}
          component="button"
          onClick={() => onChange(opt.value)}
          sx={{
            bgcolor: value === opt.value ? 'background.paper' : 'transparent',
            border: 'none', outline: 'none', cursor: 'pointer',
            borderRadius: '7px',
            px: { xs: '10px', sm: '14px' },
            py: { xs: '4px', sm: '5px' },
            fontSize: { xs: 12, sm: 13 },
            fontWeight: value === opt.value ? 600 : 400,
            color: value === opt.value ? 'text.primary' : 'text.disabled',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: value === opt.value ? '0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
            letterSpacing: '-0.1px',
            fontFamily: FONT,
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Box>
  );
}

SegmentedControl.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
  value:   PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ScoreBadge({ homeScore, awayScore, homeWon, awayWon }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      bgcolor: 'action.selected', border: '1px solid', borderColor: 'divider',
      borderRadius: '10px', px: '10px', py: '5px',
      minWidth: { xs: 52, sm: 62 }, justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: homeWon ? '#28CD41' : awayWon ? '#FF3B30' : 'text.secondary' }}>
        {homeScore}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500, mx: '2px', lineHeight: 1, fontFamily: FONT }}>–</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: awayWon ? '#28CD41' : homeWon ? '#FF3B30' : 'text.secondary' }}>
        {awayScore}
      </Typography>
    </Box>
  );
}

ScoreBadge.propTypes = {
  homeScore: PropTypes.number,
  awayScore: PropTypes.number,
  homeWon:   PropTypes.bool,
  awayWon:   PropTypes.bool,
};

function MiniLogo({ logo, name }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '50%',
      bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {logo ? (
        <Box component="img" src={logo} alt={name} sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      ) : (
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', fontFamily: FONT }}>
          {name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
        </Typography>
      )}
    </Box>
  );
}

MiniLogo.propTypes = { logo: PropTypes.string, name: PropTypes.string };

function WinDistributionBar({ team1Wins, draws, team2Wins, teamHome, teamAway }) {
  const { t } = useTranslation();
  const total = team1Wins + draws + team2Wins;
  if (total === 0) return null;

  const pHome = Math.round((team1Wins / total) * 100);
  const pDraw = Math.round((draws     / total) * 100);
  const pAway = 100 - pHome - pDraw;

  return (
    <Box sx={{ px: { xs: 2, sm: '20px' }, pt: '14px', pb: '12px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: '8px' }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'primary.main', fontFamily: FONT, lineHeight: 1 }}>
            {team1Wins}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'primary.main', fontFamily: FONT, mt: '2px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {teamHome?.name}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.disabled', fontFamily: FONT, lineHeight: 1 }}>
            {draws}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: FONT, mt: '2px' }}>
            {t('h2h.draws')}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'warning.main', fontFamily: FONT, lineHeight: 1 }}>
            {team2Wins}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'warning.main', fontFamily: FONT, mt: '2px', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
        <Typography sx={{ fontSize: 10, color: 'primary.main', fontFamily: FONT }}>{pHome}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: FONT }}>{pDraw}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'warning.main', fontFamily: FONT }}>{pAway}%</Typography>
      </Stack>
    </Box>
  );
}

WinDistributionBar.propTypes = {
  team1Wins: PropTypes.number.isRequired,
  draws:     PropTypes.number.isRequired,
  team2Wins: PropTypes.number.isRequired,
  teamHome:  PropTypes.object,
  teamAway:  PropTypes.object,
};

function AggregateStats({ matches }) {
  const { t } = useTranslation();
  if (!matches.length) return null;

  const total      = matches.length;
  const totalGoals = matches.reduce((sum, m) => sum + (m.goals.home ?? 0) + (m.goals.away ?? 0), 0);
  const avgGoals   = (totalGoals / total).toFixed(1);
  const bothScored = matches.filter(m => (m.goals.home ?? 0) > 0 && (m.goals.away ?? 0) > 0).length;
  const bothPct    = Math.round((bothScored / total) * 100);

  const stats = [
    { label: t('h2h.aggregate.avgGoals'),   value: avgGoals },
    { label: t('h2h.aggregate.bothScored'), value: `${bothPct}%` },
    { label: t('h2h.aggregate.matches'),    value: total },
  ];

  return (
    <Box sx={{ display: 'flex', borderBottom: '0.5px solid', borderColor: 'divider' }}>
      {stats.map((stat, i) => (
        <Box
          key={stat.label}
          sx={{
            flex: 1, textAlign: 'center', py: '12px',
            borderRight: i < stats.length - 1 ? '0.5px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary', fontFamily: FONT, lineHeight: 1 }}>
            {stat.value}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: FONT, mt: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {stat.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

AggregateStats.propTypes = { matches: PropTypes.array.isRequired };

// ── Main component ─────────────────────────────────────────────────────────────

export default function HeadToHead({
  filteredMatches, filter, onFilterChange, team1Id,
  teamHome, teamAway,
}) {
  const { t, i18n } = useTranslation();

  const filterOptions = [
    { value: 'all',  label: t('h2h.filters.all') },
    { value: 'home', label: t('h2h.filters.home') },
    { value: 'away', label: t('h2h.filters.away') },
  ];

  const team1Wins = filteredMatches.filter(m =>
    (m.teams.home.id === team1Id && m.teams.home.winner) ||
    (m.teams.away.id === team1Id && m.teams.away.winner)
  ).length;
  const draws     = filteredMatches.filter(m => !m.teams.home.winner && !m.teams.away.winner).length;
  const team2Wins = filteredMatches.length - team1Wins - draws;

  return (
    <Box sx={{ bgcolor: 'background.paper', fontFamily: FONT, display: 'flex', flexDirection: 'column', height: '100%' }}>

      <WinDistributionBar
        team1Wins={team1Wins} draws={draws} team2Wins={team2Wins}
        teamHome={teamHome} teamAway={teamAway}
      />

      <AggregateStats matches={filteredMatches} />

      {/* Title + filter row */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        px: { xs: 2, sm: '20px' }, pt: { xs: 2, sm: '18px' }, pb: '10px',
      }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.4px', lineHeight: 1, fontFamily: FONT }}>
            {t('h2h.lastMatches')}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px', fontFamily: FONT }}>
            {filteredMatches.length} {t('h2h.results')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <SegmentedControl options={filterOptions} value={filter} onChange={onFilterChange} />
        </Box>
      </Box>

      {/* Column headers */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
        gap: '8px',
        px: { xs: '12px', sm: '16px' },
        py: '6px',
        borderBottom: '0.5px solid',
        borderColor: 'divider',
      }}>
        {[
          { label: t('h2h.table.date'),   align: 'left',   hideXs: false },
          { label: t('h2h.table.home'),   align: 'right',  hideXs: false },
          { label: t('h2h.table.result'), align: 'center', hideXs: false },
          { label: t('h2h.table.away'),   align: 'left',   hideXs: false },
          { label: t('h2h.table.league'), align: 'center', hideXs: true  },
        ].map(col => (
          <Typography
            key={col.label}
            sx={{
              display: col.hideXs ? { xs: 'none', sm: 'block' } : 'block',
              fontSize: 11, fontWeight: 600, color: 'text.disabled',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              textAlign: col.align, fontFamily: FONT,
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Match rows */}
      <Box sx={{ flex: 1, overflowY: 'auto', pt: '4px', pb: '8px' }}>
        {filteredMatches.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.disabled', fontSize: 14, fontFamily: FONT }}>
              {t('h2h.noMatchesFilter')}
            </Typography>
          </Box>
        ) : filteredMatches.map((match, i) => {
          const homeWon = match.teams.home.winner;
          const awayWon = match.teams.away.winner;

          return (
            <Box key={match.fixture.id}>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
                alignItems: 'center', gap: '8px',
                px: { xs: '12px', sm: '16px' }, py: '8px',
              }}>
                {/* Date */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', letterSpacing: '-0.2px', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: '2px', textTransform: 'capitalize', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString(i18n.language, { weekday: 'long' })}
                  </Typography>
                </Box>

                {/* Home team */}
                <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ gap: '6px', minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', textAlign: 'right', letterSpacing: '-0.2px', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.teams.home.name}
                  </Typography>
                  <MiniLogo logo={match.teams.home.logo} name={match.teams.home.name} />
                </Stack>

                {/* Score */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreBadge homeScore={match.goals.home} awayScore={match.goals.away} homeWon={homeWon} awayWon={awayWon} />
                </Box>

                {/* Away team */}
                <Stack direction="row" alignItems="center" sx={{ gap: '6px', minWidth: 0 }}>
                  <MiniLogo logo={match.teams.away.logo} name={match.teams.away.name} />
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', letterSpacing: '-0.2px', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.teams.away.name}
                  </Typography>
                </Stack>

                {/* League — hidden on xs */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', overflow: 'hidden' }}>
                  <Typography component="span" sx={{
                    fontSize: 11, color: 'text.secondary', fontWeight: 500,
                    bgcolor: 'action.selected', borderRadius: '6px',
                    px: '7px', py: '3px', letterSpacing: '0.1px', fontFamily: FONT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                  }}>
                    {match.league.name}
                  </Typography>
                </Box>
              </Box>

              {i < filteredMatches.length - 1 && (
                <Box sx={{ height: '0.5px', bgcolor: 'divider', mx: '12px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

HeadToHead.propTypes = {
  filteredMatches: PropTypes.array.isRequired,
  filter:          PropTypes.string.isRequired,
  onFilterChange:  PropTypes.func.isRequired,
  team1Id:         PropTypes.number.isRequired,
  teamHome:        PropTypes.object,
  teamAway:        PropTypes.object,
};

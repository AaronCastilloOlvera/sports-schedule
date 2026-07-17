import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
const GRID_COLS        = '110px minmax(0, 1fr) 80px minmax(0, 1fr) 116px 24px';
const GRID_COLS_MOBILE = '80px minmax(0, 1fr) 64px minmax(0, 1fr) 24px';

const KEY_STATS = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls', 'Yellow Cards', 'Red Cards'];

const CARD_ICON_COLOR = {
  'Yellow Cards': { bg: '#F5C518', shadow: 'rgba(245,197,24,0.45)' },
  'Red Cards':    { bg: '#FF3B30', shadow: 'rgba(255,59,48,0.45)'  },
};

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

function StatRow({ type, homeValue, awayValue }) {
  const { t } = useTranslation();
  const isPossession = type === 'Ball Possession';
  const homeNum      = isPossession ? parseInt(homeValue) || 50 : null;

  return (
    <Box sx={{ mb: '10px', '&:last-child': { mb: 0 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: isPossession ? '5px' : 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', fontFamily: FONT, minWidth: 32 }}>
          {homeValue ?? '—'}
        </Typography>
        {CARD_ICON_COLOR[type] ? (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', px: '6px' }}>
            <Box sx={{
              width: 11, height: 15, bgcolor: CARD_ICON_COLOR[type].bg,
              borderRadius: '2px', boxShadow: `0 2px 6px ${CARD_ICON_COLOR[type].shadow}`,
            }} />
          </Box>
        ) : (
          <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', flex: 1, px: '6px' }}>
            {t(`recent.stats.types.${type}`, type)}
          </Typography>
        )}
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', fontFamily: FONT, minWidth: 32, textAlign: 'right' }}>
          {awayValue ?? '—'}
        </Typography>
      </Stack>
      {isPossession && (
        <Box sx={{ height: 4, borderRadius: 2, display: 'flex', overflow: 'hidden', bgcolor: 'error.main' }}>
          <Box sx={{ width: `${homeNum}%`, bgcolor: 'primary.main', flexShrink: 0 }} />
        </Box>
      )}
    </Box>
  );
}

StatRow.propTypes = { type: PropTypes.string, homeValue: PropTypes.any, awayValue: PropTypes.any };

function MatchStats({ statistics, homeTeamId, awayTeamId }) {
  const { t } = useTranslation();

  if (!statistics?.length) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', py: 1 }}>
        {t('recent.stats.noData')}
      </Typography>
    );
  }

  const homeStats = statistics.find(s => s.team?.id === homeTeamId)?.statistics ?? [];
  const awayStats = statistics.find(s => s.team?.id === awayTeamId)?.statistics ?? [];

  const pairs = KEY_STATS
    .map(type => ({
      type,
      homeValue: homeStats.find(s => s.type === type)?.value ?? (CARD_ICON_COLOR[type] ? 0 : null),
      awayValue: awayStats.find(s => s.type === type)?.value ?? (CARD_ICON_COLOR[type] ? 0 : null),
    }))
    .filter(p => p.homeValue != null || p.awayValue != null);

  if (!pairs.length) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', py: 1 }}>
        {t('recent.stats.noData')}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.8px', mb: '10px', fontFamily: FONT }}>
        {t('recent.stats.title')}
      </Typography>
      {pairs.map(p => <StatRow key={p.type} {...p} />)}
    </Box>
  );
}

MatchStats.propTypes = {
  statistics:  PropTypes.array,
  homeTeamId:  PropTypes.number,
  awayTeamId:  PropTypes.number,
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function HeadToHead({
  filteredMatches, filter, onFilterChange,
}) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const filterOptions = [
    { value: 'all',  label: t('h2h.filters.all') },
    { value: 'home', label: t('h2h.filters.home') },
    { value: 'away', label: t('h2h.filters.away') },
  ];

  return (
    <Box sx={{ bgcolor: 'background.paper', fontFamily: FONT, display: 'flex', flexDirection: 'column', height: '100%' }}>

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
          { label: '',                    align: 'center', hideXs: false },
        ].map((col, idx) => (
          <Typography
            key={idx}
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
          const homeWon    = match.teams.home.winner;
          const awayWon    = match.teams.away.winner;
          const isExpanded = expandedId === match.fixture.id;

          return (
            <Box key={match.fixture.id}>
              {/* Clickable row */}
              <Box
                onClick={() => toggleExpand(match.fixture.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
                  alignItems: 'center', gap: '8px',
                  px: { xs: '12px', sm: '16px' }, py: '8px',
                  cursor: 'pointer',
                  bgcolor: isExpanded ? 'action.hover' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
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

                {/* Expand toggle */}
                <Box sx={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  width: 20, height: 20, borderRadius: '50%',
                  border: '1px solid', borderColor: 'divider',
                  color: 'text.secondary', fontSize: 14, fontWeight: 400,
                  flexShrink: 0, userSelect: 'none', fontFamily: FONT,
                }}>
                  {isExpanded ? '−' : '+'}
                </Box>
              </Box>

              {/* Expandable stats */}
              <Box sx={{
                maxHeight: isExpanded ? '400px' : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <Box sx={{
                  mx: { xs: '12px', sm: '16px' }, mb: '8px',
                  borderRadius: '12px',
                  bgcolor: 'action.selected',
                  border: '1px solid', borderColor: 'divider',
                  p: '14px',
                }}>
                  <MatchStats
                    statistics={match.statistics}
                    homeTeamId={match.teams.home.id}
                    awayTeamId={match.teams.away.id}
                  />
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
};

import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
const GRID_COLS = '110px 1fr 80px 1fr 100px';

function SegmentedControl({ options, value, onChange }) {
  return (
    <Box sx={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', borderRadius: '9px', p: '2px' }}>
      {options.map(opt => (
        <Box
          key={opt.value}
          component="button"
          onClick={() => onChange(opt.value)}
          sx={{
            background: value === opt.value ? '#ffffff' : 'transparent',
            border: 'none', outline: 'none', cursor: 'pointer',
            borderRadius: '7px',
            px: '14px', py: '5px',
            fontSize: 13,
            fontWeight: value === opt.value ? 600 : 400,
            color: value === opt.value ? '#1c1c1e' : 'rgba(0,0,0,0.45)',
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
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ScoreBadge({ homeScore, awayScore, homeWon, awayWon }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      background: '#f2f2f7',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: '10px', px: '10px', py: '5px',
      minWidth: 62, justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: homeWon ? '#28CD41' : awayWon ? '#FF3B30' : '#8e8e93' }}>
        {homeScore}
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#aeaeb2', fontWeight: 500, mx: '2px', lineHeight: 1, fontFamily: FONT }}>
        –
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: awayWon ? '#28CD41' : homeWon ? '#FF3B30' : '#8e8e93' }}>
        {awayScore}
      </Typography>
    </Box>
  );
}

ScoreBadge.propTypes = {
  homeScore: PropTypes.number,
  awayScore: PropTypes.number,
  homeWon: PropTypes.bool,
  awayWon: PropTypes.bool,
};

function MiniLogo({ logo, name }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '50%',
      background: '#f2f2f7',
      border: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {logo ? (
        <Box component="img" src={logo} alt={name} sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      ) : (
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: '#8e8e93', fontFamily: FONT }}>
          {name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
        </Typography>
      )}
    </Box>
  );
}

MiniLogo.propTypes = {
  logo: PropTypes.string,
  name: PropTypes.string,
};

export default function H2HMatchHistory({ filteredMatches, filter, onFilterChange, team1Id }) {
  const { t } = useTranslation();

  const filterOptions = [
    { value: 'all',  label: t('h2h.filters.all') },
    { value: 'home', label: t('h2h.filters.home') },
    { value: 'away', label: t('h2h.filters.away') },
  ];

  return (
    <Box sx={{ background: '#ffffff', borderTop: '0.5px solid rgba(0,0,0,0.08)', fontFamily: FONT }}>

      {/* Title + filter row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: '20px' }, pt: { xs: 2, sm: '18px' }, pb: '10px' }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.4px', lineHeight: 1, fontFamily: FONT }}>
            {t('h2h.lastMatches')}
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#8e8e93', mt: '2px', fontFamily: FONT }}>
            {filteredMatches.length} {t('h2h.results')}
          </Typography>
        </Box>
        <SegmentedControl options={filterOptions} value={filter} onChange={onFilterChange} />
      </Box>

      {/* Column headers */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: GRID_COLS, gap: '8px',
        px: { xs: 2, sm: '16px' }, py: '6px',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
        minWidth: 480,
      }}>
        {[
          { label: t('h2h.table.date'),   align: 'left' },
          { label: t('h2h.table.home'),   align: 'right' },
          { label: t('h2h.table.result'), align: 'center' },
          { label: t('h2h.table.away'),   align: 'left' },
          { label: t('h2h.table.league'), align: 'center' },
        ].map(col => (
          <Typography key={col.label} sx={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: col.align, fontFamily: FONT }}>
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Scrollable match rows */}
      <Box sx={{ maxHeight: { xs: 280, sm: 320 }, overflowY: 'auto', overflowX: 'auto', px: '4px', pt: '4px', pb: '8px', minWidth: 480 }}>
        {filteredMatches.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ color: '#aeaeb2', fontSize: 14, fontFamily: FONT }}>
              {t('h2h.noMatchesFilter')}
            </Typography>
          </Box>
        ) : filteredMatches.map((match, i) => {
          const homeWon = match.teams.home.winner;
          const awayWon = match.teams.away.winner;
          return (
            <Box key={match.fixture.id}>
              <Box sx={{
                display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center',
                gap: '8px', px: { xs: 1.5, sm: '16px' }, py: '12px',
                borderRadius: '12px', cursor: 'default',
                transition: 'background 0.15s ease',
                '&:hover': { background: 'rgba(0,0,0,0.03)' },
              }}>

                {/* Date (bold) + weekday (muted) — visual hierarchy */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', letterSpacing: '-0.2px', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#aeaeb2', mt: '2px', textTransform: 'capitalize', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { weekday: 'long' })}
                  </Typography>
                </Box>

                {/* Home team (right-aligned) */}
                <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ gap: '8px' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#3c3c43', textAlign: 'right', letterSpacing: '-0.2px', fontFamily: FONT }}>
                    {match.teams.home.name}
                  </Typography>
                  <MiniLogo logo={match.teams.home.logo} name={match.teams.home.name} />
                </Stack>

                {/* Score badge */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreBadge homeScore={match.goals.home} awayScore={match.goals.away} homeWon={homeWon} awayWon={awayWon} />
                </Box>

                {/* Away team (left-aligned) */}
                <Stack direction="row" alignItems="center" sx={{ gap: '8px' }}>
                  <MiniLogo logo={match.teams.away.logo} name={match.teams.away.name} />
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#3c3c43', letterSpacing: '-0.2px', fontFamily: FONT }}>
                    {match.teams.away.name}
                  </Typography>
                </Stack>

                {/* League pill (centered) */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography component="span" sx={{ fontSize: 11, color: '#636366', fontWeight: 500, background: '#f2f2f7', borderRadius: '6px', px: '7px', py: '3px', letterSpacing: '0.1px', fontFamily: FONT }}>
                    {match.league.name}
                  </Typography>
                </Box>
              </Box>

              {/* Hairline separator between rows */}
              {i < filteredMatches.length - 1 && (
                <Box sx={{ height: '0.5px', background: 'rgba(0,0,0,0.07)', mx: '16px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

H2HMatchHistory.propTypes = {
  filteredMatches: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
};

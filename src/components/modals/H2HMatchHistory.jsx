import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

// Desktop keeps all 5 columns. Mobile drops the League column and tightens the date.
const GRID_COLS        = '110px 1fr 80px 1fr 100px';
const GRID_COLS_MOBILE = '80px 1fr 64px 1fr';

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
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ScoreBadge({ homeScore, awayScore, homeWon, awayWon }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      bgcolor: 'action.selected',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '10px', px: '10px', py: '5px',
      minWidth: { xs: 52, sm: 62 }, justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: homeWon ? '#28CD41' : awayWon ? '#FF3B30' : 'text.secondary' }}>
        {homeScore}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500, mx: '2px', lineHeight: 1, fontFamily: FONT }}>
        –
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: awayWon ? '#28CD41' : homeWon ? '#FF3B30' : 'text.secondary' }}>
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
      bgcolor: 'action.hover',
      border: '1px solid',
      borderColor: 'divider',
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

MiniLogo.propTypes = {
  logo: PropTypes.string,
  name: PropTypes.string,
};

export default function H2HMatchHistory({ filteredMatches, filter, onFilterChange, team1Id }) {
  const { t, i18n } = useTranslation();

  const filterOptions = [
    { value: 'all',  label: t('h2h.filters.all') },
    { value: 'home', label: t('h2h.filters.home') },
    { value: 'away', label: t('h2h.filters.away') },
  ];

  return (
    <Box sx={{ bgcolor: 'background.paper', borderTop: '0.5px solid', borderColor: 'divider', fontFamily: FONT }}>

      {/* Title + filter row — wraps on xs so long translated labels don't overflow */}
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

      {/* Column headers
          gridTemplateColumns switches between 4-col (xs) and 5-col (sm+).
          The League header cell is hidden on xs via display:none. */}
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
      <Box sx={{ maxHeight: { xs: 260, sm: 320 }, overflowY: 'auto', pt: '4px', pb: '8px' }}>
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
                alignItems: 'center',
                gap: '8px',
                px: { xs: '12px', sm: '16px' },
                py: '12px',
                borderRadius: '12px', cursor: 'default',
                transition: 'background-color 0.15s ease',
                '&:hover': { bgcolor: 'action.hover' },
              }}>

                {/* Date (bold) + weekday (muted) */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', letterSpacing: '-0.2px', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: '2px', textTransform: 'capitalize', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString(i18n.language, { weekday: 'long' })}
                  </Typography>
                </Box>

                {/* Home team — name truncates with ellipsis when space is tight */}
                <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ gap: '6px', minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 13, fontWeight: 500, color: 'text.primary',
                    textAlign: 'right', letterSpacing: '-0.2px', fontFamily: FONT,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {match.teams.home.name}
                  </Typography>
                  <MiniLogo logo={match.teams.home.logo} name={match.teams.home.name} />
                </Stack>

                {/* Score badge */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreBadge homeScore={match.goals.home} awayScore={match.goals.away} homeWon={homeWon} awayWon={awayWon} />
                </Box>

                {/* Away team — name truncates with ellipsis when space is tight */}
                <Stack direction="row" alignItems="center" sx={{ gap: '6px', minWidth: 0 }}>
                  <MiniLogo logo={match.teams.away.logo} name={match.teams.away.name} />
                  <Typography sx={{
                    fontSize: 13, fontWeight: 500, color: 'text.primary',
                    letterSpacing: '-0.2px', fontFamily: FONT,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {match.teams.away.name}
                  </Typography>
                </Stack>

                {/* League pill — hidden on xs, visible on sm+ */}
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'center' }}>
                  <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500, bgcolor: 'action.selected', borderRadius: '6px', px: '7px', py: '3px', letterSpacing: '0.1px', fontFamily: FONT }}>
                    {match.league.name}
                  </Typography>
                </Box>
              </Box>

              {/* Hairline separator between rows */}
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

H2HMatchHistory.propTypes = {
  filteredMatches: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
};

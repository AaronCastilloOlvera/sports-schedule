import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const OddsRow = ({ bookmakerName, home, draw, away }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 72px 72px 72px',
      alignItems: 'center',
      gap: 1,
      px: 1.5,
      py: 1.25,
      borderRadius: 2,
      bgcolor: 'action.hover',
      mb: 0.75,
    }}
  >
    <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {bookmakerName}
    </Typography>
    {[home, draw, away].map((odd, i) => (
      <Typography key={i} sx={{ fontSize: 14, fontWeight: 600, color: 'primary.main', fontFamily: FONT, textAlign: 'center' }}>
        {odd ?? '-'}
      </Typography>
    ))}
  </Box>
);

OddsRow.propTypes = {
  bookmakerName: PropTypes.string.isRequired,
  home: PropTypes.string,
  draw: PropTypes.string,
  away: PropTypes.string,
};

const MatchOdds = ({ oddsData, loading, teamHome, teamAway }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
        <CircularProgress size={22} color="primary" />
        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontFamily: FONT }}>
          {t('loading')}
        </Typography>
      </Box>
    );
  }

  const bookmakers = oddsData?.[0]?.bookmakers ?? [];
  const rows = bookmakers
    .map(bm => {
      const bet = bm.bets?.find(b => b.name === 'Match Winner');
      if (!bet) return null;
      const get = val => bet.values.find(v => v.value === val)?.odd;
      return { name: bm.name, home: get('Home'), draw: get('Draw'), away: get('Away') };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14, fontFamily: FONT }}>
          {t('odds.noData')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
      {/* Column header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 72px 72px 72px',
          gap: 1,
          px: 1.5,
          pb: 1,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', fontFamily: FONT }}>
          {t('odds.bookmaker')}
        </Typography>
        {[
          teamHome?.name ?? '1',
          t('form.draw'),
          teamAway?.name ?? '2',
        ].map((label, i) => (
          <Typography
            key={i}
            sx={{
              fontSize: 11, fontWeight: 600, color: 'text.disabled',
              textTransform: 'uppercase', fontFamily: FONT,
              textAlign: 'center',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      {rows.map((row, i) => (
        <OddsRow key={i} bookmakerName={row.name} home={row.home} draw={row.draw} away={row.away} />
      ))}
    </Box>
  );
};

MatchOdds.propTypes = {
  oddsData: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
};

export default MatchOdds;

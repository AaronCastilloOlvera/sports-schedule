import { Box, Divider, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { findOdd, MarketRow } from '../../Futbol/betRadarShared';

export default function BetRadarTab({ suggestion, oddsData }) {
  if (!suggestion) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          Sin análisis de BetRadar para este partido.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: '20px' }, py: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary">
          📊 Datos: {suggestion.home_locality_count}p casa · {suggestion.away_locality_count}p vis. · {suggestion.h2h_count}p H2H
        </Typography>
        {suggestion.referee && (
          <Typography variant="caption" color="text.secondary">
            🏁 {suggestion.referee}
          </Typography>
        )}
      </Stack>
      <Divider sx={{ mb: 1 }} />
      {suggestion.top_picks.map((p) => {
        const odd = p.best_odd || (oddsData ? findOdd(oddsData, p.market, p.side, p.line) : null);
        return <MarketRow key={p.market} market={p.market} data={p} odd={odd} />;
      })}
    </Box>
  );
}

BetRadarTab.propTypes = {
  suggestion: PropTypes.shape({
    home_locality_count: PropTypes.number,
    away_locality_count: PropTypes.number,
    h2h_count: PropTypes.number,
    referee: PropTypes.string,
    top_picks: PropTypes.array,
  }),
  oddsData: PropTypes.array,
};

import { Box, Stack, Typography, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PropTypes from 'prop-types';
import { useBettingStats, MIN_ODD, MAX_ODD } from './useBettingStats';

function ValuePickRow({ pick }) {
  const { market, selection, odd, bookmaker, ourRate, impliedPct, edge, approx } = pick;
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: '10px', px: 2, borderBottom: '0.5px solid', borderColor: 'divider', gap: 1 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {market} · {selection}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
          {bookmaker} @ {odd.toFixed(2)} · Ours {ourRate}% vs Book {impliedPct}%{approx ? ' (aprox.)' : ''}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#2e7d32', flexShrink: 0 }}>
        +{edge}pp
      </Typography>
    </Stack>
  );
}

ValuePickRow.propTypes = {
  pick: PropTypes.shape({
    market: PropTypes.string,
    selection: PropTypes.string,
    odd: PropTypes.number,
    bookmaker: PropTypes.string,
    ourRate: PropTypes.number,
    impliedPct: PropTypes.number,
    edge: PropTypes.number,
    approx: PropTypes.bool,
  }).isRequired,
};

export default function ValuePicksTab({ h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData }) {
  const stats = useBettingStats({ h2hData, homeRecent, awayRecent, teamHome, teamAway, oddsData });

  if (!stats || !teamHome || !teamAway) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No data available</Typography>
      </Box>
    );
  }

  const picks = stats.valuePicks;

  return (
    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      <Box sx={{ px: 2, py: '14px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          🎯 Value Picks
          <Tooltip
            title={`Momios entre ${MIN_ODD.toFixed(2)} y ${MAX_ODD.toFixed(2)}, escaneando Goals/Corners/Cards (over-under), Both Teams Score, 1X2, Doble Oportunidad y Hándicap Asiático. Ordenados por edge (nuestra tasa H2H menos la probabilidad implícita del momio, sin vig). Hándicap asiático es aproximado: no descuenta el margen del libro ni simula push en líneas de cuarto.`}
            arrow placement="bottom" enterTouchDelay={0}
          >
            <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled', cursor: 'help' }} />
          </Tooltip>
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px' }}>
          {picks.length} pick{picks.length === 1 ? '' : 's'} · momios {MIN_ODD.toFixed(2)}–{MAX_ODD.toFixed(2)}
        </Typography>
      </Box>

      {picks.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
            No hay picks con valor en el rango {MIN_ODD.toFixed(2)}–{MAX_ODD.toFixed(2)} ahora mismo.
          </Typography>
        </Box>
      ) : (
        <Box>
          {picks.map((p, i) => <ValuePickRow key={i} pick={p} />)}
        </Box>
      )}
    </Box>
  );
}

ValuePicksTab.propTypes = {
  h2hData: PropTypes.array,
  homeRecent: PropTypes.array,
  awayRecent: PropTypes.array,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
  oddsData: PropTypes.array,
};

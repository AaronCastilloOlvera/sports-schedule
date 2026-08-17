import { Box, Chip, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import PropTypes from 'prop-types';

export const MARKET_ICONS = {
  corners:      '⛳',
  goals:        '⚽',
  yellow_cards: '🟡',
  btts:         'vs',
};

export const CONF_COLOR = (c) => c >= 72 ? '#2e7d32' : c >= 62 ? '#f57c00' : '#1565c0';

const BET_SEARCH = {
  goals:        { patterns: [/^goals over\/under$/i, /^over\/under$/i], books: ['bet365','betano','1xbet'] },
  corners:      { patterns: [/^corners over under$/i],                  books: ['bet365','1xbet','betano'] },
  yellow_cards: { patterns: [/^yellow over\/under$/i, /^cards over\/under$/i], books: ['1xbet','bet365','betano'] },
  btts:         { patterns: [/^both teams score$/i],                    books: ['bet365','betano','1xbet'] },
};

export function findOdd(oddsData, market, side, line) {
  const cfg = BET_SEARCH[market];
  if (!cfg || !oddsData?.length) return null;
  const targetVal = market === 'btts'
    ? (side === 'yes' ? 'Yes' : 'No')
    : `${side === 'over' ? 'Over' : 'Under'} ${line}`;
  const allBMs = oddsData.flatMap(e => e.bookmakers || []);
  for (const prefBook of cfg.books) {
    const bm = allBMs.find(b => b.name.toLowerCase() === prefBook);
    if (!bm) continue;
    for (const pat of cfg.patterns) {
      const bet = bm.bets?.find(b => pat.test(b.name));
      if (!bet) continue;
      const v = bet.values?.find(v => String(v.value) === targetVal);
      if (v) return { odd: parseFloat(v.odd), bookmaker: bm.name };
    }
  }
  return null;
}

export function ConfBar({ value }) {
  const color = CONF_COLOR(value);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          flex: 1, height: 8, borderRadius: 4,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 'bold', color, minWidth: 36, textAlign: 'right' }}>
        {value}%
      </Typography>
    </Box>
  );
}

ConfBar.propTypes = { value: PropTypes.number.isRequired };

export function MarketRow({ market, data, odd }) {
  const icon  = MARKET_ICONS[market] || '•';
  const color = CONF_COLOR(data.confidence);
  return (
    <Box sx={{ py: 1.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{icon}</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color }}>
            {data.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {data.note}
          </Typography>
        </Box>
        <ConfBar value={data.confidence} />
        {odd ? (
          <Tooltip title={odd.bookmaker} placement="top">
            <Chip
              label={odd.odd.toFixed(2)}
              size="small"
              sx={{ bgcolor: 'rgba(46,125,50,0.12)', color: '#2e7d32', fontWeight: 700, fontSize: 12, height: 24, minWidth: 44 }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Ningún bookmaker ofrece este mercado para este partido" placement="top">
            <Chip
              label="—"
              size="small"
              sx={{ bgcolor: 'action.hover', color: 'text.disabled', fontWeight: 700, fontSize: 12, height: 24, minWidth: 44 }}
            />
          </Tooltip>
        )}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ ml: 4.5 }}>
        {data.samples && Object.entries(data.samples)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => (
            <Chip
              key={k}
              label={`${k === 'h2h' ? 'H2H' : k === 'referee' ? 'Árb' : k === 'home' ? 'Casa' : 'Vis.'} ${n}p`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 10, height: 20 }}
            />
          ))}
      </Stack>
    </Box>
  );
}

MarketRow.propTypes = {
  market: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string,
    note: PropTypes.string,
    confidence: PropTypes.number,
    samples: PropTypes.object,
  }).isRequired,
  odd: PropTypes.shape({ odd: PropTypes.number, bookmaker: PropTypes.string }),
};

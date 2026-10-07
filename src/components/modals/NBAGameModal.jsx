import { Box, Chip, Dialog, DialogContent, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Close, SportsBasketball } from '@mui/icons-material';
import PropTypes from 'prop-types';
import LiveStatusChip from '../Futbol/Fixtures/LiveStatusChip';

// Lightweight — unlike football's H2H modal there's no head-to-head history
// source for NBA via this free API, so this just surfaces the game header
// plus whatever BetRadar already computed for it. No extra API calls needed:
// everything here comes from the `match` object Fixtures.jsx already holds.
const MARKET_META = {
  moneyline: { icon: '🏆', label: 'Ganador' },
  spread:    { icon: '⚖️', label: 'Hándicap' },
  total:     { icon: '🏀', label: 'Puntos' },
};

const confTone = (c) => (c >= 75 ? 'success' : c >= 68 ? 'warning' : 'info');

function TeamBlock({ team, align = 'left' }) {
  return (
    <Stack
      direction={align === 'right' ? 'row-reverse' : 'row'}
      spacing={1.25}
      alignItems="center"
      sx={{ flex: 1, minWidth: 0 }}
    >
      {team?.logo ? (
        <Box component="img" src={team.logo} alt={team.name}
          sx={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
      ) : (
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%', bgcolor: 'action.hover',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <SportsBasketball fontSize="small" />
        </Box>
      )}
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, textAlign: align, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {team?.name ?? '—'}
      </Typography>
    </Stack>
  );
}

TeamBlock.propTypes = {
  team: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  align: PropTypes.oneOf(['left', 'right']),
};

function PickItem({ pick }) {
  const meta = MARKET_META[pick.market] ?? { icon: '🏀', label: pick.market };
  const samples = Object.entries(pick.samples || {}).filter(([, n]) => n > 0);

  return (
    <Box sx={{ py: 1.25 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{meta.icon}</Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{pick.label}</Typography>
          {pick.note && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {pick.note}
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          label={`${pick.confidence}%`}
          color={confTone(pick.confidence)}
          sx={{ fontWeight: 700, minWidth: 50, height: 24 }}
        />
        <Tooltip title="DraftKings" placement="top">
          <Chip
            size="small"
            label={pick.odd ? Number(pick.odd).toFixed(2) : '—'}
            variant={pick.odd ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, minWidth: 48, height: 24, ...(pick.odd ? {} : { color: 'text.disabled' }) }}
          />
        </Tooltip>
      </Stack>

      {(pick.edge != null || samples.length > 0) && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ ml: 4, gap: 0.5 }}>
          {pick.edge != null && (
            <Chip size="small" variant="outlined" label={`Edge +${pick.edge}pp`} sx={{ fontSize: 10, height: 20 }} />
          )}
          {samples.map(([k, n]) => (
            <Chip key={k} size="small" variant="outlined" label={`${k} ${n}`} sx={{ fontSize: 10, height: 20 }} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

PickItem.propTypes = {
  pick: PropTypes.shape({
    market: PropTypes.string,
    label: PropTypes.string,
    note: PropTypes.string,
    confidence: PropTypes.number,
    odd: PropTypes.number,
    edge: PropTypes.number,
    samples: PropTypes.object,
  }).isRequired,
};

export default function NBAGameModal({ match, onClose }) {
  const picks = match?.betRadar?.top_picks ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            position: 'relative',
            width: { xs: '95%', sm: '90%' },
            maxWidth: 520,
            borderRadius: { xs: '16px', sm: '20px' },
            m: 0,
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute', right: 12, top: 12, zIndex: 10,
          width: 36, height: 36,
          bgcolor: 'action.selected',
          '&:hover': { bgcolor: 'action.focus' },
        }}
      >
        <Close sx={{ fontSize: 16 }} />
      </IconButton>

      {/* Header — teams, score, status. No stadium art (no venue-photo source
          for NBA via this API), so a flat card does the job instead of
          MatchHeader's blurred-background treatment. */}
      <Box sx={{ px: { xs: 2, sm: '20px' }, pt: { xs: '14px', sm: '18px' }, pb: '14px', borderBottom: '1px solid', borderColor: 'divider' }}>
        {match?.fixture?.venue?.name && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 1 }}>
            🏀 NBA · {match.fixture.venue.name}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ pr: 4 }}>
          <TeamBlock team={match?.teams?.home} />

          <Stack alignItems="center" spacing={0.75} sx={{ flexShrink: 0, px: 1 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {match?.goals?.home ?? 0} – {match?.goals?.away ?? 0}
            </Typography>
            {match?.fixture && <LiveStatusChip fixture={match.fixture} sport="nba" />}
          </Stack>

          <TeamBlock team={match?.teams?.away} align="right" />
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: { xs: 2, sm: '20px' }, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            BetRadar
          </Typography>
          {picks.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 14, py: 3, textAlign: 'center' }}>
              Sin análisis de BetRadar para este partido.
            </Typography>
          ) : (
            <Box>
              {picks.map((pick, i) => (
                <Box key={pick.market ?? i}>
                  {i > 0 && <Divider />}
                  <PickItem pick={pick} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

NBAGameModal.propTypes = {
  match: PropTypes.shape({
    teams: PropTypes.object,
    goals: PropTypes.object,
    fixture: PropTypes.object,
    betRadar: PropTypes.shape({ top_picks: PropTypes.array }),
  }),
  onClose: PropTypes.func.isRequired,
};

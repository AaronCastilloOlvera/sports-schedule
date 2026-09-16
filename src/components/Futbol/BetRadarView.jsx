import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Collapse, Divider,
  IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  CompareArrows, ExpandLess, ExpandMore, Flag,
  HelpOutline, SportsSoccer, Square,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api.js';

// ---------------------------------------------------------------------------
// Market identity — mirrors TicketModal so a pick reads the same on both screens
// ---------------------------------------------------------------------------
const MARKET_META = {
  goals:        { Icon: SportsSoccer,  color: '#4caf50', label: 'Goals'   },
  corners:      { Icon: Flag,          color: '#2196f3', label: 'Corners' },
  yellow_cards: { Icon: Square,        color: '#ffc107', label: 'Cards'   },
  btts:         { Icon: CompareArrows, color: '#9c27b0', label: 'BTTS'    },
};

const META = (market) => MARKET_META[market] || { Icon: HelpOutline, color: '#9e9e9e', label: market };

// MUI palette keys so both themes resolve correctly
const confTone = (c) => (c >= 75 ? 'success' : c >= 68 ? 'warning' : 'info');

const CONF_FILTERS = [
  { value: 70, label: '≥70%' },
  { value: 75, label: '≥75%' },
  { value: 0,  label: 'Todos' },
];

// ---------------------------------------------------------------------------
// Accuracy strip — the 7-day track record, shown where the decision is made
// ---------------------------------------------------------------------------
function AccuracyStrip({ accuracy }) {
  if (!accuracy?.settled) return null;

  const markets = Object.entries(accuracy.by_market)
    .sort(([, a], [, b]) => b.accuracy - a.accuracy);

  return (
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1.75, py: 1.25, mb: 2 }}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}
        >
          Efectividad {accuracy.days}d
        </Typography>

        <Chip
          size="small"
          label={`${accuracy.accuracy}%`}
          color={confTone(accuracy.accuracy)}
          sx={{ fontWeight: 700, height: 22 }}
        />

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ gap: 0.75 }}>
          {markets.map(([market, stat]) => {
            const { Icon, color, label } = META(market);
            return (
              <Tooltip key={market} title={`${label}: ${stat.wins}/${stat.total}`} placement="top">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Icon sx={{ fontSize: 15, color }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {stat.accuracy}%
                  </Typography>
                </Stack>
              </Tooltip>
            );
          })}
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {accuracy.wins}/{accuracy.settled} picks ganados con confianza ≥{accuracy.min_confidence}%
      </Typography>
    </Box>
  );
}

AccuracyStrip.propTypes = { accuracy: PropTypes.object };

// ---------------------------------------------------------------------------
// PickRow — one row per pick, not per fixture. The pick is the decision unit.
// ---------------------------------------------------------------------------
function PickRow({ pick, started }) {
  const [open, setOpen] = useState(false);
  const { Icon, color } = META(pick.market);
  const odd = pick.best_odd;

  return (
    <Box sx={{ opacity: started ? 0.5 : 1 }}>
      <Stack
        direction="row" spacing={1.25} alignItems="center"
        sx={{ px: 1.5, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen(o => !o)}
      >
        <Typography
          variant="body2"
          sx={{
            width: 42, flexShrink: 0, fontWeight: 700, textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            color: started ? 'text.disabled' : 'text.primary',
          }}
        >
          {dayjs(pick.kickoff).format('HH:mm')}
        </Typography>

        <Icon sx={{ fontSize: 20, color, flexShrink: 0 }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {pick.label}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {pick.home} vs {pick.away}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={`${pick.confidence}%`}
          color={confTone(pick.confidence)}
          sx={{ fontWeight: 700, minWidth: 50, height: 24 }}
        />

        <Tooltip title={odd ? odd.bookmaker : 'Sin momio disponible'} placement="top">
          <Chip
            size="small"
            label={odd ? odd.odd.toFixed(2) : '—'}
            variant={odd ? 'filled' : 'outlined'}
            sx={{
              minWidth: 52, height: 24, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              ...(odd ? {} : { color: 'text.disabled' }),
            }}
          />
        </Tooltip>

        <IconButton size="small" sx={{ flexShrink: 0 }}>
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 1.5, pl: 7 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {pick.note}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
            {pick.referee && (
              <Chip size="small" variant="outlined" label={`Árb. ${pick.referee}`} sx={{ fontSize: 10, height: 20 }} />
            )}
            {Object.entries(pick.samples || {})
              .filter(([, n]) => n > 0)
              .map(([k, n]) => (
                <Chip
                  key={k}
                  size="small"
                  variant="outlined"
                  label={`${{ h2h: 'H2H', referee: 'Árb', home: 'Casa', away: 'Vis.' }[k] || k} ${n}p`}
                  sx={{ fontSize: 10, height: 20 }}
                />
              ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

PickRow.propTypes = {
  pick: PropTypes.object.isRequired,
  started: PropTypes.bool,
};

// ---------------------------------------------------------------------------
// ParlayCard
// ---------------------------------------------------------------------------
function ParlayCard({ parlay }) {
  if (!parlay) return null;
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, px: 2, py: 1.5, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          Parlay del día
        </Typography>
        <Chip
          size="small"
          label={`~${parlay.combined_probability}%`}
          sx={{ bgcolor: 'rgba(255,255,255,0.22)', color: 'inherit', fontWeight: 700, height: 22 }}
        />
      </Stack>
      <Stack spacing={0.75}>
        {parlay.picks.map((pick, i) => {
          const { Icon } = META(pick.market);
          return (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <Icon sx={{ fontSize: 17, opacity: 0.9 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{pick.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }} noWrap>
                  {pick.fixture}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{pick.confidence}%</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

ParlayCard.propTypes = { parlay: PropTypes.object };

// ---------------------------------------------------------------------------
// BetRadarView
// ---------------------------------------------------------------------------
export default function BetRadarView() {
  const todayStr = dayjs().format('YYYY-MM-DD');

  const [date, setDate]             = useState(todayStr);
  const [loading, setLoading]       = useState(false);
  const [data, setData]             = useState(null);
  const [accuracy, setAccuracy]     = useState(null);
  const [error, setError]           = useState(null);
  const [minConf, setMinConf]       = useState(70);
  const [marketSel, setMarketSel]   = useState(null);
  const [showStarted, setShowStarted] = useState(false);

  useEffect(() => { load(date); }, [date]);

  useEffect(() => {
    apiClient.fetchBetRadarAccuracy(7, 70).then(setAccuracy).catch(() => setAccuracy(null));
  }, []);

  const load = (selectedDate) => {
    setLoading(true);
    setError(null);
    setData(null);

    apiClient.fetchBetRadarCached(selectedDate)
      .then(setData)
      .catch((err) => {
        if (err?.response?.status === 404) {
          return apiClient.fetchBetRadarSuggestions(selectedDate).then(setData);
        }
        throw err;
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || err?.message || 'error desconocido';
        const status = err?.response?.status;
        setError(status ? `Error ${status}: ${detail}` : `No se pudo conectar al backend: ${detail}`);
      })
      .finally(() => setLoading(false));
  };

  // Flatten fixture-grouped suggestions into a chronological pick feed
  const allPicks = useMemo(() => {
    if (!data?.suggestions) return [];
    return data.suggestions
      .flatMap(s => (s.top_picks || []).map(p => ({
        ...p,
        fixture_id: s.fixture_id,
        home: s.home_team.name,
        away: s.away_team.name,
        kickoff: s.date,
        referee: s.referee,
      })))
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  }, [data]);

  const filtered = useMemo(
    () => allPicks.filter(p =>
      p.confidence >= minConf && (marketSel === null || p.market === marketSel),
    ),
    [allPicks, minConf, marketSel],
  );

  const now = dayjs();
  const upcoming = filtered.filter(p => dayjs(p.kickoff).isAfter(now));
  const started  = filtered.filter(p => !dayjs(p.kickoff).isAfter(now));

  const marketsPresent = useMemo(
    () => [...new Set(allPicks.map(p => p.market))],
    [allPicks],
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
          Radar
        </Typography>
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 155 }}
        />
        {loading && <CircularProgress size={18} />}
      </Stack>

      <AccuracyStrip accuracy={accuracy} />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75, mb: 2 }}>
        {CONF_FILTERS.map(f => (
          <Chip
            key={f.value}
            label={f.label}
            size="small"
            onClick={() => setMinConf(f.value)}
            color={minConf === f.value ? 'primary' : 'default'}
            variant={minConf === f.value ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        ))}

        {marketsPresent.length > 1 && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}

        {marketsPresent.length > 1 && marketsPresent.map(market => {
          const { Icon, color, label } = META(market);
          const active = marketSel === market;
          return (
            <Chip
              key={market}
              size="small"
              icon={<Icon sx={{ fontSize: 15, color: active ? 'inherit' : `${color} !important` }} />}
              label={label}
              onClick={() => setMarketSel(active ? null : market)}
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          );
        })}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data && (
        <>
          <ParlayCard parlay={data.parlay_suggestion} />

          {filtered.length === 0 ? (
            <Alert severity="info">
              {allPicks.length === 0
                ? 'No hay picks para esta fecha.'
                : `Ningún pick supera el filtro (${allPicks.length} disponibles con menor confianza).`}
            </Alert>
          ) : (
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
              {upcoming.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
                  Todos los partidos de hoy ya empezaron.
                </Typography>
              )}

              {upcoming.map((pick, i) => (
                <Box key={`${pick.fixture_id}-${pick.market}`}>
                  {i > 0 && <Divider />}
                  <PickRow pick={pick} />
                </Box>
              ))}

              {started.length > 0 && (
                <>
                  <Divider />
                  <Stack
                    direction="row" alignItems="center" spacing={1}
                    onClick={() => setShowStarted(s => !s)}
                    sx={{ px: 2, py: 1.25, cursor: 'pointer', bgcolor: 'action.hover' }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1, fontWeight: 600 }}>
                      {started.length} pick{started.length !== 1 ? 's' : ''} de partidos ya iniciados
                    </Typography>
                    <IconButton size="small">
                      {showStarted ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                  </Stack>
                  <Collapse in={showStarted}>
                    {started.map((pick, i) => (
                      <Box key={`${pick.fixture_id}-${pick.market}`}>
                        {i > 0 && <Divider />}
                        <PickRow pick={pick} started />
                      </Box>
                    ))}
                  </Collapse>
                </>
              )}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
            {data.fixtures_analyzed} partidos analizados · {filtered.length} de {allPicks.length} picks mostrados
          </Typography>
        </>
      )}
    </Box>
  );
}

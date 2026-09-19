import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Collapse, Divider,
  IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import {
  AttachMoney, Bolt, CompareArrows, ExpandLess, ExpandMore, Flag,
  HelpOutline, LooksOne, SportsBaseball, SportsSoccer, Square,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api.js';

// ---------------------------------------------------------------------------
// Sports. Each one names its markets and how to reach its endpoints; the rest
// of the view is shape-agnostic because both backends emit the same pick object.
// ---------------------------------------------------------------------------
const MARKET_META = {
  // fútbol
  goals:        { Icon: SportsSoccer,   color: '#4caf50', label: 'Goles'     },
  corners:      { Icon: Flag,           color: '#2196f3', label: 'Córners'   },
  yellow_cards: { Icon: Square,         color: '#ffc107', label: 'Tarjetas'  },
  btts:         { Icon: CompareArrows,  color: '#9c27b0', label: 'BTTS'      },
  // MLB / LMB
  total:        { Icon: SportsBaseball, color: '#4caf50', label: 'Carreras'  },
  moneyline:    { Icon: AttachMoney,    color: '#00bcd4', label: 'Ganador'   },
  nrfi:         { Icon: LooksOne,       color: '#9c27b0', label: '1ª entrada'},
  hits:         { Icon: Bolt,           color: '#ff9800', label: 'Hits'      },
};

const META = (market) =>
  MARKET_META[market] || { Icon: HelpOutline, color: '#9e9e9e', label: market };

// Same icon family as the market to stay visually consistent; the color is
// what actually tells MLB and LMB apart at a glance since both play baseball.
const SPORT_META = {
  futbol: { Icon: SportsSoccer,   color: '#2e7d32', label: 'Fútbol' },
  mlb:    { Icon: SportsBaseball, color: '#c62828', label: 'MLB'    },
  lmb:    { Icon: SportsBaseball, color: '#f9a825', label: 'LMB'    },
};

const SPORTS = [
  {
    key: 'futbol',
    label: 'Fútbol',
    markets: ['goals', 'corners', 'yellow_cards', 'btts'],
    cached:      (date) => apiClient.fetchBetRadarCached(date),
    suggestions: (date) => apiClient.fetchBetRadarSuggestions(date),
    accuracy:    () => apiClient.fetchBetRadarAccuracy(7, 70),
  },
  {
    key: 'mlb',
    label: 'MLB',
    markets: ['total', 'moneyline', 'nrfi', 'hits'],
    experimental: true,
    cached:      (date) => apiClient.fetchMLBRadarCached(date, 'mlb'),
    suggestions: (date) => apiClient.fetchMLBRadarSuggestions(date, 'mlb'),
    accuracy:    () => apiClient.fetchMLBRadarAccuracy(7, 70, 'mlb'),
  },
  {
    key: 'lmb',
    label: 'LMB',
    markets: ['total', 'moneyline', 'nrfi', 'hits'],
    experimental: true,
    cached:      (date) => apiClient.fetchMLBRadarCached(date, 'lmb'),
    suggestions: (date) => apiClient.fetchMLBRadarSuggestions(date, 'lmb'),
    accuracy:    () => apiClient.fetchMLBRadarAccuracy(7, 70, 'lmb'),
  },
];

// MUI palette keys so both themes resolve correctly
const confTone = (c) => (c >= 75 ? 'success' : c >= 68 ? 'warning' : 'info');

const CONF_FILTERS = [
  { value: 70, label: '≥70%' },
  { value: 75, label: '≥75%' },
  { value: 0,  label: 'Todos' },
];

const SAMPLE_LABEL = {
  h2h: 'H2H', referee: 'Árb', home: 'Casa', away: 'Vis.',
  home_team: 'Local', away_team: 'Visita',
  home_pitcher: 'P. local', away_pitcher: 'P. visita',
  home_vs: 'Local vs', away_vs: 'Visita vs', total: 'Total',
};

/** Both backends emit the same pick object; only the wrapper differs. */
function flattenPicks(data) {
  if (!data?.suggestions) return [];
  return data.suggestions
    .flatMap((s, si) => (s.top_picks || []).map((p, pi) => {
      // MLB puts the first pitch in `game_date` and only the calendar day in
      // `date`; fútbol puts the full kickoff timestamp in `date`. Reading the
      // day-only string would parse as midnight and file every pick as already
      // started.
      const kickoff = s.game_date || s.date;
      const pitchers = [s.away_team?.pitcher?.name, s.home_team?.pitcher?.name].filter(Boolean);
      return {
        ...p,
        key: `${s.game_pk ?? s.fixture_id ?? si}-${pi}`,
        home: s.home_team?.name ?? '',
        away: s.away_team?.name ?? '',
        kickoff,
        // fútbol shows the referee here; MLB shows the announced starters
        context: pitchers.length ? pitchers.join(' vs ') : s.referee,
      };
    }))
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
}

/** One combined, chronologically sorted feed — each pick tagged with its sport. */
function flattenAllPicks(dataBySport) {
  return SPORTS
    .flatMap(s => flattenPicks(dataBySport[s.key]).map(p => ({ ...p, sport: s.key })))
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
}

// ---------------------------------------------------------------------------
// SportBadge — the "icon to tell them apart in the table"
// ---------------------------------------------------------------------------
function SportBadge({ sport, size = 16 }) {
  const meta = SPORT_META[sport] || SPORT_META.futbol;
  return (
    <Tooltip title={meta.label} placement="top">
      <meta.Icon sx={{ fontSize: size, color: meta.color, flexShrink: 0 }} />
    </Tooltip>
  );
}

SportBadge.propTypes = { sport: PropTypes.string.isRequired, size: PropTypes.number };

// ---------------------------------------------------------------------------
// AccuracyStrip — trailing track record, one line per sport with settled picks
// ---------------------------------------------------------------------------
function AccuracyStrip({ accuracyBySport }) {
  const entries = SPORTS
    .map(s => [s, accuracyBySport[s.key]])
    .filter(([, acc]) => acc?.settled);

  if (!entries.length) return null;

  return (
    <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, px: 1.75, py: 1.25, mb: 2 }}>
      <Stack spacing={1}>
        {entries.map(([sport, acc]) => {
          const markets = Object.entries(acc.by_market || {}).sort(([, a], [, b]) => b.accuracy - a.accuracy);
          return (
            <Stack key={sport.key} direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
              <SportBadge sport={sport.key} />
              <Chip
                size="small"
                label={`${acc.accuracy}%`}
                color={confTone(acc.accuracy)}
                sx={{ fontWeight: 700, height: 22 }}
              />
              <Typography variant="caption" color="text.secondary">
                {acc.wins}/{acc.settled} · {acc.days}d
              </Typography>

              <Box sx={{ flex: 1 }} />

              <Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ gap: 0.75 }}>
                {markets.map(([market, stat]) => {
                  const { Icon, color, label } = META(market);
                  return (
                    <Tooltip key={market} title={`${label}: ${stat.wins}/${stat.total}`} placement="top">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Icon sx={{ fontSize: 15, color }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {stat.accuracy}%
                        </Typography>
                      </Stack>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

AccuracyStrip.propTypes = { accuracyBySport: PropTypes.object.isRequired };

// ---------------------------------------------------------------------------
// PickRow — one row per pick. The pick, not the game, is the decision unit.
// ---------------------------------------------------------------------------
function PickRow({ pick, started }) {
  const [open, setOpen] = useState(false);
  const { Icon, color } = META(pick.market);
  const odd = pick.best_odd || pick.odd;
  const oddValue = typeof odd === 'object' && odd !== null ? odd.odd : odd;
  const oddBook = typeof odd === 'object' && odd !== null ? odd.bookmaker : null;

  return (
    <Box sx={{ opacity: started ? 0.5 : 1 }}>
      <Stack
        direction="row" spacing={1.25} alignItems="center"
        sx={{ px: 1.5, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen(o => !o)}
      >
        <SportBadge sport={pick.sport} />

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
            {pick.away} @ {pick.home}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={`${pick.confidence}%`}
          color={confTone(pick.confidence)}
          sx={{ fontWeight: 700, minWidth: 50, height: 24 }}
        />

        <Tooltip title={oddBook || 'Sin momio disponible'} placement="top">
          <Chip
            size="small"
            label={oddValue ? Number(oddValue).toFixed(2) : '—'}
            variant={oddValue ? 'filled' : 'outlined'}
            sx={{
              minWidth: 52, height: 24, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              ...(oddValue ? {} : { color: 'text.disabled' }),
            }}
          />
        </Tooltip>

        <IconButton size="small" sx={{ flexShrink: 0 }}>
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 1.5, pl: 7.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {pick.note}
          </Typography>
          <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.5 }}>
            {pick.context && (
              <Chip size="small" variant="outlined" label={pick.context} sx={{ fontSize: 10, height: 20 }} />
            )}
            {Object.entries(pick.samples || {})
              .filter(([, n]) => n > 0)
              .map(([k, n]) => (
                <Chip
                  key={k}
                  size="small"
                  variant="outlined"
                  label={`${SAMPLE_LABEL[k] || k} ${n}`}
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
function ParlayCard({ parlay, sport }) {
  if (!parlay?.picks?.length) return null;
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, px: 2, py: 1.5, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <SportBadge sport={sport} size={15} />
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            Combinada del día
          </Typography>
        </Stack>
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
                  {pick.fixture || pick.game}
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

ParlayCard.propTypes = { parlay: PropTypes.object, sport: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// BetRadarView
// ---------------------------------------------------------------------------
export default function BetRadarView() {
  const [date, setDate]                 = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading]           = useState(false);
  const [dataBySport, setDataBySport]   = useState({});
  const [accuracyBySport, setAccuracyBySport] = useState({});
  const [error, setError]               = useState(null);
  const [minConf, setMinConf]           = useState(70);
  const [marketSel, setMarketSel]       = useState(null);
  const [activeSports, setActiveSports] = useState(() => new Set(SPORTS.map(s => s.key)));
  const [showStarted, setShowStarted]   = useState(false);

  // Every sport for the selected date, fetched in parallel — one slow or
  // failing sport no longer blocks the others from showing up.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDataBySport({});
    setMarketSel(null);

    Promise.allSettled(
      SPORTS.map(s => s.cached(date).catch((err) => {
        if (err?.response?.status === 404) return s.suggestions(date);
        throw err;
      })),
    ).then((results) => {
      if (cancelled) return;
      const next = {};
      let anyOk = false;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') { next[SPORTS[i].key] = r.value; anyOk = true; }
      });
      setDataBySport(next);
      if (!anyOk) setError('No se pudo conectar al backend.');
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(SPORTS.map(s => s.accuracy())).then((results) => {
      if (cancelled) return;
      const next = {};
      results.forEach((r, i) => { if (r.status === 'fulfilled') next[SPORTS[i].key] = r.value; });
      setAccuracyBySport(next);
    });
    return () => { cancelled = true; };
  }, []);

  const toggleSport = (key) => {
    setActiveSports(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const allPicks = useMemo(() => flattenAllPicks(dataBySport), [dataBySport]);

  const filtered = useMemo(
    () => allPicks.filter(p =>
      activeSports.has(p.sport) &&
      p.confidence >= minConf &&
      (marketSel === null || p.market === marketSel),
    ),
    [allPicks, activeSports, minConf, marketSel],
  );

  const now = dayjs();
  const upcoming = filtered.filter(p => dayjs(p.kickoff).isAfter(now));
  const started  = filtered.filter(p => !dayjs(p.kickoff).isAfter(now));

  const marketsPresent = useMemo(() => {
    const present = new Set(allPicks.filter(p => activeSports.has(p.sport)).map(p => p.market));
    const order = SPORTS.flatMap(s => s.markets);
    return order.filter((m, i) => present.has(m) && order.indexOf(m) === i);
  }, [allPicks, activeSports]);

  const hasExperimental = SPORTS.some(s => s.experimental && activeSports.has(s.key) && dataBySport[s.key]);

  const analyzed = SPORTS.reduce((sum, s) => {
    if (!activeSports.has(s.key)) return sum;
    const d = dataBySport[s.key];
    return sum + (d?.games_analyzed ?? d?.fixtures_analyzed ?? 0);
  }, 0);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
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

      {/* ── Sport filter — the toggle that replaced the old tabs ────────────── */}
      <Stack direction="row" spacing={0.75} sx={{ mb: 1.5 }}>
        {SPORTS.map(s => {
          const meta = SPORT_META[s.key];
          const active = activeSports.has(s.key);
          return (
            <Chip
              key={s.key}
              size="small"
              icon={<meta.Icon sx={{ fontSize: 15, color: active ? 'inherit' : `${meta.color} !important` }} />}
              label={s.label}
              onClick={() => toggleSport(s.key)}
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
          );
        })}
      </Stack>

      {hasExperimental && (
        <Alert severity="warning" sx={{ mb: 2, py: 0.25 }}>
          MLB/LMB son experimentales — el backtest no encontró ventaja sobre apostar el lado obvio. Úsalos como referencia, no como recomendación.
        </Alert>
      )}

      <AccuracyStrip accuracyBySport={accuracyBySport} />

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.75, mb: 2 }}>
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

      {SPORTS.map(s => (
        activeSports.has(s.key)
          ? <ParlayCard key={s.key} sport={s.key} parlay={dataBySport[s.key]?.parlay_suggestion} />
          : null
      ))}

      {filtered.length === 0 ? (
        <Alert severity="info">
          {allPicks.length === 0
            ? 'No hay picks para esta fecha.'
            : `Ningún pick supera el filtro (${allPicks.length} disponibles con otros filtros).`}
        </Alert>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          {upcoming.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>
              Todos los juegos de esta fecha ya empezaron.
            </Typography>
          )}

          {upcoming.map((pick, i) => (
            <Box key={pick.key}>
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
                  {started.length} pick{started.length !== 1 ? 's' : ''} de juegos ya iniciados
                </Typography>
                <IconButton size="small">
                  {showStarted ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              </Stack>
              <Collapse in={showStarted}>
                {started.map((pick, i) => (
                  <Box key={pick.key}>
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
        {analyzed} juegos analizados · {filtered.length} de {allPicks.length} picks mostrados
      </Typography>
    </Box>
  );
}

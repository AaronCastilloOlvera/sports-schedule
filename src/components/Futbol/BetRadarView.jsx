import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Collapse, Divider,
  IconButton, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import {
  AttachMoney, Balance, Bolt, Cancel, CheckCircle, CompareArrows, ExpandLess, ExpandMore, Flag,
  HelpOutline, LooksOne, SportsBaseball, SportsBasketball, SportsFootball, SportsSoccer, Square,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api.js';
import LivePulseDot from './LivePulseDot';

const MARKET_META = {
  // fútbol
  goals:        { Icon: SportsSoccer,   color: '#4caf50', label: 'Goles'     },
  corners:      { Icon: Flag,           color: '#2196f3', label: 'Córners'   },
  yellow_cards: { Icon: Square,         color: '#ffc107', label: 'Tarjetas'  },
  btts:         { Icon: CompareArrows,  color: '#9c27b0', label: 'BTTS'      },
  // MLB (NFL también usa moneyline/total — ver override abajo)
  total:        { Icon: SportsBaseball, color: '#4caf50', label: 'Carreras'  },
  moneyline:    { Icon: AttachMoney,    color: '#00bcd4', label: 'Ganador'   },
  nrfi:         { Icon: LooksOne,       color: '#9c27b0', label: '1ª entrada'},
  hits:         { Icon: Bolt,           color: '#ff9800', label: 'Hits'      },
  // NFL
  spread:       { Icon: Balance,        color: '#795548', label: 'Hándicap' },
};

// 'total' significa runs en MLB pero puntos en NFL/NBA — mismo key, override.
const MARKET_META_OVERRIDE = {
  nfl: { total: { Icon: SportsFootball, color: '#4caf50', label: 'Puntos' } },
  nba: { total: { Icon: SportsBasketball, color: '#4caf50', label: 'Puntos' } },
};

const META = (market, sport) =>
  MARKET_META_OVERRIDE[sport]?.[market] || MARKET_META[market]
  || { Icon: HelpOutline, color: '#9e9e9e', label: market };

const SPORT_META = {
  futbol: { Icon: SportsSoccer,   color: '#2e7d32', label: 'Fútbol' },
  mlb:    { Icon: SportsBaseball, color: '#c62828', label: 'MLB'    },
  nfl:    { Icon: SportsFootball, color: '#6d4c41', label: 'NFL'    },
  nba:    { Icon: SportsBasketball, color: '#ef6c00', label: 'NBA' },
};

const SPORTS = [
  {
    key: 'futbol',
    label: 'Fútbol',
    markets: ['goals', 'corners', 'yellow_cards', 'btts'],
    cached:      (date) => apiClient.fetchBetRadarCached(date),
    suggestions: (date) => apiClient.fetchBetRadarSuggestions(date),
    accuracy:    () => apiClient.fetchBetRadarAccuracy(7, 70),
    results:     (date) => apiClient.fetchBetRadarResults(date),
  },
  {
    key: 'mlb',
    label: 'MLB',
    markets: ['total', 'moneyline', 'nrfi', 'hits'],
    cached:      (date) => apiClient.fetchMLBRadarCached(date, 'mlb'),
    suggestions: (date) => apiClient.fetchMLBRadarSuggestions(date, 'mlb'),
    accuracy:    () => apiClient.fetchMLBRadarAccuracy(7, 70, 'mlb'),
    results:     (date) => apiClient.fetchMLBRadarResults(date),
  },
  {
    key: 'nfl',
    label: 'NFL',
    markets: ['moneyline', 'spread', 'total'],
    cached:      (date) => apiClient.fetchNFLRadarCached(date),
    suggestions: (date) => apiClient.fetchNFLRadarSuggestions(date),
    accuracy:    () => apiClient.fetchNFLRadarAccuracy(7, 70),
    results:     (date) => apiClient.fetchNFLRadarResults(date),
  },
  {
    key: 'nba',
    label: 'NBA',
    markets: ['moneyline', 'spread', 'total'],
    cached:      (date) => apiClient.fetchNBARadarCached(date),
    suggestions: (date) => apiClient.fetchNBARadarSuggestions(date),
    accuracy:    () => apiClient.fetchNBARadarAccuracy(7, 70),
    results:     (date) => apiClient.fetchNBARadarResults(date),
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
      // MLB's `date` is day-only (would parse as midnight); game_date has the time.
      const kickoff = s.game_date || s.date;
      const pitchers = [s.away_team?.pitcher?.name, s.home_team?.pitcher?.name].filter(Boolean);
      return {
        ...p,
        key: `${s.game_pk ?? s.fixture_id ?? si}-${pi}`,
        // fixture_id (fútbol) / event_id (NFL, NBA) / game_pk (MLB) — the key of each /results payload
        game_id: s.fixture_id ?? s.event_id ?? s.game_pk,
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

// Tags consecutive same-match picks with an alternating `tint` for a shared background.
function withGroupTint(picks) {
  let groupIdx = -1;
  let prevGroupKey = null;
  return picks.map((pick) => {
    const groupKey = `${pick.home}|${pick.away}|${pick.kickoff}`;
    if (groupKey !== prevGroupKey) {
      groupIdx++;
      prevGroupKey = groupKey;
    }
    return { pick, tint: groupIdx % 2 === 1 };
  });
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
// AccuracyStrip — one line per sport with settled picks
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
                  const { Icon, color, label } = META(market, sport.key);
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
// PickRow — one row per pick, not per game
// ---------------------------------------------------------------------------
// Shared by both layouts — only the collapsed row differs
function PickDetail({ pick, indent }) {
  return (
    <Box sx={{ px: 2, pb: 1.5, pl: indent }}>
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
  );
}

PickDetail.propTypes = { pick: PropTypes.object.isRequired, indent: PropTypes.number.isRequired };

function OddChip({ oddValue, oddBook, sx }) {
  return (
    <Tooltip title={oddBook || 'Sin momio disponible'} placement="top">
      <Chip
        size="small"
        label={oddValue ? Number(oddValue).toFixed(2) : '—'}
        variant={oddValue ? 'filled' : 'outlined'}
        sx={{
          fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          ...(oddValue ? {} : { color: 'text.disabled' }),
          ...sx,
        }}
      />
    </Tooltip>
  );
}

OddChip.propTypes = { oddValue: PropTypes.number, oddBook: PropTypes.string, sx: PropTypes.object };

// ---------------------------------------------------------------------------
// Pick results — live/final grading from each sport's /results endpoint
// ---------------------------------------------------------------------------
// tone = MUI palette key used for the row stripe and the result text
const RESULT_META = {
  won:     { tone: 'success.main' },
  lost:    { tone: 'error.main' },
  push:    { tone: 'text.disabled' },
  winning: { tone: 'success.main',   live: true },
  losing:  { tone: 'error.main',     live: true },
  even:    { tone: 'text.secondary', live: true },
  void:    { tone: 'text.disabled' },
  unknown: { tone: 'text.disabled' },
};

/** Attaches the backend grading for this exact pick (same market/side/line), if any. */
function attachResult(pick, resultsByGame) {
  const entry = resultsByGame?.[pick.game_id];
  if (!entry) return pick;
  const graded = entry.picks.find(r => r.market === pick.market && r.side === pick.side && r.line === (pick.line ?? null));
  if (!graded || !RESULT_META[graded.state]) return pick;
  return { ...pick, result: graded, live: entry };
}

const fmtMargin = (n) => String(Number(Math.abs(n).toFixed(1)));
const OVER_UNDER_MARKETS = new Set(['goals', 'corners', 'yellow_cards', 'total', 'hits']);

function verdict(pick) {
  const { state, actual, margin, line } = pick.result;
  const m = margin != null ? fmtMargin(margin) : null;
  if (state === 'void') return 'anulado';
  if (state === 'unknown') return 'sin estadísticas';

  if (OVER_UNDER_MARKETS.has(pick.market)) {
    const text = {
      won:     `ganó por ${m}`,
      lost:    pick.side === 'over' ? `le faltó ${m}` : `se pasó por ${m}`,
      push:    'justo en la línea',
      winning: `margen de ${m}`,
      losing:  `le faltan ${m}`,
    }[state];
    return `${actual} de ${line} — ${text}`;
  }
  if (pick.market === 'spread') {
    return {
      won: `cubrió por ${m}`, lost: `le faltaron ${m}`, push: 'empate con la línea',
      winning: `cubriendo por ${m}`, losing: `le faltan ${m}`, even: 'justo en la línea',
    }[state];
  }
  if (pick.market === 'moneyline') {
    return {
      won: `ganó por ${m}`, lost: `perdió por ${m}`, push: 'empate',
      winning: `arriba por ${m}`, losing: `abajo por ${m}`, even: 'empatados',
    }[state];
  }
  if (pick.market === 'nrfi') {
    if (actual > 0) return `${actual} carrera${actual === 1 ? '' : 's'} en la 1ª`;
    return RESULT_META[state].live ? '1ª entrada en curso' : 'sin carreras en la 1ª';
  }
  // btts: the score already says it once settled
  if (state === 'winning') return 'va ganando';
  if (state === 'losing') return 'va perdiendo';
  return null;
}

/** "Final 1-1 · 2 de 3.5 — ganó por 1.5" — the outcome in words, no signed margins to decode. */
function resultText(pick) {
  const { live } = pick;
  const home = live.home_score ?? live.home_goals;
  const away = live.away_score ?? live.away_goals;
  // away-home, the same order as the "away @ home" line it sits next to
  const score = home != null ? `${away}-${home}` : null;
  const when = live.final ? 'Final' : (live.clock ?? (live.elapsed != null ? `${live.elapsed}'` : null));
  return [[when, score].filter(Boolean).join(' '), verdict(pick)].filter(Boolean).join(' · ');
}

const LINE_AT = 0.6; // where the line marker sits along the bar, unless the value overshoots

/** Progress toward the line: fill = actual value, tick = the line, colored by the pick's state. */
function ProgressToLine({ result }) {
  const { actual, line, state } = result;
  const max = Math.max(line / LINE_AT, actual);
  const pct = (v) => `${Math.min(v / max, 1) * 100}%`;
  return (
    <Box sx={{ position: 'relative', height: 4, maxWidth: 240, mt: 0.75, borderRadius: 2, bgcolor: 'action.hover' }}>
      <Box sx={{
        height: '100%', width: pct(actual), borderRadius: 2,
        bgcolor: RESULT_META[state].tone, transition: 'width 0.6s ease',
      }} />
      <Box sx={{ position: 'absolute', top: -3, bottom: -3, left: pct(line), width: 2, borderRadius: 1, bgcolor: 'text.secondary' }} />
    </Box>
  );
}

ProgressToLine.propTypes = { result: PropTypes.object.isRequired };

function ScoredDot({ label, scored }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>{label}</Typography>
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%', border: '1.5px solid',
        borderColor: scored ? 'text.primary' : 'text.disabled',
        bgcolor: scored ? 'text.primary' : 'transparent',
      }} />
    </Stack>
  );
}

ScoredDot.propTypes = { label: PropTypes.string.isRequired, scored: PropTypes.bool };

/** Visual companion to resultText: a bar for over/under markets, scored-dots for BTTS. */
function PickProgress({ pick }) {
  const { result, live } = pick;
  if (OVER_UNDER_MARKETS.has(pick.market) && result.actual != null && result.line != null) {
    return <ProgressToLine result={result} />;
  }
  if (pick.market === 'btts' && live.home_goals != null) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ mt: 0.75 }}>
        <ScoredDot label="Visita" scored={live.away_goals > 0} />
        <ScoredDot label="Local" scored={live.home_goals > 0} />
      </Stack>
    );
  }
  return null;
}

PickProgress.propTypes = { pick: PropTypes.object.isRequired };

function ResultIcon({ state }) {
  if (state === 'won') return <CheckCircle sx={{ fontSize: 17, color: 'success.main', flexShrink: 0 }} />;
  if (state === 'lost') return <Cancel sx={{ fontSize: 17, color: 'error.main', flexShrink: 0 }} />;
  if (RESULT_META[state]?.live) return <LivePulseDot />;
  return null;
}

ResultIcon.propTypes = { state: PropTypes.string.isRequired };

function PickRow({ pick, started }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { Icon, color } = META(pick.market, pick.sport);
  const odd = pick.best_odd || pick.odd;
  const oddValue = typeof odd === 'object' && odd !== null ? odd.odd : odd;
  const oddBook = typeof odd === 'object' && odd !== null ? odd.bookmaker : null;
  const time = dayjs(pick.kickoff).format('HH:mm');
  // A started pick with a grade is the interesting part — only dim it while there's nothing to show.
  const dimmed = started && !pick.result;
  const resultMeta = pick.result ? RESULT_META[pick.result.state] : null;
  // Inset shadow instead of a border so graded and ungraded rows keep the same text alignment.
  const stripeColor = resultMeta && resultMeta.tone.split('.').reduce((o, k) => o?.[k], theme.palette);
  const rowSx = {
    opacity: dimmed ? 0.5 : 1,
    ...(stripeColor && { boxShadow: `inset 4px 0 0 ${resultMeta.live ? alpha(stripeColor, 0.5) : stripeColor}` }),
  };
  const label = (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
      {pick.result && <ResultIcon state={pick.result.state} />}
      <Typography variant="body2" sx={{ fontWeight: isMobile ? 700 : 600, lineHeight: 1.3 }} noWrap={!isMobile}>
        {pick.label}
      </Typography>
    </Stack>
  );
  const result = pick.result && (
    <Box component="span" sx={{ color: resultMeta.tone, fontWeight: 600 }}>{resultText(pick)}</Box>
  );

  // Mobile: pick label gets its own line instead of being squeezed and truncated.
  if (isMobile) {
    return (
      <Box sx={rowSx}>
        <Stack
          spacing={0.5} onClick={() => setOpen(o => !o)}
          sx={{ px: 1.5, py: 1, cursor: 'pointer', '&:active': { bgcolor: 'action.hover' } }}
        >
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: started ? 'text.disabled' : 'text.secondary' }}
            >
              {time}
            </Typography>
            <SportBadge sport={pick.sport} size={13} />
            <Icon sx={{ fontSize: 15, color, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }} />
            <Chip
              size="small" label={`${pick.confidence}%`} color={confTone(pick.confidence)}
              sx={{ fontWeight: 700, height: 20, fontSize: 11, '& .MuiChip-label': { px: 0.75 } }}
            />
          </Stack>

          {label}

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {pick.away} @ {pick.home}
            </Typography>
            <OddChip oddValue={oddValue} oddBook={oddBook} sx={{ height: 20, fontSize: 11, '& .MuiChip-label': { px: 0.75 } }} />
          </Stack>

          {result && <Typography variant="caption">{result}</Typography>}
          {pick.result && <PickProgress pick={pick} />}
        </Stack>

        <Collapse in={open}>
          <PickDetail pick={pick} indent={2} />
        </Collapse>
      </Box>
    );
  }

  return (
    <Box sx={rowSx}>
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
          {time}
        </Typography>

        <Icon sx={{ fontSize: 20, color, flexShrink: 0 }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {label}
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {pick.away} @ {pick.home}{result && <> · {result}</>}
          </Typography>
          {pick.result && <PickProgress pick={pick} />}
        </Box>

        <Chip
          size="small"
          label={`${pick.confidence}%`}
          color={confTone(pick.confidence)}
          sx={{ fontWeight: 700, minWidth: 50, height: 24 }}
        />

        <OddChip oddValue={oddValue} oddBook={oddBook} sx={{ minWidth: 52, height: 24 }} />

        <IconButton size="small" sx={{ flexShrink: 0 }}>
          {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <PickDetail pick={pick} indent={7.5} />
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
          const { Icon } = META(pick.market, sport);
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
  const [resultsBySport, setResultsBySport] = useState({});

  // Pick grading for every sport, in parallel. Polled only for today — past dates are already final.
  useEffect(() => {
    let cancelled = false;
    setResultsBySport({});
    const load = () => Promise.allSettled(SPORTS.map(s => s.results(date))).then((rs) => {
      if (cancelled) return;
      const next = {};
      rs.forEach((r, i) => { if (r.status === 'fulfilled') next[SPORTS[i].key] = r.value || {}; });
      setResultsBySport(next);
    });
    load();
    if (date !== dayjs().format('YYYY-MM-DD')) return () => { cancelled = true; };
    const id = setInterval(load, Number(import.meta.env.VITE_POLLING_INTERVAL_MS) || 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [date]);

  // Fetched in parallel — one failing sport doesn't block the others.
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

  const allPicks = useMemo(
    () => flattenAllPicks(dataBySport).map(p => attachResult(p, resultsBySport[p.sport])),
    [dataBySport, resultsBySport],
  );

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
  const startedSummary = started.reduce((acc, p) => {
    const state = p.result?.state;
    if (state === 'won') acc.won++;
    else if (state === 'lost') acc.lost++;
    else if (RESULT_META[state]?.live) acc.live++;
    return acc;
  }, { won: 0, lost: 0, live: 0 });

  // {market, sport} pairs — sport resolves the total label override, null if shared
  const marketsPresent = useMemo(() => {
    const bySport = new Map();
    allPicks.forEach(p => {
      if (!activeSports.has(p.sport)) return;
      if (!bySport.has(p.market)) bySport.set(p.market, new Set());
      bySport.get(p.market).add(p.sport);
    });
    const order = SPORTS.flatMap(s => s.markets);
    const uniqueOrder = order.filter((m, i) => order.indexOf(m) === i);
    return uniqueOrder
      .filter(m => bySport.has(m))
      .map(m => {
        const sports = bySport.get(m);
        return { market: m, sport: sports.size === 1 ? [...sports][0] : null };
      });
  }, [allPicks, activeSports]);

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

        {marketsPresent.length > 1 && marketsPresent.map(({ market, sport }) => {
          const { Icon, color, label } = META(market, sport);
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

          {withGroupTint(upcoming).map(({ pick, tint }, i) => (
            <Box key={pick.key} sx={{ bgcolor: tint ? 'action.hover' : 'transparent' }}>
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
                {startedSummary.won > 0 && <Chip size="small" color="success" icon={<CheckCircle />} label={startedSummary.won} sx={{ fontWeight: 700, height: 22 }} />}
                {startedSummary.lost > 0 && <Chip size="small" color="error" icon={<Cancel />} label={startedSummary.lost} sx={{ fontWeight: 700, height: 22 }} />}
                {startedSummary.live > 0 && <Chip size="small" variant="outlined" label={`${startedSummary.live} en vivo`} sx={{ fontWeight: 700, height: 22 }} />}
                <IconButton size="small">
                  {showStarted ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              </Stack>
              <Collapse in={showStarted}>
                {withGroupTint(started).map(({ pick, tint }, i) => (
                  <Box key={pick.key} sx={{ bgcolor: tint ? 'action.hover' : 'transparent' }}>
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

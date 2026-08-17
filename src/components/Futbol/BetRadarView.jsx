import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse,
  Divider, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { ExpandLess, ExpandMore, SportsSoccer } from '@mui/icons-material';
import { apiClient } from '../../api/api.js';

const MARKET_ICONS = {
  corners:      '⛳',
  goals:        '⚽',
  yellow_cards: '🟡',
  btts:         'vs',
};

const CONF_COLOR = (c) => c >= 72 ? '#2e7d32' : c >= 62 ? '#f57c00' : '#1565c0';

// Bet name patterns per scout market, in preferred bookmaker order
const BET_SEARCH = {
  goals:        { patterns: [/^goals over\/under$/i, /^over\/under$/i], books: ['bet365','betano','1xbet'] },
  corners:      { patterns: [/^corners over under$/i],                  books: ['bet365','1xbet','betano'] },
  yellow_cards: { patterns: [/^yellow over\/under$/i, /^cards over\/under$/i], books: ['1xbet','bet365','betano'] },
  btts:         { patterns: [/^both teams score$/i],                    books: ['bet365','betano','1xbet'] },
};

function findOdd(oddsData, market, side, line) {
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

function ConfBar({ value }) {
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

function MarketRow({ market, data, odd }) {
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
        {odd && (
          <Tooltip title={odd.bookmaker} placement="top">
            <Chip
              label={odd.odd.toFixed(2)}
              size="small"
              sx={{ bgcolor: 'rgba(46,125,50,0.12)', color: '#2e7d32', fontWeight: 700, fontSize: 12, height: 24, minWidth: 44 }}
            />
          </Tooltip>
        )}
      </Stack>

      {/* Sample sizes */}
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

function FixtureCard({ item }) {
  const [open, setOpen]         = useState(false);
  const [oddsData, setOddsData] = useState(null);

  useEffect(() => {
    if (open && oddsData === null) {
      apiClient.fetchOdds(item.fixture_id)
        .then(res => setOddsData(res.data || []))
        .catch(() => setOddsData([]));
    }
  }, [open]);

  const bestPick = item.top_picks[0];
  const color    = CONF_COLOR(bestPick.confidence);

  return (
    <Box sx={{
      bgcolor: 'white', borderRadius: 2, boxShadow: 2,
      borderLeft: `4px solid ${color}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <Stack
        direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 2, py: 1.5, cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {item.home_team.name} vs {item.away_team.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {item.referee && (
              <Typography variant="caption" color="text.secondary">
                🏁 {item.referee}
              </Typography>
            )}
            {item.result && (
              <Chip label={`Resultado: ${item.result}`} size="small" color="default" sx={{ height: 18, fontSize: 10 }} />
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {/* Show top 2 picks as chips */}
          {item.top_picks.slice(0, 2).map((p, i) => (
            <Chip
              key={i}
              label={`${p.label} · ${p.confidence}%`}
              size="small"
              sx={{
                bgcolor: CONF_COLOR(p.confidence) + '18',
                color: CONF_COLOR(p.confidence),
                fontWeight: 600,
                display: { xs: i > 0 ? 'none' : 'flex', sm: 'flex' },
              }}
            />
          ))}
          <IconButton size="small">{open ? <ExpandLess /> : <ExpandMore />}</IconButton>
        </Stack>
      </Stack>

      {/* Expanded detail */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ px: 2, pb: 1.5 }}>
          {/* Data quality row */}
          <Stack direction="row" spacing={2} sx={{ pt: 1.5, pb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              📊 Datos: {item.home_locality_count}p casa · {item.away_locality_count}p vis. · {item.h2h_count}p H2H
            </Typography>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          {item.top_picks.map((p) => {
            const odd = oddsData ? findOdd(oddsData, p.market, p.side, p.line) : null;
            return <MarketRow key={p.market} market={p.market} data={p} odd={odd} />;
          })}
        </Box>
      </Collapse>
    </Box>
  );
}

function ParlayCard({ parlay }) {
  if (!parlay) return null;
  const [p1, p2] = parlay.picks;
  return (
    <Box sx={{
      bgcolor: '#1565c0', color: 'white', borderRadius: 2,
      p: 2, mb: 3,
    }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        🎯 Parlay sugerido del día
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {[p1, p2].map((pick, i) => (
          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                {pick.label}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {pick.fixture}
              </Typography>
            </Box>
            <Chip
              label={`${pick.confidence}%`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
            />
          </Stack>
        ))}
      </Stack>
      <Typography variant="caption" sx={{ opacity: 0.75 }}>
        Probabilidad combinada estimada: ~{parlay.combined_probability}% (asume independencia)
      </Typography>
    </Box>
  );
}

export default function BetRadarView() {
  const todayStr = new Date().toISOString().substring(0, 10);

  const [date, setDate]           = useState(todayStr);
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => { load(date); }, [date]);

  const load = (selectedDate) => {
    setLoading(true);
    setError(null);
    setData(null);
    setFromCache(false);

    // Try cache first; fall back to on-demand analysis
    apiClient.fetchBetRadarCached(selectedDate)
      .then(d => { setData(d); setFromCache(true); })
      .catch((err) => {
        if (err?.response?.status === 404) {
          return apiClient.fetchBetRadarSuggestions(selectedDate)
            .then(d => { setData(d); setFromCache(false); });
        }
        throw err;
      })
      .catch((err) => {
        const detail = err?.response?.data?.detail || err?.message || 'error desconocido';
        const status = err?.response?.status;
        setError(status
          ? `Error ${status}: ${detail}`
          : `No se pudo conectar al backend: ${detail}`);
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        BetRadar
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analiza córners, goles, tarjetas y BTTS usando localía + H2H + árbitro.
      </Typography>

      {/* Controls */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          label="Fecha"
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 180 }}
        />
        {loading && <CircularProgress size={20} />}
        {!loading && fromCache && (
          <Chip label="Redis cache" size="small" color="success" variant="outlined" />
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {data && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {data.fixtures_analyzed} partido{data.fixtures_analyzed !== 1 ? 's' : ''} analizados
            · {data.suggestions.length} con picks confiables
          </Typography>

          <ParlayCard parlay={data.parlay_suggestion} />

          {data.suggestions.length === 0 ? (
            <Alert severity="info">
              No se encontraron tendencias con suficiente confianza para esta fecha.
              Prueba con otra fecha o verifica que haya datos históricos en BD.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {data.suggestions.map((item) => (
                <FixtureCard key={item.fixture_id} item={item} />
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

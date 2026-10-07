import { useState, useEffect, useCallback } from 'react';
import {
  Alert, Avatar, Box, Card, CardActionArea, CardContent, Chip, CircularProgress,
  Divider, IconButton, Stack, Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api';
import BoxscoreModal from './BoxscoreModal';
import {
  fmtTime, inningDetail, outsLabel, isLive, isFinal, isPostponed, isCanceled, isWinner,
  getHomeCompetitor, getAwayCompetitor, teamColor, teamLogoUrl, teamInitials,
} from './baseballHelpers';

// Plain <img>, no colored circle behind it — falls back to the colored
// initials avatar only if the logo 404s.
function TeamLogo({ teamId, teamName, abbreviation }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = teamLogoUrl(abbreviation);

  if (logoUrl && !failed) {
    return (
      <Box
        component="img"
        src={logoUrl}
        alt={teamName}
        onError={() => setFailed(true)}
        sx={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }}
      />
    );
  }

  return (
    <Avatar sx={{ width: 26, height: 26, fontSize: 9, fontWeight: 700, bgcolor: teamColor(teamId), flexShrink: 0 }}>
      {teamInitials(teamName)}
    </Avatar>
  );
}

TeamLogo.propTypes = {
  teamId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  teamName: PropTypes.string,
  abbreviation: PropTypes.string,
};

// ── StatusChip ────────────────────────────────────────────────────────────────

function StatusChip({ game }) {
  if (isLive(game)) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main',
          animation: 'livePulse 1.5s ease-in-out infinite',
          '@keyframes livePulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.3 },
          },
        }} />
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'error.main' }}>EN VIVO</Typography>
      </Stack>
    );
  }
  if (isFinal(game)) {
    return <Chip label="Final" size="small" sx={{ fontSize: 11, height: 20 }} />;
  }
  if (isPostponed(game) || isCanceled(game)) {
    return (
      <Chip
        label={inningDetail(game) || (isCanceled(game) ? 'Cancelado' : 'Postergado')}
        size="small" color="warning" variant="outlined" sx={{ fontSize: 11, height: 20 }}
      />
    );
  }
  return (
    <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 500 }}>
      {fmtTime(game.date)}
    </Typography>
  );
}

StatusChip.propTypes = {
  game: PropTypes.object.isRequired,
};

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({ game, onClick }) {
  const away = getAwayCompetitor(game);
  const home = getHomeCompetitor(game);
  const awayPP = away.probables?.[0]?.athlete?.fullName;
  const homePP = home.probables?.[0]?.athlete?.fullName;
  const live = isLive(game);
  const final = isFinal(game);
  const showScore = live || final;

  return (
    <Card
      variant="outlined"
      sx={{ borderLeft: 3, borderLeftColor: live ? 'error.main' : 'divider', height: '100%' }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>

          {/* Header row: status + inning */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <StatusChip game={game} />
            {live && (
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {inningDetail(game)}
                {outsLabel(game) ? ` · ${outsLabel(game)}` : ''}
              </Typography>
            )}
          </Stack>

          {/* Teams */}
          {[['away', away], ['home', home]].map(([key, side]) => {
            const teamId = side.team?.id;
            const winner = final && isWinner(side);
            return (
              <Stack key={key} direction="row" alignItems="center" spacing={1} mb={0.5}>
                <TeamLogo teamId={teamId} teamName={side.team?.displayName} abbreviation={side.team?.abbreviation} />
                {/* Name */}
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: winner ? 700 : 400,
                    color: 'text.primary',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={side.team?.displayName}
                >
                  {winner && '★ '}
                  {side.team?.displayName ?? '—'}
                </Typography>
                {/* Score */}
                {showScore && (
                  <Typography sx={{
                    fontSize: 18,
                    fontWeight: winner ? 800 : 600,
                    minWidth: 24,
                    textAlign: 'right',
                    color: winner ? 'success.main' : 'text.primary',
                  }}>
                    {side.score ?? 0}
                  </Typography>
                )}
              </Stack>
            );
          })}

          {/* Footer: pitchers */}
          {(awayPP || homePP) && (
            <>
              <Divider sx={{ my: 0.75 }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                {live || final
                  ? `SP: ${awayPP ?? '?'}`
                  : `${awayPP ?? '?'} vs ${homePP ?? '?'}`}
              </Typography>
            </>
          )}

        </CardContent>
      </CardActionArea>
    </Card>
  );
}

GameCard.propTypes = {
  game: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

// ── BaseballSchedule (main) ───────────────────────────────────────────────────

export default function BaseballSchedule() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [games, setGames]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [openGame, setOpenGame]         = useState(null);

  const fetchGames = useCallback(() => {
    setLoading(true);
    setError(null);
    const dateStr = selectedDate.format('YYYY-MM-DD');
    apiClient.fetchBaseballSchedule(dateStr)
      .then(res => setGames(res.data ?? []))
      .catch(() => setError('Error al cargar los partidos.'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const live  = games.filter(isLive);
  const final = games.filter(isFinal);
  const pre   = games.filter(g => !isLive(g) && !isFinal(g));
  const ordered = [...live, ...pre, ...final];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          mb={2}
        >
          {/* Date navigator */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" color="primary" onClick={() => setSelectedDate(d => d.subtract(1, 'day'))}>
              <ChevronLeft />
            </IconButton>
            <DatePicker
              value={selectedDate}
              onChange={v => v && setSelectedDate(v)}
              format="DD/MM/YYYY"
              slotProps={{ textField: { size: 'small', sx: { minWidth: 160 } } }}
            />
            <IconButton size="small" color="primary" onClick={() => setSelectedDate(d => d.add(1, 'day'))}>
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>

        {/* ── Summary counts ───────────────────────────────────────────────── */}
        {!loading && !error && games.length > 0 && (
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            {live.length  > 0 && <Chip label={`${live.length} en vivo`}  color="error"   size="small" />}
            {pre.length   > 0 && <Chip label={`${pre.length} por jugar`} color="default" size="small" />}
            {final.length > 0 && <Chip label={`${final.length} finales`} color="success" size="small" variant="outlined" />}
          </Stack>
        )}

        {/* ── Content ──────────────────────────────────────────────────────── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : games.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 40 }}>⚾</Typography>
            <Typography color="text.secondary" mt={1}>Sin partidos para esta fecha.</Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}>
            {ordered.map(game => (
              <GameCard key={game.id} game={game} onClick={() => setOpenGame(game)} />
            ))}
          </Box>
        )}

        {/* ── Box score modal ───────────────────────────────────────────────── */}
        {openGame && (
          <BoxscoreModal game={openGame} onClose={() => setOpenGame(null)} />
        )}
      </Box>
    </LocalizationProvider>
  );
}

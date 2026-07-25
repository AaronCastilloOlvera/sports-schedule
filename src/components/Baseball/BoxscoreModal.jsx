import { useState, useEffect, useMemo } from 'react';
import {
  Alert, Avatar, Box, Card, CardContent, CircularProgress, Dialog, DialogContent, DialogTitle,
  Divider, IconButton, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
  ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api';
import {
  fmtTime, inningLabel, outsLabel, isLive, isFinal, isSuspended,
  playerHeadshotUrl, teamColor, teamInitials, teamLogoUrl,
  filterGamesVsOpponent, aggregateGames,
} from './baseballHelpers';

const HISTORY_SEASONS = 5;

function PitchingTable({ teamData }) {
  const pitchers = teamData?.pitchers ?? [];
  const players = teamData?.players ?? {};

  if (!pitchers.length) return (
    <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 2 }}>Sin datos de pitcheo.</Typography>
  );

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 380 }}>
        <TableHead>
          <TableRow>
            {['Lanzador', 'IP', 'H', 'R', 'ER', 'BB', 'K'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 0.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {pitchers.map((pid) => {
            const p = players[`ID${pid}`] ?? {};
            const st = p.stats?.pitching ?? {};
            const note = p.gameStatus?.note ?? '';
            return (
              <TableRow key={pid}>
                <TableCell sx={{ fontSize: 12, py: 0.5, whiteSpace: 'nowrap' }}>
                  {p.person?.fullName ?? pid}
                  {note && <Typography component="span" sx={{ fontSize: 10, color: 'text.secondary', ml: 0.5 }}>{note}</Typography>}
                </TableCell>
                {[st.inningsPitched, st.hits, st.runs, st.earnedRuns, st.baseOnBalls, st.strikeOuts].map((v, i) => (
                  <TableCell key={i} sx={{ fontSize: 12, py: 0.5 }}>{v ?? '—'}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

function BattingTable({ teamData }) {
  const batters = teamData?.batters ?? [];
  const players = teamData?.players ?? {};

  if (!batters.length) return (
    <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 2 }}>Sin datos de bateo.</Typography>
  );

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 420 }}>
        <TableHead>
          <TableRow>
            {['#', 'Bateador', 'Pos', 'AB', 'H', 'R', 'RBI', 'BB', 'K'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 0.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {batters.map((pid, i) => {
            const p = players[`ID${pid}`] ?? {};
            const st = p.stats?.batting ?? {};
            const pos = p.position?.abbreviation ?? '';
            return (
              <TableRow key={pid}>
                <TableCell sx={{ fontSize: 11, py: 0.5, color: 'text.disabled' }}>{i + 1}</TableCell>
                <TableCell sx={{ fontSize: 12, py: 0.5, whiteSpace: 'nowrap' }}>{p.person?.fullName ?? pid}</TableCell>
                <TableCell sx={{ fontSize: 11, py: 0.5, color: 'text.secondary' }}>{pos}</TableCell>
                {[st.atBats, st.hits, st.runs, st.rbi, st.baseOnBalls, st.strikeOuts].map((v, i2) => (
                  <TableCell key={i2} sx={{ fontSize: 12, py: 0.5 }}>{v ?? '—'}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

// Shared W/L reading from the pitcher's team perspective — same math backs
// both the desktop table and the mobile cards below.
function gameOutcome(g, finalScores) {
  const score = finalScores?.[g.game?.gamePk];
  if (!score) return { outcome: null, forScore: null, againstScore: null, color: 'text.secondary' };
  const forScore = g.isHome ? score.home : score.away;
  const againstScore = g.isHome ? score.away : score.home;
  const outcome = forScore > againstScore ? 'W' : forScore < againstScore ? 'L' : 'T';
  const color = outcome === 'W' ? '#2e7d32' : outcome === 'L' ? '#d32f2f' : 'text.secondary';
  return { outcome, forScore, againstScore, color };
}

function HistoricalCards({ games, finalScores }) {
  if (!games.length) return (
    <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 2 }}>Sin inicios contra este rival.</Typography>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {games.map((g, i) => {
        const { outcome, forScore, againstScore, color } = gameOutcome(g, finalScores);
        return (
          <Card key={g.game?.gamePk ?? i} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {g.date} · {g.isHome ? 'Local' : 'Visita'}
                </Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>
                  {outcome ? `${outcome} ${forScore}-${againstScore}` : '—'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
                {[['IP', g.stat?.inningsPitched], ['H', g.stat?.hits], ['ER', g.stat?.earnedRuns], ['BB', g.stat?.baseOnBalls], ['K', g.stat?.strikeOuts]].map(([label, v]) => (
                  <Box key={label} sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 10, color: 'text.disabled' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{v ?? '—'}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

HistoricalCards.propTypes = {
  games: PropTypes.array.isRequired,
  finalScores: PropTypes.object,
};

function HistoricalTable({ games, finalScores }) {
  if (!games.length) return (
    <Typography sx={{ color: 'text.secondary', fontSize: 13, py: 2 }}>Sin inicios contra este rival.</Typography>
  );

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow>
            {['Fecha', 'Sede', 'Resultado', 'IP', 'H', 'ER', 'BB', 'K'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 0.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {games.map((g, i) => {
            const { outcome, forScore, againstScore, color } = gameOutcome(g, finalScores);
            return (
              <TableRow key={g.game?.gamePk ?? i}>
                <TableCell sx={{ fontSize: 12, py: 0.5, whiteSpace: 'nowrap' }}>{g.date}</TableCell>
                <TableCell sx={{ fontSize: 12, py: 0.5 }}>{g.isHome ? 'Local' : 'Visita'}</TableCell>
                <TableCell sx={{ fontSize: 12, py: 0.5, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                  {outcome ? `${outcome} ${forScore}-${againstScore}` : '—'}
                </TableCell>
                {[g.stat?.inningsPitched, g.stat?.hits, g.stat?.earnedRuns, g.stat?.baseOnBalls, g.stat?.strikeOuts].map((v, j) => (
                  <TableCell key={j} sx={{ fontSize: 12, py: 0.5 }}>{v ?? '—'}</TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

HistoricalTable.propTypes = {
  games: PropTypes.array.isRequired,
  finalScores: PropTypes.object,
};

// Season stats for the two probable pitchers, headshot + W-L/ERA/SO — the
// "Gameday preview" strip. Kept visible regardless of game state, same as
// MLB.com does, since it's useful matchup context even mid-game.
function PitcherCard({ pitcher, stats, loading }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!pitcher?.id) {
    return (
      <Box sx={{
        flex: 1, textAlign: 'center', py: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderRadius: 2, bgcolor: 'action.hover',
      }}>
        <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Pitcher no confirmado</Typography>
      </Box>
    );
  }

  const headshotUrl = playerHeadshotUrl(pitcher.id);
  const hand = stats?.pitchHand?.code === 'L' ? 'LHP' : stats?.pitchHand?.code === 'R' ? 'RHP' : null;

  return (
    <Box sx={{
      flex: 1, textAlign: 'center', px: 1.5, py: 1.5, minWidth: 0,
      borderRadius: 2, bgcolor: 'action.hover',
    }}>
      {headshotUrl && !imgFailed ? (
        // MLB's headshot photos are 2:3 portraits (180x270), not square — a
        // circular Avatar would force a heavy crop just to fill the width.
        // Match the container to the real aspect ratio instead, so the whole
        // photo (cap to shoulders) shows without cropping.
        <Avatar
          variant="rounded"
          src={headshotUrl}
          onError={() => setImgFailed(true)}
          imgProps={{ style: { objectFit: 'cover', objectPosition: 'top' } }}
          sx={{ width: 64, height: 96, mx: 'auto', mb: 0.75, borderRadius: '12px', boxShadow: 1 }}
        />
      ) : (
        <Avatar variant="rounded" sx={{ width: 64, height: 96, mx: 'auto', mb: 0.75, borderRadius: '12px', bgcolor: teamColor(pitcher.id), fontSize: 18, boxShadow: 1 }}>
          {teamInitials(pitcher.fullName)}
        </Avatar>
      )}
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{pitcher.fullName}</Typography>
      {hand && <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 600 }}>{hand}</Typography>}
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>
        {loading
          ? 'Cargando…'
          : stats?.era != null
            ? `${stats.wins ?? 0}-${stats.losses ?? 0}, ${stats.era} ERA, ${stats.strikeOuts ?? 0} SO`
            : 'Sin stats de temporada'}
      </Typography>
    </Box>
  );
}

PitcherCard.propTypes = {
  pitcher: PropTypes.shape({ id: PropTypes.number, fullName: PropTypes.string }),
  stats: PropTypes.object,
  loading: PropTypes.bool,
};

function TeamRecord({ team }) {
  const record = team?.leagueRecord;
  if (!record) return null;
  return (
    <Typography component="span" sx={{ fontSize: 11, color: 'text.disabled', ml: 0.5 }}>
      ({record.wins}-{record.losses})
    </Typography>
  );
}

TeamRecord.propTypes = {
  team: PropTypes.shape({ leagueRecord: PropTypes.object }),
};

// Header team block — logo + name + record, mirroring MLB Gameday's matchup strip.
function TeamHeading({ team, align = 'left' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const id = team?.team?.id;
  const name = team?.team?.name;
  const logoUrl = teamLogoUrl(id);
  const row = (
    <Stack direction={align === 'right' ? 'row-reverse' : 'row'} spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
      {logoUrl && !imgFailed ? (
        <Box component="img" src={logoUrl} alt={name} onError={() => setImgFailed(true)}
          sx={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
      ) : (
        <Avatar sx={{ width: 32, height: 32, bgcolor: teamColor(id), fontSize: 12, flexShrink: 0 }}>
          {teamInitials(name)}
        </Avatar>
      )}
      <Typography sx={{
        fontWeight: 700, fontSize: 13, lineHeight: 1.2, whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis', textAlign: align,
      }}>
        {name}<TeamRecord team={team} />
      </Typography>
    </Stack>
  );
  return row;
}

TeamHeading.propTypes = {
  team: PropTypes.shape({ team: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }) }),
  align: PropTypes.oneOf(['left', 'right']),
};

export default function BoxscoreModal({ game, league = 'lmb', onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [box, setBox] = useState(null);
  const [loadingBox, setLoadingBox] = useState(true);
  const [pitcherStats, setPitcherStats] = useState({ home: null, away: null });
  const [loadingPitchers, setLoadingPitchers] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [side, setSide] = useState('away');
  const [venueFilter, setVenueFilter] = useState('all');
  const [historicalLogs, setHistoricalLogs] = useState({ home: [], away: [] });
  const [historicalFetched, setHistoricalFetched] = useState(false);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [finalScores, setFinalScores] = useState({});

  const away = game.teams?.away;
  const home = game.teams?.home;

  useEffect(() => {
    setLoadingBox(true);
    apiClient.fetchBaseballBoxscore(game.gamePk)
      .then(res => setBox(res.data))
      .catch(() => setBox(null))
      .finally(() => setLoadingBox(false));
  }, [game.gamePk]);

  useEffect(() => {
    const homeId = home?.probablePitcher?.id;
    const awayId = away?.probablePitcher?.id;
    if (!homeId && !awayId) { setLoadingPitchers(false); return; }

    setLoadingPitchers(true);
    Promise.all([
      homeId ? apiClient.fetchPitcherStats(homeId, league) : Promise.resolve({ data: null }),
      awayId ? apiClient.fetchPitcherStats(awayId, league) : Promise.resolve({ data: null }),
    ])
      .then(([homeStatsRes, awayStatsRes]) => {
        setPitcherStats({ home: homeStatsRes.data, away: awayStatsRes.data });
      })
      .catch(() => setPitcherStats({ home: null, away: null }))
      .finally(() => setLoadingPitchers(false));
  }, [home?.probablePitcher?.id, away?.probablePitcher?.id, league]);

  // Multi-season history is heavier (one API call per season, per pitcher) so
  // it's only fetched once the Histórico tab is actually opened, not eagerly.
  useEffect(() => {
    if (activeTab !== 2 || historicalFetched) return;
    const homeId = home?.probablePitcher?.id;
    const awayId = away?.probablePitcher?.id;
    if (!homeId && !awayId) { setHistoricalFetched(true); return; }

    setLoadingHistorical(true);
    Promise.all([
      homeId ? apiClient.fetchPitcherGameLog(homeId, league, HISTORY_SEASONS) : Promise.resolve({ data: [] }),
      awayId ? apiClient.fetchPitcherGameLog(awayId, league, HISTORY_SEASONS) : Promise.resolve({ data: [] }),
    ])
      .then(([homeLogRes, awayLogRes]) => setHistoricalLogs({ home: homeLogRes.data, away: awayLogRes.data }))
      .catch(() => setHistoricalLogs({ home: [], away: [] }))
      .finally(() => { setLoadingHistorical(false); setHistoricalFetched(true); });
  }, [activeTab, historicalFetched, home?.probablePitcher?.id, away?.probablePitcher?.id, league]);

  const teamData = box?.teams?.[side];
  const awayScore = away?.score ?? 0;
  const homeScore = home?.score ?? 0;

  // Histórico tab: same side/team toggle picks whose pitcher's multi-season
  // history to show, filtered against the other team and optionally by venue.
  const historicalPitcher = side === 'home' ? home?.probablePitcher : away?.probablePitcher;
  const historicalOpponent = side === 'home' ? away?.team : home?.team;
  const isHomeFilter = venueFilter === 'home' ? true : venueFilter === 'away' ? false : undefined;
  const historicalGames = useMemo(() => (
    filterGamesVsOpponent(
      side === 'home' ? historicalLogs.home : historicalLogs.away,
      historicalOpponent?.id,
      isHomeFilter,
    ).sort((a, b) => new Date(b.date) - new Date(a.date))
  ), [historicalLogs, side, historicalOpponent?.id, isHomeFilter]);
  const historicalSummary = aggregateGames(historicalGames);

  useEffect(() => {
    const gamePks = historicalGames.map(g => g.game?.gamePk).filter(Boolean);
    if (!gamePks.length) return;
    apiClient.fetchGamesFinalScores(gamePks)
      .then(scores => setFinalScores(prev => ({ ...prev, ...scores })))
      .catch(() => {});
  }, [historicalGames]);

  return (
    <Dialog
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            position: 'relative',
            width: { xs: '95%', sm: '90%' },
            maxWidth: 680,
            height: '80vh',
            maxHeight: '80vh',
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
          bgcolor: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.60)' },
        }}
      >
        <Close sx={{ fontSize: 16 }} />
      </IconButton>

      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 4 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TeamHeading team={away} />
          </Box>

          <Box sx={{ textAlign: 'center', px: 0.5, flexShrink: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>
              {isLive(game) || isFinal(game) || isSuspended(game) ? `${awayScore} – ${homeScore}` : '@'}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {isFinal(game) ? 'Final' : isSuspended(game) ? 'Suspendido' : isLive(game)
                ? `${inningLabel(game.linescore?.inningHalf, game.linescore?.currentInning)} · ${outsLabel(game.linescore?.outs)}`
                : fmtTime(game.gameDate)}
            </Typography>
            {game.venue?.name && (
              <Typography sx={{ fontSize: 10, color: 'text.disabled', whiteSpace: 'nowrap' }}>{game.venue.name}</Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TeamHeading team={home} align="right" />
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Probable pitcher matchup — shown whenever we have at least one probable pitcher */}
        {(home?.probablePitcher?.id || away?.probablePitcher?.id) && (
          <>
            <Stack direction="row" alignItems="stretch" spacing={1} sx={{ px: 2, py: 1.5 }}>
              <PitcherCard
                pitcher={away?.probablePitcher} stats={pitcherStats.away}
                loading={loadingPitchers}
              />
              <PitcherCard
                pitcher={home?.probablePitcher} stats={pitcherStats.home}
                loading={loadingPitchers}
              />
            </Stack>
            <Divider />
          </>
        )}

        {loadingBox ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : !box ? (
          <Alert severity="warning" sx={{ m: 2 }}>No hay datos disponibles para este partido.</Alert>
        ) : (
          <Box>
            {/* Team selector */}
            <Box sx={{ px: 2, pt: 1.5 }}>
              <ToggleButtonGroup value={side} exclusive onChange={(_, v) => v && setSide(v)} size="small">
                <ToggleButton value="away" sx={{ fontSize: 11 }}>{away?.team?.name}</ToggleButton>
                <ToggleButton value="home" sx={{ fontSize: 11 }}>{home?.team?.name}</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Pitching / Batting / History tabs */}
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
              <Tab label="Pitcheo" sx={{ fontSize: 12 }} />
              <Tab label="Bateo" sx={{ fontSize: 12 }} />
              <Tab label="Histórico" sx={{ fontSize: 12 }} />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {activeTab === 0 && <PitchingTable teamData={teamData} />}
              {activeTab === 1 && <BattingTable teamData={teamData} />}
              {activeTab === 2 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                      {historicalOpponent?.id && (
                        <Box component="img" src={teamLogoUrl(historicalOpponent.id)} alt={historicalOpponent.name}
                          sx={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
                      )}
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        {historicalPitcher?.id
                          ? `${historicalPitcher.fullName} vs ${historicalOpponent?.name ?? ''} (últimas ${HISTORY_SEASONS} temporadas)`
                          : 'Pitcher no confirmado'}
                      </Typography>
                    </Stack>
                    <ToggleButtonGroup value={venueFilter} exclusive onChange={(_, v) => v && setVenueFilter(v)} size="small">
                      <ToggleButton value="all" sx={{ fontSize: 11 }}>Todos</ToggleButton>
                      <ToggleButton value="home" sx={{ fontSize: 11 }}>Local</ToggleButton>
                      <ToggleButton value="away" sx={{ fontSize: 11 }}>Visita</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  {loadingHistorical ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : (
                    <>
                      {historicalSummary && (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1 }}>
                          {historicalSummary.starts} inicio{historicalSummary.starts === 1 ? '' : 's'} · {historicalSummary.era} ERA · {historicalSummary.ip} IP · {historicalSummary.strikeOuts} SO
                        </Typography>
                      )}
                      {isMobile
                        ? <HistoricalCards games={historicalGames} finalScores={finalScores} />
                        : <HistoricalTable games={historicalGames} finalScores={finalScores} />}
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

BoxscoreModal.propTypes = {
  game: PropTypes.object.isRequired,
  league: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

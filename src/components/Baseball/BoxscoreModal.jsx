import { useState, useEffect } from 'react';
import {
  Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle,
  IconButton, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs,
  ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { apiClient } from '../../api/api';
import { fmtTime, inningLabel, outsLabel, isLive, isFinal, isSuspended } from './baseballHelpers';

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
      <Table size="small" sx={{ minWidth: 380 }}>
        <TableHead>
          <TableRow>
            {['Bateador', 'Pos', 'AB', 'H', 'R', 'RBI', 'BB', 'K'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, py: 0.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {batters.map((pid) => {
            const p = players[`ID${pid}`] ?? {};
            const st = p.stats?.batting ?? {};
            const pos = p.position?.abbreviation ?? '';
            return (
              <TableRow key={pid}>
                <TableCell sx={{ fontSize: 12, py: 0.5, whiteSpace: 'nowrap' }}>{p.person?.fullName ?? pid}</TableCell>
                <TableCell sx={{ fontSize: 11, py: 0.5, color: 'text.secondary' }}>{pos}</TableCell>
                {[st.atBats, st.hits, st.runs, st.rbi, st.baseOnBalls, st.strikeOuts].map((v, i) => (
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

export default function BoxscoreModal({ game, onClose }) {
  const [box, setBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [side, setSide] = useState('away');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const away = game.teams?.away;
  const home = game.teams?.home;

  useEffect(() => {
    setLoading(true);
    apiClient.fetchBaseballBoxscore(game.gamePk)
      .then(res => setBox(res.data))
      .catch(() => setBox(null))
      .finally(() => setLoading(false));
  }, [game.gamePk]);

  const teamData = box?.teams?.[side];
  const awayScore = away?.score ?? 0;
  const homeScore = home?.score ?? 0;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
              {away?.team?.name} {isLive(game) || isFinal(game) || isSuspended(game) ? `${awayScore} – ${homeScore}` : 'vs'} {home?.team?.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {isFinal(game) ? 'Final' : isSuspended(game) ? 'Suspendido' : isLive(game)
                ? `${inningLabel(game.linescore?.inningHalf, game.linescore?.currentInning)} · ${outsLabel(game.linescore?.outs)}`
                : fmtTime(game.gameDate)}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
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

            {/* Pitching / Batting tabs */}
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2 }}>
              <Tab label="Pitcheo" sx={{ fontSize: 12 }} />
              <Tab label="Bateo" sx={{ fontSize: 12 }} />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {activeTab === 0 && <PitchingTable teamData={teamData} />}
              {activeTab === 1 && <BattingTable teamData={teamData} />}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

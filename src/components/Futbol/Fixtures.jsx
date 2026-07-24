import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, Chip, IconButton, Tooltip, Typography, Stack, useMediaQuery } from '@mui/material';
import { Waves } from '@mui/icons-material';
import dayjs from 'dayjs';
import { apiClient } from '../../api/api';
import MatchDetailsModal from '../modals/MatchDetails';
import BoxscoreModal from '../Baseball/BoxscoreModal';
import FixtureMobileView from './Fixtures/FixtureMobileView';
import FixturesDesktopView from './Fixtures/FixturesDesktopView';
import FixturesSkeleton from './Fixtures/FixturesSkeleton';
import SimultaneousChart from './Fixtures/SimultaneousChart';
import { statusPriority } from './Fixtures/consts';
import { normalizeBaseballGames } from '../../utils/normalizeBaseball';

const POLLING_TIME = parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS, 10) || 60000;

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);

// Basketball/Football have no data source yet — the chips still show so the
// filter row communicates "more sports are coming", they just never add rows.
const SPORTS = [
  { id: 'futbol',     label: 'Soccer',     icon: '⚽', available: true },
  { id: 'baseball',   label: 'Baseball',   icon: '⚾', available: true },
  { id: 'basketball', label: 'Basketball', icon: '🏀', available: false },
  { id: 'football',   label: 'Football',   icon: '🏈', available: false },
];

const Fixtures = ({ selectedDate, searchTerm }) => {

  const [fixtures, setFixtures] = useState(null);
  const [loadingSoccer, setLoadingSoccer] = useState(true);
  const [baseballGames, setBaseballGames] = useState([]);
  const [loadingBaseball, setLoadingBaseball] = useState(true);
  const [activeSports, setActiveSports] = useState(['futbol', 'baseball']);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState({ team1: null, team2: null });
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [boxscoreGame, setBoxscoreGame] = useState(null);
  const [showWaveChart, setShowWaveChart] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');

  const loadMatchesData = useCallback((forceRefresh = false, showLoading = true) => {
    if (showLoading) setLoadingSoccer(true);

    const localTargetDate = selectedDate.format('YYYY-MM-DD');
    const nextDay = selectedDate.add(1, 'day').format('YYYY-MM-DD');

    const method = forceRefresh ? 'fetchRefreshFixtures' : 'fetchFixtures';

    Promise.all([
      apiClient[method](localTargetDate),
      apiClient[method](nextDay)
    ])
      .then(([responseToday, responseTomorrow]) => {
        const combinedFixtures = [...responseToday.data, ...responseTomorrow.data];

        const trueLocalFixtures = combinedFixtures.filter(match => {
          const matchLocalDay = dayjs(match.fixture.date).format('YYYY-MM-DD');
          return matchLocalDay === localTargetDate;
        });

        setFixtures(trueLocalFixtures);
        setLoadingSoccer(false);
      })
      .catch((error) => {
        console.error('Error loading matches:', error);
        setLoadingSoccer(false);
      });
  }, [selectedDate]);

  const loadBaseballData = useCallback((showLoading = true) => {
    if (showLoading) setLoadingBaseball(true);

    const dateStr = selectedDate.format('YYYY-MM-DD');

    Promise.all([
      apiClient.fetchBaseballSchedule(dateStr, 'lmb'),
      apiClient.fetchBaseballSchedule(dateStr, 'mlb'),
    ])
      .then(([lmbRes, mlbRes]) => {
        setBaseballGames([
          ...normalizeBaseballGames(lmbRes.data, 'lmb'),
          ...normalizeBaseballGames(mlbRes.data, 'mlb'),
        ]);
        setLoadingBaseball(false);
      })
      .catch((error) => {
        console.error('Error loading baseball games:', error);
        setLoadingBaseball(false);
      });
  }, [selectedDate]);

  useEffect(() => {
    loadMatchesData(false, true);
    loadBaseballData(true);

    const interval = setInterval(() => {
      loadMatchesData(false, false);
      loadBaseballData(false);
    }, POLLING_TIME);

    return () => clearInterval(interval);

  }, [selectedDate, loadMatchesData, loadBaseballData]);

  // Both sports are always fetched — chips only filter what's displayed, so
  // toggling a sport on/off is instant instead of waiting on a new request.
  const allMatches = useMemo(() => {
    const soccer   = activeSports.includes('futbol')   ? (fixtures ?? []) : [];
    const baseball = activeSports.includes('baseball') ? baseballGames    : [];
    return [...soccer, ...baseball];
  }, [fixtures, baseballGames, activeSports]);

  const processedFixtures = useMemo(() => {

    // Filter by favorite leagues
    const byLeague = selectedLeagues.length > 0
      ? allMatches.filter((match) => selectedLeagues.includes(match.league.id))
      : allMatches;

    // Filter by search term (home or away team name)
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? byLeague.filter((match) =>
          match.teams.home.name.toLowerCase().includes(term) ||
          match.teams.away.name.toLowerCase().includes(term)
        )
      : byLeague;

    // Order by status priority and then by time
    return [...filtered].sort((a, b) => {
      const statusA = a.fixture.status.short;
      const statusB = b.fixture.status.short;

      const priorityA = statusPriority[statusA] || 2;
      const priorityB = statusPriority[statusB] || 2;

      if (priorityA !== priorityB) return priorityA - priorityB;

      return new Date(a.fixture.date) - new Date(b.fixture.date);
    });

  }, [allMatches, selectedLeagues, searchTerm]);

  // Per-sport, so each chip can show its own live-pulse dot rather than one
  // global indicator that doesn't say which sport actually has something live.
  const liveBySport = useMemo(() => ({
    futbol:   fixtures      ? fixtures.some(m => LIVE_STATUSES.has(m.fixture.status.short))      : false,
    baseball: baseballGames.some(m => LIVE_STATUSES.has(m.fixture.status.short)),
  }), [fixtures, baseballGames]);

  // Re-derived on every poll so the modal always receives the freshest fixture data.
  const activeMatch = useMemo(
    () => selectedMatchId ? (processedFixtures.find(m => m.fixture.id === selectedMatchId) ?? null) : null,
    [selectedMatchId, processedFixtures]
  );

  const toggleSport = (sportId) => {
    setActiveSports((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  };

  const handleLeagueClick = (leagueId) => {
    setSelectedLeagues((prev) =>
      prev.includes(leagueId)
        ? prev.filter((id) => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  useEffect(() => {
    const handler = () => loadMatchesData(true);
    window.addEventListener('refresh-leagues', handler);
    return () => window.removeEventListener('refresh-leagues', handler);
  }, [loadMatchesData]);

  // Soccer opens the rich H2H/Stats/Odds modal; baseball has no such data yet,
  // so the same "Insights" action opens its boxscore instead.
  const handleOpenH2HModal = (team1Id, team2Id, fixtureId) => {
    const match = allMatches.find(m => m.fixture.id === fixtureId);
    if (match?.sport === 'baseball') {
      setBoxscoreGame(match.raw);
      return;
    }
    setSelectedTeams({ team1: team1Id, team2: team2Id });
    setSelectedMatchId(fixtureId ?? null);
    setH2hModalOpen(true);
  };

  const handleCloseH2HModal = () => {
    setH2hModalOpen(false);
    setSelectedTeams({ team1: null, team2: null });
    setSelectedMatchId(null);
  };

  const leaguesSummary = allMatches.reduce((summary, match) => {
    const leagueId = match.league.id;
    if (!summary[leagueId]) {
      summary[leagueId] = {
        count: 0,
        id: leagueId,
        name: match.league.name,
        logo: match.league.logo,
      };
    }
    summary[leagueId].count += 1;
    return summary;
  }, {});

  const summaryArray = Object.values(leaguesSummary);
  const loading = loadingSoccer || loadingBaseball;
  const onlyComingSoonSelected = activeSports.length > 0 && activeSports.every(id => !SPORTS.find(s => s.id === id)?.available);

  return (
    <Box>
      {loading ? (
        <FixturesSkeleton isMobile={isMobile} />
      ) : (
        <>
          {/* Sport filter chips */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap', gap: 1, pb: 1.5 }}>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {SPORTS.map((sport) => {
                const isActive = activeSports.includes(sport.id);
                const isLiveNow = Boolean(liveBySport[sport.id]);
                return (
                  <Chip
                    key={sport.id}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        {isLiveNow && (
                          <Box sx={{
                            width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main',
                            animation: 'livePulse 1.5s ease-in-out infinite',
                            '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                          }} />
                        )}
                        <span>{sport.icon} {sport.label}</span>
                      </Stack>
                    }
                    onClick={() => toggleSport(sport.id)}
                    color={isActive ? 'primary' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    clickable
                    sx={{ opacity: sport.available ? 1 : 0.6, fontWeight: isActive ? 600 : 400 }}
                  />
                );
              })}
            </Stack>

            <Tooltip title="Ver partidos simultáneos por hora">
              <IconButton size="small" color="primary" onClick={() => setShowWaveChart(true)}>
                <Waves />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* League filter chips — reflects whichever sports are currently active */}
          <Stack
            direction="row"
            sx={{ flexWrap: { xs: 'nowrap', md: 'wrap' }, overflowX: { xs: 'auto', md: 'visible' }, gap: 1, pb: 2 }}
          >
            <Chip
              label="All"
              onClick={() => setSelectedLeagues([])}
              color={selectedLeagues.length === 0 ? 'primary' : 'default'}
              variant={selectedLeagues.length === 0 ? 'filled' : 'outlined'}
              clickable
            />
            {summaryArray.map((league) => {
              const isSelected = selectedLeagues.includes(league.id);
              return (
                <Chip
                  key={league.id}
                  label={`${league.name} (${league.count})`}
                  onClick={() => handleLeagueClick(league.id)}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  clickable
                  sx={{
                    transition: 'all 0.2s ease',
                    backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    fontWeight: isSelected ? 600 : 400,
                    '&:hover': {
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.20)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    '& .MuiChip-avatar': {
                      margin: 0,
                      marginLeft: '4px'
                    }
                  }}
                  avatar={league.logo ? (
                    <Avatar
                      src={league.logo}
                      alt={league.name}
                      variant="rounded"
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: 'transparent !important',
                        '& .MuiAvatar-img': {
                          objectFit: 'contain',
                        }
                      }}
                    />
                  ) : undefined}
                />
              );
            })}
          </Stack>

          {onlyComingSoonSelected ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 40 }}>🚧</Typography>
              <Typography color="text.secondary" mt={1}>Próximamente.</Typography>
            </Box>
          ) : processedFixtures.length === 0 ? (
            <Typography>No hay partidos disponibles para esta fecha.</Typography>
          ) : isMobile ? (
            <FixtureMobileView
              processedFixtures={processedFixtures}
              handleOpenH2HModal={handleOpenH2HModal}
            />
          ) : (
            <FixturesDesktopView
              processedFixtures={processedFixtures}
              handleOpenH2HModal={handleOpenH2HModal}
            />
          )}
        </>
      )}

      <MatchDetailsModal
        open={h2hModalOpen}
        onClose={handleCloseH2HModal}
        team1Id={selectedTeams.team1}
        team2Id={selectedTeams.team2}
        currentMatch={activeMatch}
      />

      {boxscoreGame && (
        <BoxscoreModal game={boxscoreGame} onClose={() => setBoxscoreGame(null)} />
      )}

      {showWaveChart && (
        <SimultaneousChart matches={processedFixtures} onClose={() => setShowWaveChart(false)} />
      )}
    </Box>
  );
};

Fixtures.propTypes = {
  selectedDate: PropTypes.object.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default Fixtures;

import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, Chip, Stack, Tooltip, useMediaQuery } from '@mui/material';
import { Waves } from '@mui/icons-material';
import dayjs from 'dayjs';

function LivePulseDot() {
  return (
    <Box sx={{
      width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main',
      animation: 'livePulse 1.5s ease-in-out infinite',
      '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
    }} />
  );
}

import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/api';
import MatchDetailsModal from '../modals/MatchDetails';
import BoxscoreModal from '../Baseball/BoxscoreModal';
import FixtureMobileView from './Fixtures/FixtureMobileView';
import FixturesDesktopView from './Fixtures/FixturesDesktopView';
import FixturesSkeleton from './Fixtures/FixturesSkeleton';
import SimultaneousChart from './Fixtures/SimultaneousChart';
import EmptyState from './Fixtures/EmptyState';
import { statusPriority } from './Fixtures/consts';
import { normalizeBaseballGames } from '../../utils/normalizeBaseball';
import { normalizeNFLGames } from '../../utils/normalizeNFL';
import { normalizeNBAGames } from '../../utils/normalizeNBA';
import NBAGameModal from '../modals/NBAGameModal';

const POLLING_TIME = parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS, 10) || 60000;

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);

const SPORTS = [
  { id: 'futbol',     label: 'Soccer',     icon: '⚽', available: true },
  { id: 'baseball',   label: 'Baseball',   icon: '⚾', available: true },
  { id: 'nfl',        label: 'NFL',        icon: '🏈', available: true },
  { id: 'basketball', label: 'Basketball', icon: '🏀', available: true },
];

const Fixtures = ({ selectedDate, searchTerm }) => {
  const { t } = useTranslation();

  const [fixtures, setFixtures] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [loadingSoccer, setLoadingSoccer] = useState(true);
  const [baseballGames, setBaseballGames] = useState([]);
  const [loadingBaseball, setLoadingBaseball] = useState(true);
  const [nflGames, setNflGames] = useState([]);
  const [loadingNFL, setLoadingNFL] = useState(true);
  const [nbaGames, setNbaGames] = useState([]);
  const [loadingNBA, setLoadingNBA] = useState(true);
  const [activeSports, setActiveSports] = useState(['futbol', 'baseball', 'nfl', 'basketball']);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState({ team1: null, team2: null });
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [boxscoreGame, setBoxscoreGame] = useState(null);
  const [nbaModalMatchId, setNbaModalMatchId] = useState(null);
  const [showWaveChart, setShowWaveChart] = useState(false);
  const [onlyLive, setOnlyLive] = useState(false);
  const [betRadarByFixture, setBetRadarByFixture] = useState({});
  const [nbaRadarByFixture, setNbaRadarByFixture] = useState({});

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
        setHasError(false);
        setLoadingSoccer(false);
      })
      .catch((error) => {
        console.error('Error loading matches:', error);
        setHasError(true);
        setLoadingSoccer(false);
      });
  }, [selectedDate]);

  const loadBaseballData = useCallback((showLoading = true) => {
    if (showLoading) setLoadingBaseball(true);

    const dateStr = selectedDate.format('YYYY-MM-DD');

    apiClient.fetchBaseballSchedule(dateStr)
      .then(res => {
        setBaseballGames(normalizeBaseballGames(res.data));
        setLoadingBaseball(false);
      })
      .catch((error) => {
        console.error('Error loading baseball games:', error);
        setLoadingBaseball(false);
      });
  }, [selectedDate]);

  const loadNFLData = useCallback((showLoading = true) => {
    if (showLoading) setLoadingNFL(true);

    const dateStr = selectedDate.format('YYYY-MM-DD');

    apiClient.fetchNFLSchedule(dateStr)
      .then(res => {
        setNflGames(normalizeNFLGames(res.data));
        setLoadingNFL(false);
      })
      .catch((error) => {
        console.error('Error loading NFL games:', error);
        setLoadingNFL(false);
      });
  }, [selectedDate]);

  const loadNBAData = useCallback((showLoading = true) => {
    if (showLoading) setLoadingNBA(true);

    const dateStr = selectedDate.format('YYYY-MM-DD');

    apiClient.fetchNBASchedule(dateStr)
      .then(res => {
        setNbaGames(normalizeNBAGames(res.data));
        setLoadingNBA(false);
      })
      .catch((error) => {
        console.error('Error loading NBA games:', error);
        setLoadingNBA(false);
      });
  }, [selectedDate]);

  // Cached only — never trigger the heavy on-demand analysis just to show a
  // badge; if this date hasn't been prewarmed yet, simply show no indicators.
  const loadBetRadarData = useCallback(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    apiClient.fetchBetRadarCached(dateStr)
      .then(res => {
        const byFixture = {};
        (res?.suggestions ?? []).forEach(s => { byFixture[s.fixture_id] = s; });
        setBetRadarByFixture(byFixture);
      })
      .catch(() => setBetRadarByFixture({}));
  }, [selectedDate]);

  // Same cached-only mechanism as football's BetRadar, but keyed by the
  // negative fixture id normalizeNBA derives from event_id, so it matches
  // nbaGames' fixture.id directly.
  const loadNBABetRadarData = useCallback(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    apiClient.fetchNBARadarCached(dateStr)
      .then(res => {
        const byFixture = {};
        (res?.suggestions ?? []).forEach(s => { byFixture[-Number(s.event_id)] = s; });
        setNbaRadarByFixture(byFixture);
      })
      .catch(() => setNbaRadarByFixture({}));
  }, [selectedDate]);

  useEffect(() => {
    loadMatchesData(false, true);
    loadBaseballData(true);
    loadNFLData(true);
    loadNBAData(true);
    loadBetRadarData();
    loadNBABetRadarData();

    const interval = setInterval(() => {
      loadMatchesData(false, false);
      loadBaseballData(false);
      loadNFLData(false);
      loadNBAData(false);
    }, POLLING_TIME);

    return () => clearInterval(interval);

  }, [selectedDate, loadMatchesData, loadBaseballData, loadNFLData, loadNBAData, loadBetRadarData, loadNBABetRadarData]);

  // All sports are always fetched — chips only filter what's displayed, so
  // toggling a sport on/off is instant instead of waiting on a new request.
  const allMatches = useMemo(() => {
    const soccer = activeSports.includes('futbol')
      ? (fixtures ?? []).map(m => ({ ...m, betRadar: betRadarByFixture[m.fixture.id] ?? null }))
      : [];
    const baseball = activeSports.includes('baseball') ? baseballGames : [];
    const nfl = activeSports.includes('nfl') ? nflGames : [];
    const nba = activeSports.includes('basketball')
      ? nbaGames.map(m => ({ ...m, betRadar: nbaRadarByFixture[m.fixture.id] ?? null }))
      : [];
    return [...soccer, ...baseball, ...nfl, ...nba];
  }, [fixtures, baseballGames, nflGames, nbaGames, activeSports, betRadarByFixture, nbaRadarByFixture]);

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

    const withoutLive = onlyLive
      ? filtered.filter(m => m.fixture.status.short === 'NS')
      : filtered;

    // Order by status priority and then by time
    return [...withoutLive].sort((a, b) => {
      const statusA = a.fixture.status.short;
      const statusB = b.fixture.status.short;

      const priorityA = statusPriority[statusA] || 2;
      const priorityB = statusPriority[statusB] || 2;

      if (priorityA !== priorityB) return priorityA - priorityB;

      return new Date(a.fixture.date) - new Date(b.fixture.date);
    });

  }, [allMatches, selectedLeagues, searchTerm, onlyLive]);

  // Per-sport, so each chip can show its own live-pulse dot rather than one
  // global indicator that doesn't say which sport actually has something live.
  const liveBySport = useMemo(() => ({
    futbol:     fixtures      ? fixtures.some(m => LIVE_STATUSES.has(m.fixture.status.short))      : false,
    baseball:   baseballGames.some(m => LIVE_STATUSES.has(m.fixture.status.short)),
    nfl:        nflGames.some(m => LIVE_STATUSES.has(m.fixture.status.short)),
    basketball: nbaGames.some(m => LIVE_STATUSES.has(m.fixture.status.short)),
  }), [fixtures, baseballGames, nflGames, nbaGames]);

  // Re-derived on every poll so the modal always receives the freshest fixture data.
  const activeMatch = useMemo(
    () => selectedMatchId ? (processedFixtures.find(m => m.fixture.id === selectedMatchId) ?? null) : null,
    [selectedMatchId, processedFixtures]
  );

  // Same freshness trick for the NBA modal — re-derived from allMatches so a
  // live game's score/picks update while the modal stays open.
  const nbaModalMatch = useMemo(
    () => nbaModalMatchId ? (allMatches.find(m => m.fixture.id === nbaModalMatchId) ?? null) : null,
    [nbaModalMatchId, allMatches]
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
  // so the same "Insights" action opens its boxscore instead. NFL has neither
  // yet — its team ids come from ESPN, not API-Football, so it can't reuse the
  // soccer modal either; no-op until an NFL-specific view exists. NBA's team
  // ids are also ESPN's, but it DOES get its own (lighter) modal — see
  // NBAGameModal — since BetRadar picks already exist for it.
  const handleOpenH2HModal = (team1Id, team2Id, fixtureId) => {
    const match = allMatches.find(m => m.fixture.id === fixtureId);
    if (match?.sport === 'baseball') {
      setBoxscoreGame(match.raw);
      return;
    }
    if (match?.sport === 'nfl') return;
    if (match?.sport === 'nba') {
      setNbaModalMatchId(fixtureId ?? null);
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
  const loading = loadingSoccer || loadingBaseball || loadingNFL || loadingNBA;
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
                        {isLiveNow && <LivePulseDot />}
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

            <Stack direction="row" sx={{ gap: 1 }}>
              <Chip
                label="⏳ Upcoming"
                onClick={() => setOnlyLive(v => !v)}
                color={onlyLive ? 'primary' : 'default'}
                variant={onlyLive ? 'filled' : 'outlined'}
                clickable
                sx={{ fontWeight: onlyLive ? 600 : 400 }}
              />
              <Tooltip title={t('fixtures.hourlyDensityTooltip')}>
                <Chip
                  icon={<Waves fontSize="small" />}
                  label={t('fixtures.hourlyDensity')}
                  onClick={() => setShowWaveChart(true)}
                  color="info"
                  variant="outlined"
                  clickable
                  sx={{ fontWeight: 500 }}
                />
              </Tooltip>
            </Stack>
          </Stack>

          {/* League filter chips — reflects whichever sports are currently active.
              The ::after fade hints that the row keeps scrolling on mobile. */}
          <Box sx={{
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute', top: 0, right: 0, bottom: 8,
              width: 28, pointerEvents: 'none',
              display: { xs: summaryArray.length > 2 ? 'block' : 'none', md: 'none' },
              background: (theme) => `linear-gradient(to right, transparent, ${theme.palette.background.default})`,
            },
          }}>
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
          </Box>

          {onlyComingSoonSelected ? (
            <EmptyState icon="🚧" title={t('fixtures.comingSoon')} />
          ) : hasError ? (
            <EmptyState
              icon="⚠️"
              title={t('fixtures.errorTitle')}
              actionLabel={t('fixtures.retry')}
              onAction={() => loadMatchesData(false, true)}
            />
          ) : processedFixtures.length === 0 ? (
            <EmptyState icon="📭" title={t('fixtures.noMatches')} subtitle={t('fixtures.noMatchesSubtitle')} />
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

      {nbaModalMatch && (
        <NBAGameModal match={nbaModalMatch} onClose={() => setNbaModalMatchId(null)} />
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

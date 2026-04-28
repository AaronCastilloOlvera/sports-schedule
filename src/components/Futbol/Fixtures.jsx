import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, Chip, IconButton, LinearProgress, Typography, useMediaQuery } from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import dayjs from 'dayjs';
import { apiClient } from '../../api/api';
import H2HModal from '../modals/H2HModal';
import FixtureMobileView from './Fixtures/FixtureMobileView';
import FixturesDesktopView from './Fixtures/FixturesDesktopView';
import { statusPriority } from './Fixtures/consts';

const POLLING_TIME = parseInt(import.meta.env.VITE_POLLING_INTERVAL_MS, 10) || 60000;

const Fixtures = ({ selectedDate, searchTerm }) => {

  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState({ team1: null, team2: null });
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const isMobile = useMediaQuery('(max-width:600px)');

  const loadMatchesData = useCallback((forceRefresh = false, showLoading = true) => {
    if (showLoading) setLoading(true);

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
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading matches:', error);
        setLoading(false);
      });
  }, [selectedDate]);

  useEffect(() => {
    loadMatchesData(false, true);

    const interva = setInterval(() => {
      loadMatchesData(false, false);
    }, POLLING_TIME);

    return () => clearInterval(interva);

  }, [selectedDate, loadMatchesData]);

  // Collapse the filter whenever the date (and thus league list) changes.
  useEffect(() => {
    setIsExpanded(false);
  }, [selectedDate]);

  const processedFixtures = useMemo(() => {

    if (!fixtures) return [];

    // Filter by favorite leagues
    const byLeague = selectedLeagues.length > 0
      ? fixtures.filter((match) => selectedLeagues.includes(match.league.id))
      : fixtures;

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

  }, [fixtures, selectedLeagues, searchTerm]);

  // Re-derived on every poll so the modal always receives the freshest fixture data.
  const activeMatch = useMemo(
    () => selectedMatchId ? (processedFixtures.find(m => m.fixture.id === selectedMatchId) ?? null) : null,
    [selectedMatchId, processedFixtures]
  );

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

  const handleOpenH2HModal = (team1Id, team2Id, fixtureId) => {
    setSelectedTeams({ team1: team1Id, team2: team2Id });
    setSelectedMatchId(fixtureId ?? null);
    setH2hModalOpen(true);
  };

  const handleCloseH2HModal = () => {
    setH2hModalOpen(false);
    setSelectedTeams({ team1: null, team2: null });
    setSelectedMatchId(null);
  };

  const leaguesSummary = fixtures?.reduce((summary, match) => {
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

  const summaryArray = leaguesSummary ? Object.values(leaguesSummary) : [];

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  const leagueChipSx = (isSelected) => ({
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
    '& .MuiChip-avatar': { margin: 0, marginLeft: '4px' },
  });

  const leagueAvatar = (league) => (
    <Avatar
      src={league.logo}
      alt={league.name}
      variant="rounded"
      sx={{
        width: 20,
        height: 20,
        backgroundColor: 'transparent !important',
        '& .MuiAvatar-img': { objectFit: 'contain' },
      }}
    />
  );

  const renderLeagueChip = (league) => {
    const isSelected = selectedLeagues.includes(league.id);
    return (
      <Chip
        key={league.id}
        label={`${league.name} (${league.count})`}
        onClick={() => handleLeagueClick(league.id)}
        color={isSelected ? 'primary' : 'default'}
        variant={isSelected ? 'filled' : 'outlined'}
        clickable
        sx={leagueChipSx(isSelected)}
        avatar={leagueAvatar(league)}
      />
    );
  };

  return (
    <Box>
      {/* ── League filter ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, pb: 2 }}>
        {/* Chips — height-clamped when collapsed via CSS only, no DOM measurement */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            overflow: 'hidden',
            maxHeight: isExpanded ? '1000px' : '40px',
            transition: 'max-height 0.3s ease',
          }}
        >
          <Chip
            label="All"
            onClick={() => setSelectedLeagues([])}
            color={selectedLeagues.length === 0 ? 'primary' : 'default'}
            variant={selectedLeagues.length === 0 ? 'filled' : 'outlined'}
            clickable
          />
          {summaryArray.map(renderLeagueChip)}
        </Box>

        {/* Toggle — shown whenever there are enough leagues to potentially wrap */}
        {summaryArray.length > 4 && (
          <IconButton
            size="small"
            onClick={() => setIsExpanded(prev => !prev)}
            sx={{ color: 'text.secondary', flexShrink: 0, mt: '2px' }}
            aria-label={isExpanded ? 'Show fewer leagues' : 'Show more leagues'}
          >
            {isExpanded
              ? <KeyboardArrowUp fontSize="small" />
              : <KeyboardArrowDown fontSize="small" />
            }
          </IconButton>
        )}
      </Box>

      {loading ? (
        <LinearProgress />
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

      <H2HModal
        open={h2hModalOpen}
        onClose={handleCloseH2HModal}
        team1Id={selectedTeams.team1}
        team2Id={selectedTeams.team2}
        currentMatch={activeMatch}
      />
    </Box>
  );
};

Fixtures.propTypes = {
  selectedDate: PropTypes.object.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default Fixtures;

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Avatar, Box, Chip, IconButton, LinearProgress, Typography, Stack, Tooltip, useMediaQuery } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ChevronLeft, ChevronRight, Refresh } from '@mui/icons-material';
import dayjs from 'dayjs';
import { apiClient } from '../../api/api';
import H2HModal from '../modals/H2HModal';
import FixtureMobileView from './Fixtures/FixtureMobileView';
import FixturesDesktopView from './Fixtures/FixturesDesktopView';
import { statusPriority } from './Fixtures/consts';

const Fixtures = () => {

  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedLeagues, setSelectedLeagues] = useState([]);
  const [h2hModalOpen, setH2hModalOpen] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState({ team1: null, team2: null });

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
    }, 60000);

    return () => clearInterval(interva);

  }, [selectedDate, loadMatchesData]);

  const processedFixtures = useMemo(() => {

    if (!fixtures) return [];

    // Filter by favorite leagues
    const filtered = selectedLeagues.length > 0
      ? fixtures.filter((match) => selectedLeagues.includes(match.league.id))
      : fixtures;

    // Order by status priority and then by time
    return [...filtered].sort((a, b) => {
      const statusA = a.fixture.status.short;
      const statusB = b.fixture.status.short;

      const priorityA = statusPriority[statusA] || 2;
      const priorityB = statusPriority[statusB] || 2;

      // Priority: 1 = Live, 2 = Not Started, 3 = Finished
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, order by time
      return new Date(a.fixture.date) - new Date(b.fixture.date);
    });

  }, [fixtures, selectedLeagues]);

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => prevDate.subtract(1, 'day'));
  };

  const handleNextDay = () => {
    setSelectedDate(prevDate => prevDate.add(1, 'day'));
  };

  const handleLeagueClick = (leagueId) => {
    setSelectedLeagues((prev) =>
      prev.includes(leagueId)
        ? prev.filter((id) => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  const handleRefreshFixtures = () => {
    loadMatchesData(true);
  };

  const handleOpenH2HModal = (team1Id, team2Id) => {
    setSelectedTeams({ team1: team1Id, team2: team2Id });
    setH2hModalOpen(true);
  };

  const handleCloseH2HModal = () => {
    setH2hModalOpen(false);
    setSelectedTeams({ team1: null, team2: null });
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

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ padding: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mb: 3 }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, order: { xs: 1, sm: 0 } }}>
            <IconButton onClick={handlePreviousDay} color='primary'>
              <ChevronLeft />
            </IconButton>

            <DatePicker
              label="Seleccionar Fecha"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              format='DD/MM/YYYY'
              slotProps={{ textField: { size: 'small', readOnly: true } }}
            />

            <IconButton onClick={handleNextDay} color='primary'>
              <ChevronRight />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, order: { xs: 3, sm: 0 } }} />
          <Box sx={{ order: { xs: 2, sm: 0 } }}>
            <Tooltip title="Refrescar Ligas">
              <IconButton onClick={handleRefreshFixtures} color='primary'>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

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
                key={league.name}
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
                avatar={
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
                }
              />
            );
          })}
        </Stack>

        {
        loading ? (
          <LinearProgress />
        ) :
          processedFixtures.length === 0 ? (
            <Typography>No hay partidos disponibles para esta fecha.</Typography>
          ) : isMobile ?
            <FixtureMobileView
              processedFixtures={processedFixtures}
              handleOpenH2HModal={handleOpenH2HModal}
            />
            :
            <FixturesDesktopView
              processedFixtures={processedFixtures}
              handleOpenH2HModal={handleOpenH2HModal}
             />
         }
        <H2HModal
          open={h2hModalOpen}
          onClose={handleCloseH2HModal}
          team1Id={selectedTeams.team1}
          team2Id={selectedTeams.team2}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default Fixtures;
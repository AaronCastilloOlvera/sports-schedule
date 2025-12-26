import { useState, useEffect } from 'react';
import { Avatar, Box, Chip, IconButton, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Stack, Tooltip } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ChevronLeft, ChevronRight, Refresh } from '@mui/icons-material';
import dayjs from 'dayjs';
import { apiClient } from './api';

const Fixtures = () => {

  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedLeagues, setSelectedLeagues] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const formattedDate = selectedDate.format('YYYY-MM-DD');
    
    apiClient.fetchFixtures(formattedDate)
      .then((response) => {
        if (mounted) {
          setFixtures(response.data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching fixtures:', error);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [selectedDate]);

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

  const handleRefreshLeagues = () => {
    setLoading(true);
    const formattedDate = selectedDate.format('YYYY-MM-DD');
    apiClient.fetchRefreshFixtures(formattedDate)
      .then((response) => {
        setFixtures(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error refreshing fixtures:', error);
        setLoading(false);
      });
  };

  const filteredFixtures = selectedLeagues.length > 0
    ? fixtures?.filter((match) => selectedLeagues.includes(match.league.id))
    : fixtures;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>

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

          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refrescar Ligas">
            <IconButton onClick={handleRefreshLeagues} color='primary'>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        <Stack 
          direction="row" 
          sx={{ flexWrap: { xs: 'nowrap', md: 'wrap' },  overflowX: { xs: 'auto', md: 'visible' }, gap: 1, pb: 2 }}
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

        {loading ? (
          <LinearProgress />
        ) : !filteredFixtures || filteredFixtures.length === 0 ? (
          <Typography>No hay partidos disponibles para esta fecha.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="tabla de partidos">
              <TableHead>
                <TableRow>
                  <TableCell>Liga</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hora</TableCell>
                  <TableCell align="right">Local</TableCell>
                  <TableCell align="center">Marcador</TableCell>
                  <TableCell align="left">Visitante</TableCell>
                  <TableCell>Estadio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFixtures?.map((match, index) => {
                  const matchDate = new Date(match.fixture.date);
                  return (
                    <TableRow key={match.fixture.id || index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {match.league.logo && (
                            <Box 
                              component="img" 
                              src={match.league.logo} 
                              alt={match.league.name} 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                marginRight: 1,
                                objectFit: 'contain', 
                                borderRadius: '4px',
                                bgcolor: 'transparent' 
                              }} 
                            />
                          )}
                          <Typography variant="body2">{match.league.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={match.fixture.status.short} 
                          size="small" 
                          color={match.fixture.status.short === 'FT' ? 'default' : 'primary'}
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 1 }}>{match.teams.home.name}</Typography>
                          <Box component="img" src={match.teams.home.logo} sx={{ width: 30, height: 30 }} />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, display: 'inline-block' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {match.goals.home} - {match.goals.away}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="left">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component="img" src={match.teams.away.logo} sx={{ width: 30, height: 30, marginRight: 1 }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{match.teams.away.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">{match.fixture.venue.name}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Fixtures;
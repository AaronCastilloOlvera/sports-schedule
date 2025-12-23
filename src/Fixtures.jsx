import { useState, useEffect } from 'react';
import { Box, Chip, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { apiClient } from './api';

const Fixtures = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const formattedDate = selectedDate.format('YYYY-MM-DD');
    
    apiClient.fetchFixtures(formattedDate)
      .then((data) => {
        if (mounted) {
          setFixtures(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching fixtures:', error);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [selectedDate]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ padding: 2, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Partidos</Typography>
          
          {/* Selector de Fecha */}
          <DatePicker
            label="Seleccionar Fecha"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Box>

        {loading ? (
          <LinearProgress />
        ) : !fixtures?.data || fixtures.data.length === 0 ? (
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
                {fixtures.data.map((match, index) => {
                  const matchDate = new Date(match.fixture.date);
                  return (
                    <TableRow key={match.fixture.id || index}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {match.league.logo && (
                            <Box component="img" src={match.league.logo} alt={match.league.name} sx={{ width: 24, height: 24, marginRight: 1 }} />
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
                            {match.goals.home ?? 0} - {match.goals.away ?? 0}
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
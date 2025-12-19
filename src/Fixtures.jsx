import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Avatar 
} from '@mui/material';
import { apiClient } from './api';

const Fixtures = () => {
  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get Current Date in YYYY-MM-DD format
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    console.log('Fetching fixtures for date:', formattedDate);

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
  }, []);

  if (loading) {
    return <LinearProgress />;
  }

  if (!fixtures || !fixtures.data || fixtures.data.length === 0) {
    return <Typography>No fixtures available</Typography>;
  }

  return (
    <Box sx={{ padding: 2, mt: 8 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>Partidos</Typography>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tabla de partidos">
          <TableHead>
            <TableRow>
              <TableCell>Liga</TableCell>
              <TableCell>Fecha / Estado</TableCell>
              <TableCell align="right">Local</TableCell>
              <TableCell align="center">Marcador</TableCell>
              <TableCell align="left">Visitante</TableCell>
              <TableCell>Estadio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fixtures.data.map((match, index) => (
              <TableRow
                key={match.fixture.id || index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {/* Columna: Liga */}
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {match.league.logo && (
                      <Avatar 
                        src={match.league.logo} 
                        alt={match.league.name} 
                        sx={{ width: 24, height: 24, marginRight: 1 }} 
                      />
                    )}
                    <Typography variant="body2">{match.league.name}</Typography>
                  </Box>
                </TableCell>

                {/* Columna: Fecha y Estado */}
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="caption" sx={{ mb: 0.5 }}>
                        {new Date(match.fixture.date).toLocaleDateString()}
                    </Typography>
                    <Chip 
                      label={match.fixture.status.short} 
                      size="small" 
                      color={match.fixture.status.short === 'FT' ? 'default' : 'primary'}
                      variant="outlined"
                    />
                  </Box>
                </TableCell>

                {/* Columna: Equipo Local (Alineado a la derecha) */}
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', marginRight: 1 }}>
                        {match.teams.home.name}
                    </Typography>
                    {match.teams.home.logo && (
                      <Box
                        component="img"
                        src={match.teams.home.logo}
                        alt={match.teams.home.name}
                        sx={{ width: 30, height: 30, objectFit: 'contain' }}
                      />
                    )}
                  </Box>
                </TableCell>

                {/* Columna: Marcador */}
                <TableCell align="center">
                  <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, display: 'inline-block' }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {match.goals.home} - {match.goals.away}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Columna: Equipo Visitante (Alineado a la izquierda) */}
                <TableCell align="left">
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    {match.teams.away.logo && (
                      <Box
                        component="img"
                        src={match.teams.away.logo}
                        alt={match.teams.away.name}
                        sx={{ width: 30, height: 30, objectFit: 'contain', marginRight: 1 }}
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {match.teams.away.name}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Columna: Estadio */}
                <TableCell>
                  <Typography variant="caption" color="textSecondary">
                    {match.fixture.venue.name}
                  </Typography>
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Fixtures;
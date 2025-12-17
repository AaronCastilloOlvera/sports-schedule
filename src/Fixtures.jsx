import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Chip } from '@mui/material';
import { apiClient } from './api';

const Fixtures = () => {
  const [fixtures, setFixtures] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    apiClient.fetchFixtures()
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
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>Partidos</Typography>
      <Grid container spacing={2}>
        {fixtures.data.map((match, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {/* Liga */}
                <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                  {match.league.logo && (
                    <Box
                      component="img"
                      src={match.league.logo}
                      alt={match.league.name}
                      sx={{ width: 30, height: 30, marginRight: 1 }}
                    />
                  )}
                  <Typography variant="caption" color="textSecondary">
                    {match.league.name}
                  </Typography>
                </Box>

                {/* Estado del partido */}
                <Chip 
                  label={match.fixture.status.short} 
                  size="small" 
                  sx={{ marginBottom: 1 }}
                  color={match.fixture.status.short === 'FT' ? 'default' : 'primary'}
                />

                {/* Equipos */}
                <Box sx={{ marginBottom: 2 }}>
                  {/* Equipo Local */}
                  <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                    {match.teams.home.logo && (
                      <Box
                        component="img"
                        src={match.teams.home.logo}
                        alt={match.teams.home.name}
                        sx={{ width: 40, height: 40, marginRight: 1, objectFit: 'contain' }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{match.teams.home.name}</Typography>
                    </Box>
                    <Typography variant="h6">{match.goals.home}</Typography>
                  </Box>

                  {/* Equipo Visitante */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {match.teams.away.logo && (
                      <Box
                        component="img"
                        src={match.teams.away.logo}
                        alt={match.teams.away.name}
                        sx={{ width: 40, height: 40, marginRight: 1, objectFit: 'contain' }}
                      />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{match.teams.away.name}</Typography>
                    </Box>
                    <Typography variant="h6">{match.goals.away}</Typography>
                  </Box>
                </Box>

                {/* Fecha y Estadio */}
                <Typography variant="caption" color="textSecondary">
                  {new Date(match.fixture.date).toLocaleDateString()} - {match.fixture.venue.name}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Fixtures;

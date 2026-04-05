import { useState, useEffect, useMemo } from 'react';
import {
  Modal, Box, Typography, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Chip, Stack, Button, ButtonGroup, Divider
} from '@mui/material';
import { Close as CloseIcon, CalendarToday, LocationOn } from '@mui/icons-material';
import { apiClient } from '../../api/api';
import PropTypes from "prop-types";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '95%',
  maxWidth: 900,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: { xs: 2, md: 4 },
  borderRadius: 3,
  maxHeight: '70vh',
  overflowY: 'auto'
};

const H2HModal = ({ open, onClose, team1Id, team2Id }) => {
  const [h2hData, setH2hData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'home', 'away'

  useEffect(() => {
    if (open && team1Id && team2Id) {
      setLoading(true);
      apiClient.fetchHeadToHeadMatches(team1Id, team2Id)
        .then(response => {
          setH2hData(response?.data.slice(0, 10));
        })
        .catch(error => {
          console.error('Error fetching H2H data:', error);
          setH2hData([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, team1Id, team2Id]);

  const { nextMatch, teamHome, teamAway } = useMemo(() => {
    if (!h2hData.length) return {};
    const next = h2hData.find(m => m.fixture.status.short === "NS");
    const sample = h2hData[0];
    
    const tHome = sample.teams.home.id === team1Id ? sample.teams.home : sample.teams.away;
    const tAway = sample.teams.away.id === team2Id ? sample.teams.away : sample.teams.home;

    return { nextMatch: next, teamHome: tHome, teamAway: tAway };
  }, [h2hData, team1Id, team2Id]);

  
  const filteredMatches = useMemo(() => {
    const pastMatches = h2hData.filter(m => m.fixture.status.short === "FT");
    if (filter === 'home') return pastMatches.filter(m => m.teams.home.id === team1Id);
    if (filter === 'away') return pastMatches.filter(m => m.teams.away.id === team1Id);
    return pastMatches;
  }, [h2hData, filter, team1Id]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : h2hData.length > 0 ? (
          <>
            { /* HEADER WITH TEAMS AND NEXT MATCH */ }
            <Box sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
              <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
                <Stack alignItems="center" sx={{ flex: 1 }}>
                  <Box 
                    component="img" 
                    src={teamHome?.logo} 
                    alt={teamHome?.name} 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      marginRight: 1,
                      objectFit: 'contain', 
                      borderRadius: '4px',
                      bgcolor: 'transparent' 
                      }}
                    >
                  </Box>
                  <Typography variant="h6" fontWeight="bold">{teamHome?.name}</Typography>
                </Stack>

                <Box>
                  <Typography variant="h4" color="text.secondary" fontWeight="900">VS</Typography>
                </Box>

                <Stack alignItems="center" sx={{ flex: 1 }}>
                  <Box 
                    component="img" 
                    src={teamAway?.logo} 
                    alt={teamAway?.name} 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      marginRight: 1,
                      objectFit: 'contain', 
                      borderRadius: '4px',
                      bgcolor: 'transparent' 
                      }}
                    >
                  </Box>
                  <Typography variant="h6" fontWeight="bold">{teamAway?.name}</Typography>
                </Stack>
              </Stack>

              {nextMatch && (
                <Paper variant="outlined" sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Typography variant="overline" color="primary" fontWeight="bold">Próximo Encuentro</Typography>
                  <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="body2" textTransform="capitalize">
                        {new Date(nextMatch.fixture.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{nextMatch.fixture.venue.name}</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />
            { /* PAST MATCHES TABLE WITH FILTERS */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Last Matches</Typography>
              <ButtonGroup size="small" aria-label="filtros de localia">
                <Button 
                  variant={filter === 'all' ? 'contained' : 'outlined'} 
                  onClick={() => setFilter('all')}
                >Todos</Button>
                <Button 
                  variant={filter === 'home' ? 'contained' : 'outlined'} 
                  onClick={() => setFilter('home')}
                >Local</Button>
                <Button 
                  variant={filter === 'away' ? 'contained' : 'outlined'} 
                  onClick={() => setFilter('away')}
                >Visita</Button>
              </ButtonGroup>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Weekday</TableCell>
                    <TableCell align="right">Local</TableCell>
                    <TableCell align="center"></TableCell>
                    <TableCell>Away</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>League</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.fixture.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {new Date(match.fixture.date).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {new Date(match.fixture.date).toLocaleDateString(undefined, { weekday: 'long' })}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                          <Typography variant="body2" sx={{ fontWeight: match.teams.home.winner ? 'bold' : 'normal' }}>
                            {match.teams.home.name}
                          </Typography>
                          <img src={match.teams.home.logo} alt="" style={{ width: 24, height: 24 }} />
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${match.goals.home} - ${match.goals.away}`} 
                          size="small"
                          color={match.goals.home === match.goals.away ? "default" : "primary"}
                          sx={{ fontWeight: 'bold', borderRadius: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <img src={match.teams.away.logo} alt="" style={{ width: 24, height: 24 }} />
                          <Typography variant="body2" sx={{ fontWeight: match.teams.away.winner ? 'bold' : 'normal' }}>
                            {match.teams.away.name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary', fontSize: '0.75rem' }}>
                        {match.league.name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredMatches.length === 0 && (
                <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">
                  No hay partidos previos con este filtro.
                </Typography>
              )}
            </TableContainer>
          </>
        ) : (
          <Typography sx={{ mt: 2, textAlign: 'center' }}>No se encontraron datos.</Typography>
        )}
      </Box>
    </Modal>
  );
};

H2HModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
  team2Id: PropTypes.number.isRequired,
};

export default H2HModal;
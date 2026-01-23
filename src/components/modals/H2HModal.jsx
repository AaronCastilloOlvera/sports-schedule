import { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { apiClient } from '../../api/api';
import PropTypes from "prop-types";

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto'
};

const H2HModal = ({ open, onClose, team1Id, team2Id }) => {
  const [h2hData, setH2hData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && team1Id && team2Id) {
      setLoading(true);
      apiClient.fetchHeadToHeadMatches(team1Id, team2Id)
        .then(response => {
          setH2hData(response?.matches.slice(0, 10));
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="h2h-modal-title"
      aria-describedby="h2h-modal-description"
    >
      <Box sx={modalStyle}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography id="h2h-modal-title" variant="h6" component="h2" gutterBottom>
          Head-to-Head
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : h2hData && h2hData.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Liga</TableCell>
                  <TableCell align="right">Local</TableCell>
                  <TableCell align="center">Marcador</TableCell>
                  <TableCell>Visitante</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {h2hData.map((match) => (
                  <TableRow key={match.fixture.id}>
                    <TableCell>
                      {new Date(match.fixture.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{match.league.name}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {match.teams.home.name}
                        <img src={match.teams.home.logo} alt={match.teams.home.name} style={{ width: 20, height: 20, marginLeft: 8 }} />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${match.goals.home} - ${match.goals.away}`} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img src={match.teams.away.logo} alt={match.teams.away.name} style={{ width: 20, height: 20, marginRight: 8 }} />
                        {match.teams.away.name}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ mt: 2 }}>No se encontraron datos de enfrentamientos directos.</Typography>
        )}
      </Box>
    </Modal>
  );
};

H2HModal.propTypes = {
  open:    PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
  team2Id: PropTypes.number.isRequired,
};

export default H2HModal;

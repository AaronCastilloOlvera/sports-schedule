import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import PropTypes from "prop-types";
import LiveStatusChip from './LiveStatusChip';
import { Insights } from '@mui/icons-material';

export default function FixturesDesktopView({ processedFixtures, handleOpenH2HModal }) {
  return (
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
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processedFixtures?.map((match, index) => {
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
                          width: 35,
                          height: 35,
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
                  <LiveStatusChip statusShort={match.fixture.status.short} elapsed={match.fixture.status.elapsed} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {match.teams.home.name}
                    </Typography>

                    <Box
                      component="img"
                      src={match.teams.home.logo}
                      alt={match.teams.home.name}
                      sx={{ width: 35, height: 35, objectFit: 'contain', display: 'block', flexShrink: 0 }}
                    />
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
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }} >
                    <Box
                      component="img"
                      src={match.teams.away.logo}
                      alt={match.teams.away.name}
                      sx={{ width: 35, height: 35, objectFit: 'contain', display: 'block', flexShrink: 0 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                      {match.teams.away.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="textSecondary">{match.fixture.venue.name}</Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="Head to Head">
                    <IconButton
                      onClick={() => handleOpenH2HModal(match.teams.home.id, match.teams.away.id)}
                    >
                      <Insights />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

FixturesDesktopView.propTypes = {
  processedFixtures: PropTypes.array.isRequired,
  handleOpenH2HModal: PropTypes.func.isRequired,
};
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import PropTypes from "prop-types";
import LiveStatusChip from './LiveStatusChip';
import { Insights } from '@mui/icons-material';
import React from 'react';
import { areRowsEqual, matchPropTypes } from '../../../utils/matchComparisons';

// Component rendered for desktop view, showing matches in a table format with memoized rows for performance optimization
const MatchRow = React.memo(({ match, handleOpenH2HModal }) => (
  <TableRow key={match.fixture.id}>
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
      <LiveStatusChip fixture={match.fixture} />
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
), areRowsEqual);

MatchRow.displayName = 'MatchRow';

MatchRow.propTypes = {
  match: matchPropTypes,
  handleOpenH2HModal: PropTypes.func.isRequired,
};

function FixturesDesktopView({ processedFixtures, handleOpenH2HModal }) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="tabla de partidos">
        <TableHead>
          <TableRow>
            <TableCell>Liga</TableCell>
            <TableCell>Hora</TableCell>
            <TableCell align="right">Local</TableCell>
            <TableCell align="center">Marcador</TableCell>
            <TableCell align="left">Visitante</TableCell>
            <TableCell>Estadio</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processedFixtures?.map((match) => (
            <MatchRow key={match.fixture.id} match={match} handleOpenH2HModal={handleOpenH2HModal} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

FixturesDesktopView.propTypes = {
  processedFixtures: PropTypes.array.isRequired,
  handleOpenH2HModal: PropTypes.func.isRequired,
};

export default React.memo(FixturesDesktopView);
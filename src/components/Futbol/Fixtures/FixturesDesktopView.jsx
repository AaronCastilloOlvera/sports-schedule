import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import PropTypes from "prop-types";
import LiveStatusChip from './LiveStatusChip';
import { Insights } from '@mui/icons-material';
import React, { useEffect, useRef, useState } from 'react';
import { areRowsEqual, matchPropTypes } from '../../../utils/matchComparisons';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';

// Gol animation keyframes
const goalFlash = keyframes`
  0% { background-color: transparent; transform: scale(1); }
  10% { background-color: rgba(255, 215, 0, 0.8); transform: scale(1.15); font-weight: 900; color: #d32f2f; }
  50% { background-color: rgba(255, 215, 0, 0.3); transform: scale(1.05); color: inherit; }
  100% { background-color: transparent; transform: scale(1); font-weight: bold; }
`;

// Match row component for desktop view, showing matches in a table format
function MatchRow({ match, handleOpenH2HModal }) {
  const { t } = useTranslation();
  const prevHomeGoals = useRef(match.goals.home);
  const prevAwayGoals = useRef(match.goals.away);
  const [goalEvent, setGoalEvent] = useState(null);

  useEffect(() => {
    let timeoutId;

    // Home team goal
    if (match.goals.home !== null && prevHomeGoals.current !== null && match.goals.home > prevHomeGoals.current) {
      setGoalEvent('home');
      timeoutId = setTimeout(() => setGoalEvent(null), 3000);
    } 
    // Away team goal
    else if (match.goals.away !== null && prevAwayGoals.current !== null && match.goals.away > prevAwayGoals.current) {
      setGoalEvent('away');
      timeoutId = setTimeout(() => setGoalEvent(null), 3000);
    }

    prevHomeGoals.current = match.goals.home;
    prevAwayGoals.current = match.goals.away;

    return () => clearTimeout(timeoutId);
  }, [match.goals.home, match.goals.away]);

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {match.league.logo && (
            <Box
              component="img"
              src={match.league.logo}
              alt={match.league.name}
              sx={{ width: 35, height: 35, marginRight: 1, objectFit: 'contain', borderRadius: '4px' }}
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
            sx={{ width: 35, height: 35, objectFit: 'contain', flexShrink: 0 }}
          />
        </Box>
      </TableCell>
      <TableCell align="center">
        <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, display: 'inline-flex', gap: 1, alignItems: 'center' }}>
          <Typography
            key={`home-score-${match.goals.home}`}
            variant="subtitle1" 
            fontWeight="bold"
            sx={{ 
              display: 'inline-block',
              px: 1, 
              borderRadius: '4px',
              animation: goalEvent === 'home' ? `${goalFlash} 3s ease-out` : 'none'}}
          >
            {match.goals.home}
          </Typography>

          <Typography variant="subtitle1" fontWeight="bold">-</Typography>
          <Typography
            key={`away-score-${match.goals.away}`}
            variant="subtitle1" 
            fontWeight="bold"
            sx={{ 
              display: 'inline-block',
              px: 1, 
              borderRadius: '4px',
              animation: goalEvent === 'away' ? `${goalFlash} 3s ease-out` : 'none'
            }}
          >
            {match.goals.away}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="left">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1 }}>
          <Box
            component="img"
            src={match.teams.away.logo}
            alt={match.teams.away.name}
            sx={{ width: 35, height: 35, objectFit: 'contain', flexShrink: 0 }}
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
        <Tooltip title={t('fixtures.headToHead')}>
          <IconButton onClick={() => handleOpenH2HModal(match.teams.home.id, match.teams.away.id)}>
            <Insights />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

MatchRow.propTypes = {
  match: matchPropTypes.isRequired,
  handleOpenH2HModal: PropTypes.func.isRequired,
};

const MemoMatchRow = React.memo(MatchRow, areRowsEqual);
MemoMatchRow.displayName = 'MatchRow';

export default function FixturesDesktopView({ processedFixtures, handleOpenH2HModal }) {
  const { t } = useTranslation();

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label={t('fixtures.tableAriaLabel')}>
        <TableHead>
          <TableRow>
            <TableCell>{t('fixtures.table.league')}</TableCell>
            <TableCell>{t('fixtures.table.time')}</TableCell>
            <TableCell align="right">{t('fixtures.table.home')}</TableCell>
            <TableCell align="center">{t('fixtures.table.score')}</TableCell>
            <TableCell align="left">{t('fixtures.table.away')}</TableCell>
            <TableCell>{t('fixtures.table.stadium')}</TableCell>
            <TableCell>{t('fixtures.table.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {processedFixtures?.map((match) => (
            <MemoMatchRow key={match.fixture.id}  match={match} handleOpenH2HModal={handleOpenH2HModal}  />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

FixturesDesktopView.propTypes = {
  processedFixtures: PropTypes.arrayOf(matchPropTypes).isRequired,
  handleOpenH2HModal: PropTypes.func.isRequired,
};
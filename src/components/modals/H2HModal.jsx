import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, IconButton, CircularProgress, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/api';
import PropTypes from 'prop-types';
import H2HMatchHeader from './H2HMatchHeader';
import H2HMatchHistory from './H2HMatchHistory';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const H2HModal = ({ open, onClose, team1Id, team2Id, currentMatch }) => {
  const { t } = useTranslation();
  const [h2hData, setH2hData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (open && team1Id && team2Id) {
      setFilter('all');
      setLoading(true);
      apiClient.fetchHeadToHeadMatches(team1Id, team2Id)
        .then(response => setH2hData(response?.data.slice(0, 10)))
        .catch(() => setH2hData([]))
        .finally(() => setLoading(false));
    }
  }, [open, team1Id, team2Id]);

  const { nextMatch, teamHome, teamAway } = useMemo(() => {
    if (!h2hData.length) return {};
    const next = h2hData.find(m => m.fixture.status.short === 'NS');
    const sample = h2hData[0];
    const tHome = sample.teams.home.id === team1Id ? sample.teams.home : sample.teams.away;
    const tAway = sample.teams.away.id === team2Id ? sample.teams.away : sample.teams.home;
    return { nextMatch: next, teamHome: tHome, teamAway: tAway };
  }, [h2hData, team1Id, team2Id]);

  const filteredMatches = useMemo(() => {
    const past = h2hData
      .filter(m => m.fixture.status.short === 'FT')
      .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));
    if (filter === 'home') return past.filter(m => m.teams.home.id === team1Id);
    if (filter === 'away') return past.filter(m => m.teams.away.id === team1Id);
    return past;
  }, [h2hData, filter, team1Id]);

  const record = useMemo(() => {
    const team1Wins = filteredMatches.filter(m =>
      (m.teams.home.id === team1Id && m.teams.home.winner) ||
      (m.teams.away.id === team1Id && m.teams.away.winner)
    ).length;
    const draws = filteredMatches.filter(m => !m.teams.home.winner && !m.teams.away.winner).length;
    const team2Wins = filteredMatches.length - team1Wins - draws;
    return { team1Wins, draws, team2Wins };
  }, [filteredMatches, team1Id]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%' },
          maxWidth: 680,
          borderRadius: { xs: '16px', sm: '20px' },
          bgcolor: 'background.paper',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          fontFamily: FONT,
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute', right: 12, top: 12, zIndex: 10,
            width: { xs: 36, sm: 28 }, height: { xs: 36, sm: 28 },
            bgcolor: 'action.hover', color: 'text.secondary',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flex: 1, bgcolor: 'background.default' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : h2hData.length > 0 ? (
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <H2HMatchHeader
              teamHome={teamHome}
              teamAway={teamAway}
              nextMatch={nextMatch}
              currentMatch={currentMatch}
              record={record}
            />
            <H2HMatchHistory
              filteredMatches={filteredMatches}
              filter={filter}
              onFilterChange={setFilter}
              team1Id={team1Id}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flex: 1, bgcolor: 'background.default' }}>
            <Typography sx={{ color: 'text.secondary', fontFamily: FONT }}>
              {t('h2h.noData')}
            </Typography>
          </Box>
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
  currentMatch: PropTypes.object,
};

export default H2HModal;

import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, IconButton, CircularProgress, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/api';
import PropTypes from 'prop-types';
import H2HMatchHeader from './H2HMatchHeader';
import H2HMatchHistory from './H2HMatchHistory';

const H2HModal = ({ open, onClose, team1Id, team2Id }) => {
  const { t } = useTranslation();
  const [h2hData, setH2hData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (open && team1Id && team2Id) {
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
    const past = h2hData.filter(m => m.fixture.status.short === 'FT');
    if (filter === 'home') return past.filter(m => m.teams.home.id === team1Id);
    if (filter === 'away') return past.filter(m => m.teams.away.id === team1Id);
    return past;
  }, [h2hData, filter, team1Id]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%' },
          maxWidth: 860,
          borderRadius: 3,
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          bgcolor: 'background.paper',
        }}
      >
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute', right: 10, top: 10, zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.4)', color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : h2hData.length > 0 ? (
          <Box sx={{ overflow: 'auto', flex: 1 }}>
            <H2HMatchHeader
              teamHome={teamHome}
              teamAway={teamAway}
              nextMatch={nextMatch}
            />
            {/* Lifted-card body overlaps the header bottom by 28px */}
            <Box
              sx={{
                borderRadius: '22px 22px 0 0',
                bgcolor: 'background.paper',
                mt: '-28px',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 -6px 20px rgba(0,0,0,0.18)',
              }}
            >
              <H2HMatchHistory
                filteredMatches={filteredMatches}
                filter={filter}
                onFilterChange={setFilter}
                team1Id={team1Id}
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flex: 1 }}>
            <Typography color="text.secondary">{t('h2h.noData')}</Typography>
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
};

export default H2HModal;

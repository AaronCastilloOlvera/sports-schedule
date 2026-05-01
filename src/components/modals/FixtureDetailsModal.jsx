import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, IconButton, CircularProgress, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/api';
import PropTypes from 'prop-types';
import H2HMatchHeader from './H2HMatchHeader';
import H2HMatchHistory from './H2HMatchHistory';
import RecentMatchHistory from './RecentMatchHistory';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const FixtureDetailsModal = ({ open, onClose, team1Id, team2Id, currentMatch }) => {
  const { t } = useTranslation();

  // ── H2H state ──────────────────────────────────────────────────────────────
  const [h2hData, setH2hData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState('all');

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('h2h');

  // ── Recent matches state ───────────────────────────────────────────────────
  const [recentData, setRecentData]             = useState({ home: [], away: [] });
  const [isLoadingRecent, setIsLoadingRecent]   = useState(false);
  const [recentError, setRecentError]           = useState(false);
  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);
  const [recentTeamView, setRecentTeamView]     = useState('home');

  // ── Reset all state when modal opens with new fixture ──────────────────────
  useEffect(() => {
    if (open && team1Id && team2Id) {
      setFilter('all');
      setActiveTab('h2h');
      setRecentData({ home: [], away: [] });
      setHasFetchedRecent(false);
      setRecentError(false);
      setRecentTeamView('home');
      setLoading(true);
      apiClient.fetchHeadToHeadMatches(team1Id, team2Id)
        .then(response => setH2hData(response?.data?.slice(0, 10) ?? []))
        .catch(() => setH2hData([]))
        .finally(() => setLoading(false));
    }
  }, [open, team1Id, team2Id]);

  // ── Lazy-fetch recent matches only when the tab is first activated ─────────
  useEffect(() => {
    if (activeTab !== 'recent' || !team1Id || !team2Id || hasFetchedRecent) return;

    setHasFetchedRecent(true);
    setIsLoadingRecent(true);
    setRecentError(false);

    Promise.all([
      apiClient.fetchRecentMatches(team1Id),
      apiClient.fetchRecentMatches(team2Id),
    ])
      .then(([homeRes, awayRes]) => {
        setRecentData({
          home: homeRes?.data ?? homeRes ?? [],
          away: awayRes?.data ?? awayRes ?? [],
        });
      })
      .catch(() => setRecentError(true))
      .finally(() => setIsLoadingRecent(false));
  }, [activeTab, team1Id, team2Id, hasFetchedRecent]);

  // ── Derived H2H values ─────────────────────────────────────────────────────
  const { nextMatch, teamHome, teamAway } = useMemo(() => {
    if (!h2hData.length) return {};
    const next   = h2hData.find(m => m.fixture.status.short === 'NS');
    const sample = h2hData[0];
    const tHome  = sample.teams.home.id === team1Id ? sample.teams.home : sample.teams.away;
    const tAway  = sample.teams.away.id === team2Id ? sample.teams.away : sample.teams.home;
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
    const draws     = filteredMatches.filter(m => !m.teams.home.winner && !m.teams.away.winner).length;
    const team2Wins = filteredMatches.length - team1Wins - draws;
    return { team1Wins, draws, team2Wins };
  }, [filteredMatches, team1Id]);

  // ── Tab definitions (inside component so t() is available) ─────────────────
  const TABS = [
    { value: 'h2h',    label: t('h2h.tabs.h2h') },
    { value: 'recent', label: t('h2h.tabs.recent') },
  ];

  // ── Recent tab content ─────────────────────────────────────────────────────
  const recentContent = (() => {
    if (isLoadingRecent) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 8 }}>
          <CircularProgress size={22} color="primary" />
          <Typography sx={{ color: 'text.secondary', fontSize: 14, fontFamily: FONT }}>
            {t('loading')}
          </Typography>
        </Box>
      );
    }
    if (recentError) {
      return (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: 'error.main', fontSize: 14, fontFamily: FONT }}>
            {t('error_fetching_data')}
          </Typography>
        </Box>
      );
    }
    const activeMatches = recentTeamView === 'home' ? recentData.home : recentData.away;
    if (!activeMatches.length && hasFetchedRecent) {
      return (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, fontFamily: FONT }}>
            {t('no_recent_matches')}
          </Typography>
        </Box>
      );
    }
    return (
      <RecentMatchHistory
        homeMatches={recentData.home}
        awayMatches={recentData.away}
        teamHome={teamHome}
        teamAway={teamAway}
        team1Id={team1Id}
        team2Id={team2Id}
        teamView={recentTeamView}
        onTeamViewChange={setRecentTeamView}
      />
    );
  })();

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%' }, maxWidth: 680,
          borderRadius: { xs: '16px', sm: '20px' },
          bgcolor: 'background.paper',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)',
          maxHeight: '90vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          outline: 'none', fontFamily: FONT,
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

            {/* ── Tab bar ── */}
            <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
              {TABS.map(tab => (
                <Box
                  key={tab.value}
                  component="button"
                  onClick={() => setActiveTab(tab.value)}
                  sx={{
                    flex: 1, py: '11px',
                    border: 'none', outline: 'none', cursor: 'pointer',
                    bgcolor: 'transparent',
                    borderBottom: '2px solid',
                    borderColor: activeTab === tab.value ? 'primary.main' : 'transparent',
                    fontSize: 13, fontWeight: activeTab === tab.value ? 600 : 400,
                    color: activeTab === tab.value ? 'primary.main' : 'text.secondary',
                    fontFamily: FONT, letterSpacing: '-0.1px',
                    transition: 'color 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  {tab.label}
                </Box>
              ))}
            </Box>

            {/* ── Tab content ── */}
            {activeTab === 'h2h' ? (
              <H2HMatchHistory
                filteredMatches={filteredMatches}
                filter={filter}
                onFilterChange={setFilter}
                team1Id={team1Id}
              />
            ) : recentContent}
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

FixtureDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
  team2Id: PropTypes.number.isRequired,
  currentMatch: PropTypes.object,
};

export default FixtureDetailsModal;

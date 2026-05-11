import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, IconButton, CircularProgress, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../api/api';
import PropTypes from 'prop-types';
import ErrorBoundary from '../../common/ErrorBoundary';
import MatchHeader from './MatchHeader';
import HeadToHead from './HeadToHead';
import RecentForm from './RecentForm';
import MatchOdds from './MatchOdds';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const MatchDetailsModal = ({ open, onClose, team1Id, team2Id, currentMatch }) => {
  const { t } = useTranslation();

  const [filter, setFilter]           = useState('all');
  const [activeTab, setActiveTab]     = useState('h2h');
  const [recentTeamView, setRecentTeamView] = useState('home');

  // Reset UI state when the match changes
  useEffect(() => {
    setFilter('all');
    setActiveTab('h2h');
    setRecentTeamView('home');
  }, [team1Id, team2Id]);

  const fixtureId = currentMatch?.fixture?.id;

  const { data: h2hData = [], isLoading } = useQuery({
    queryKey: ['h2h', team1Id, team2Id],
    queryFn: () => apiClient.fetchHeadToHeadMatches(team1Id, team2Id),
    enabled: open && !!team1Id && !!team2Id,
    select: (res) => [...(res?.data ?? res ?? [])]
      .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
      .slice(0, 10),
  });

  const { data: homeRecent = [], isLoading: isLoadingHomeRecent, isError: isHomeRecentError } = useQuery({
    queryKey: ['recent', team1Id],
    queryFn: () => apiClient.fetchRecentMatches(team1Id),
    enabled: open && !!team1Id,
    select: (res) => res?.data ?? res ?? [],
  });

  const { data: awayRecent = [], isLoading: isLoadingAwayRecent, isError: isAwayRecentError } = useQuery({
    queryKey: ['recent', team2Id],
    queryFn: () => apiClient.fetchRecentMatches(team2Id),
    enabled: open && !!team2Id,
    select: (res) => res?.data ?? res ?? [],
  });

  const { data: oddsData = null, isLoading: isLoadingOdds } = useQuery({
    queryKey: ['odds', fixtureId],
    queryFn: () => apiClient.fetchOdds(fixtureId),
    enabled: open && !!fixtureId,
    select: (res) => res?.data ?? res ?? null,
  });

  const isLoadingRecent = isLoadingHomeRecent || isLoadingAwayRecent;
  const recentError     = isHomeRecentError || isAwayRecentError;

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

  const TABS = [
    { value: 'h2h',    label: t('h2h.tabs.h2h') },
    { value: 'recent', label: t('h2h.tabs.recent') },
    { value: 'odds',   label: t('h2h.tabs.odds') },
  ];

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
    const activeMatches = recentTeamView === 'home' ? homeRecent : awayRecent;
    if (!activeMatches.length) {
      return (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, fontFamily: FONT }}>
            {t('no_recent_matches')}
          </Typography>
        </Box>
      );
    }
    return (
      <RecentForm
        homeMatches={homeRecent}
        awayMatches={awayRecent}
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
          height: '80vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          outline: 'none', fontFamily: FONT,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute', right: 12, top: 12, zIndex: 10,
            width: 36, height: 36,
            bgcolor: 'rgba(0,0,0,0.40)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.60)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10, flex: 1, bgcolor: 'background.default' }}>
            <CircularProgress color="primary" />
          </Box>
        ) : h2hData.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <ErrorBoundary>
              <MatchHeader
                teamHome={teamHome}
                teamAway={teamAway}
                nextMatch={nextMatch}
                currentMatch={currentMatch}
              />
            </ErrorBoundary>

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
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ErrorBoundary>
                {activeTab === 'h2h' ? (
                  <HeadToHead
                    filteredMatches={filteredMatches}
                    filter={filter}
                    onFilterChange={setFilter}
                    team1Id={team1Id}
                    teamHome={teamHome}
                    teamAway={teamAway}
                  />
                ) : activeTab === 'odds' ? (
                  <MatchOdds
                    oddsData={oddsData}
                    loading={isLoadingOdds}
                    teamHome={teamHome}
                    teamAway={teamAway}
                  />
                ) : recentContent}
              </ErrorBoundary>
            </Box>
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

MatchDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
  team2Id: PropTypes.number.isRequired,
  currentMatch: PropTypes.object,
};

export default MatchDetailsModal;

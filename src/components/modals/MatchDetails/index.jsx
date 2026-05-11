import { useState, useEffect, useMemo } from 'react';
import { Modal, Box, IconButton, Skeleton, Typography, useMediaQuery } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../../api/api';
import PropTypes from 'prop-types';
import ErrorBoundary from '../../common/ErrorBoundary';
import MatchHeader from './MatchHeader';
import MatchHeaderMobile from './MatchHeaderMobile';
import HeadToHead from './HeadToHead';
import RecentForm from './RecentForm';
import MatchOdds from './MatchOdds';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

function MatchDetailsSkeleton() {
  const skeletonBg = 'rgba(255,255,255,0.08)';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header skeleton — same dark background as MatchHeader */}
      <Box sx={{
        bgcolor: 'rgb(10,12,18)',
        px: { xs: '12px', sm: '24px' },
        pt: { xs: '14px', sm: '22px' },
        pb: { xs: '16px', sm: '22px' },
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: '10px', sm: '14px' } }}>
          <Skeleton variant="text" width={180} sx={{ bgcolor: skeletonBg }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: { xs: 'center', sm: 'flex-start' }, justifyContent: 'center', gap: { xs: '8px', sm: '20px' } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: '4px', sm: '10px' }, flex: 1, minWidth: 0 }}>
            <Skeleton variant="circular" width={72} height={72} sx={{ bgcolor: skeletonBg }} />
            <Skeleton variant="text" width={72} sx={{ bgcolor: skeletonBg }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexGrow: { xs: 0, sm: 2 }, flexShrink: 0 }}>
            <Skeleton variant="rounded" width={{ xs: 80, sm: 140 }} height={{ xs: 40, sm: 66 }} sx={{ borderRadius: { xs: '10px', sm: '16px' }, bgcolor: skeletonBg }} />
            <Skeleton variant="text" width={40} sx={{ bgcolor: skeletonBg }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: '4px', sm: '10px' }, flex: 1, minWidth: 0 }}>
            <Skeleton variant="circular" width={72} height={72} sx={{ bgcolor: skeletonBg }} />
            <Skeleton variant="text" width={72} sx={{ bgcolor: skeletonBg }} />
          </Box>
        </Box>
      </Box>

      {/* Tab bar skeleton */}
      <Box sx={{ display: 'flex', bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} sx={{ flex: 1, py: '11px', display: 'flex', justifyContent: 'center' }}>
            <Skeleton width={44} height={18} />
          </Box>
        ))}
      </Box>

      {/* WinDistributionBar skeleton */}
      <Box sx={{ px: { xs: 2, sm: '20px' }, pt: '14px', pb: '12px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Skeleton width={24} height={20} />
            <Skeleton width={72} height={13} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Skeleton width={24} height={20} />
            <Skeleton width={40} height={13} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <Skeleton width={24} height={20} />
            <Skeleton width={72} height={13} />
          </Box>
        </Box>
        <Skeleton variant="rounded" height={6} sx={{ borderRadius: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '4px' }}>
          <Skeleton width={28} height={12} />
          <Skeleton width={28} height={12} />
          <Skeleton width={28} height={12} />
        </Box>
      </Box>

      {/* AggregateStats skeleton */}
      <Box sx={{ display: 'flex', borderBottom: '0.5px solid', borderColor: 'divider' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} sx={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '4px', py: '12px',
            borderRight: i < 2 ? '0.5px solid' : 'none', borderColor: 'divider',
          }}>
            <Skeleton width={36} height={24} />
            <Skeleton width={60} height={12} />
          </Box>
        ))}
      </Box>

      {/* H2H rows skeleton */}
      <Box sx={{ px: { xs: '12px', sm: '16px' }, pt: '14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Skeleton width={48} height={14} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Skeleton variant="rounded" width={18} height={18} />
              <Skeleton width={70} height={14} />
            </Box>
            <Skeleton variant="rounded" width={58} height={28} sx={{ borderRadius: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Skeleton width={70} height={14} />
              <Skeleton variant="rounded" width={18} height={18} />
            </Box>
            <Skeleton width={48} height={14} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const MatchDetailsModal = ({ open, onClose, team1Id, team2Id, currentMatch }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 480px)');

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
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Skeleton variant="rounded" width={18} height={18} />
              <Skeleton width={90} />
              <Box sx={{ flex: 1 }} />
              <Skeleton variant="rounded" width={48} height={22} sx={{ borderRadius: 1 }} />
              <Skeleton width={32} />
            </Box>
          ))}
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
          <MatchDetailsSkeleton />
        ) : h2hData.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <ErrorBoundary>
              {isMobile ? (
                <MatchHeaderMobile
                  teamHome={teamHome}
                  teamAway={teamAway}
                  nextMatch={nextMatch}
                  currentMatch={currentMatch}
                />
              ) : (
                <MatchHeader
                  teamHome={teamHome}
                  teamAway={teamAway}
                  nextMatch={nextMatch}
                  currentMatch={currentMatch}
                />
              )}
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

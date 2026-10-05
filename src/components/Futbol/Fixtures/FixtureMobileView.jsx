import { Box, Card, CardContent, Tooltip, Typography, IconButton } from '@mui/material';
import { Insights } from '@mui/icons-material';
import LiveStatusChip from './LiveStatusChip';
import PropTypes from "prop-types";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { areRowsEqual, matchPropTypes } from '../../../utils/matchComparisons';
import { statusPriority } from './consts';
import { CONF_COLOR } from '../betRadarShared';
import { goalFlash, useGoalFlash } from './useGoalFlash';

// Component rendered for mobile view, showing matches in a card format
const MatchMobileCard = React.memo(({ match, handleOpenH2HModal }) => {
  const { t } = useTranslation();
  const isFinished = statusPriority[match.fixture.status.short] === 3;
  const goalEvent = useGoalFlash(match.goals.home, match.goals.away);
  const maxConfidence = match.betRadar
    ? Math.max(...(match.betRadar.top_picks ?? []).map(p => p.confidence ?? 0), 0)
    : null;
  return (
  <Card key={match.fixture.id} elevation={2} sx={{ borderRadius: 2, opacity: isFinished ? 0.55 : 1, transition: 'opacity 0.2s' }}>
    <CardContent sx={{ pb: '16px !important' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {match.league.logo && (
            <Box component="img" src={match.league.logo} alt={match.league.name} sx={{ width: 24, height: 24, objectFit: 'contain' }} />
          )}
          <Typography variant="caption" color="textSecondary">
            {match.league.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LiveStatusChip fixture={match.fixture} sport={match.sport} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
          <Box component="img" src={match.teams.home.logo} sx={{ width: 45, height: 45, objectFit: 'contain', mb: 0.5 }} />
          <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>
            {match.teams.home.name}
          </Typography>
        </Box>
        
        <Box sx={{ px: 2 }}>
          <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'inline-block' }}>
            {match.fixture.status.elapsed !== null ? (
              <Typography variant="h5" fontWeight="bold">
                <Box
                  component="span"
                  sx={{ display: 'inline-block', px: '2px', borderRadius: '4px', animation: goalEvent === 'home' ? `${goalFlash} 3s ease-out` : 'none' }}
                >
                  {match.goals.home}
                </Box>
                {' - '}
                <Box
                  component="span"
                  sx={{ display: 'inline-block', px: '2px', borderRadius: '4px', animation: goalEvent === 'away' ? `${goalFlash} 3s ease-out` : 'none' }}
                >
                  {match.goals.away}
                </Box>
              </Typography>
            ) : (
              <Typography fontWeight="bold">VS</Typography>
            )}
          </Box>
        </Box>

        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, textAlign: 'center' }}>
          <Box component="img" src={match.teams.away.logo} sx={{ width: 45, height: 45, objectFit: 'contain', mb: 0.5 }} />
          <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>
            {match.teams.away.name}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="textSecondary" sx={{ maxWidth: '80%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          🏟️ {match.fixture.venue.name || t('fixtures.stadiumTBD')}
        </Typography>
        {/* NOTE: tints the H2H icon by BetRadar confidence instead of a
            separate badge, one icon doing two jobs. BetRadar is a betting
            signal though -- once auth/roles land, normal users should see
            this icon in its plain default color always (or the tint dropped
            entirely for them); only an admin should see the real confidence
            color. */}
        <Tooltip title={match.betRadar ? `${t('fixtures.headToHead')} · BetRadar ${maxConfidence}%` : t('fixtures.headToHead')}>
          <IconButton
            size="small"
            aria-label={t('fixtures.headToHead')}
            onClick={() => handleOpenH2HModal(match.teams.home.id, match.teams.away.id, match.fixture.id)}
            color={match.betRadar ? undefined : 'primary'}
          >
            <Insights fontSize="small" sx={{ color: match.betRadar ? CONF_COLOR(maxConfidence) : undefined }} />
          </IconButton>
        </Tooltip>
      </Box>

    </CardContent>
  </Card>
  );
}, areRowsEqual);

MatchMobileCard.displayName = 'MatchMobileCard';

MatchMobileCard.propTypes = {
  match: matchPropTypes,
  handleOpenH2HModal: PropTypes.func.isRequired,
};

function FixtureMobileView({ processedFixtures, handleOpenH2HModal }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {processedFixtures.map((match) => (
        <MatchMobileCard key={match.fixture.id} match={match} handleOpenH2HModal={handleOpenH2HModal} />
      ))}
    </Box>
  );  
}

FixtureMobileView.propTypes = {
  processedFixtures: PropTypes.array.isRequired,
  handleOpenH2HModal: PropTypes.func.isRequired,
};

export default React.memo(FixtureMobileView);
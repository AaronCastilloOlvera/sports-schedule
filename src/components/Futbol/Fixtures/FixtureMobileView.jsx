import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { Insights } from '@mui/icons-material';
import LiveStatusChip from './LiveStatusChip';
import PropTypes from "prop-types";
import React from 'react';
import { areRowsEqual, matchPropTypes } from '../../../utils/matchComparisons';

// Component rendered for mobile view, showing matches in a card format
const MatchMobileCard = React.memo(({ match, handleOpenH2HModal }) => (
  <Card key={match.fixture.id} elevation={2} sx={{ borderRadius: 2 }}>
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
          <LiveStatusChip fixture={match.fixture} />
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
            <Typography variant="h5" fontWeight="bold">
              {match.fixture.status.elapsed !== null ?  
               ( <Typography variant="h5" fontWeight="bold"> {match.goals.home} - {match.goals.away}</Typography>)
               : 
               ( <Typography fontWeight="bold" > VS </Typography>)
              }
            </Typography>
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
          🏟️ {match.fixture.venue.name || 'Estadio por definir'}
        </Typography>
        <IconButton size="small" onClick={() => handleOpenH2HModal(match.teams.home.id, match.teams.away.id)} color="primary">
          <Insights fontSize="small" />
        </IconButton>
      </Box>

    </CardContent>
  </Card>
), areRowsEqual);

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
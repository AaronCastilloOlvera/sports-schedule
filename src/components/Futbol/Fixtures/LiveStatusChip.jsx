import { Chip, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import PropTypes from "prop-types";
import { statusPriority } from './consts';

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(229, 57, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
`;

export default function LiveStatusChip({ fixture }) {
  const { status, date } = fixture;
  const shortStatus = status.short;
  const isLive = statusPriority[shortStatus] === 1;
  const isFinished = statusPriority[shortStatus] === 3;

  // Case 1. Not started matches show the scheduled time
  if (shortStatus === 'NS' || shortStatus === 'TBD') {
    const localTime = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        {localTime}
      </Typography>
    );
  }

  // Case 2. Live matches show the elapsed time or status in a red chip with pulse animation
  if (isLive) {
    const displayLabel = status.elapsed && shortStatus !== 'HT' ? `${status.elapsed}'` : shortStatus;
    return (
      <Chip
        label={displayLabel}
        size='small'
        color={'error'}
        sx={{ 
            height: 20, 
            fontSize: '0.65rem',
            fontWeight: isLive ? 'bold' : 'normal',
            animation: isLive ? `${pulseAnimation} 2s infinite` : 'none',
            borderRadius: '4px'
          }}
      />
    );
  }

  // Case 3. Finished matches show "FT" or the appropriate status in a muted chip
  return (
    <Chip
      label={shortStatus}
      size="small"
      sx={{
        height: 18,
        fontSize: '0.65rem',
        backgroundColor: isFinished ? 'action.selected' : 'warning.light',
        color: isFinished ? 'text.secondary' : 'warning.dark',
        borderRadius: 1
      }}
    />
  );
}

LiveStatusChip.propTypes = {
  fixture: PropTypes.object.isRequired
};
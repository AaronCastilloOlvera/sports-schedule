import { Chip } from '@mui/material';
import { keyframes } from '@mui/system';
import PropTypes from "prop-types";

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(229, 57, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
`;

const statusPriority = {
    // In Progress (Priority 1)
    '1H': 1, 'HT': 1, '2H': 1, 'ET': 1, 'BT': 1, 'P': 1, 'LIVE': 1, 'INT': 1,
    // Not Started (Priority 2)
    'NS': 2, 'TBD': 2,
    // Finished (Priority 3)
    'FT': 3, 'AET': 3, 'PEN': 3, 'PST': 3, 'CANC': 3
  };

export default function LiveStatusChip({ statusShort, elapsed }) {
  const isLive = statusPriority[statusShort] === 1;

  return (
    <Chip
      label={isLive && elapsed ? `${elapsed}'` : statusShort}
      size='small'
      color={isLive ? 'error' : statusShort === 'FT' ? 'default' : 'primary'}
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

LiveStatusChip.propTypes = {
  statusShort: PropTypes.string.isRequired,
  elapsed: PropTypes.number,
};
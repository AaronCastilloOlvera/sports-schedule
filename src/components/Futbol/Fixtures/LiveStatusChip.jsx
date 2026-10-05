import { Chip } from '@mui/material';
import { keyframes } from '@mui/system';
import PropTypes from "prop-types";
import { statusPriority } from './consts';

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(229, 57, 53, 0); }
  100% { box-shadow: 0 0 0 0 rgba(229, 57, 53, 0); }
`;

// One live-label formatter per sport — add a sport by adding an entry here.
const LIVE_LABEL = {
  futbol: ({ short, elapsed, extra }) =>
    short === 'HT' ? 'HT'
      : extra > 0  ? `${elapsed} + ${extra}'`
      : `${elapsed}'`,

  // Pre-formatted string from normalizeBaseball, e.g. "Alta 4° · 2 outs".
  baseball: ({ short, elapsed }) => elapsed || short,

  // Pre-formatted string from normalizeNFL, e.g. "Q2 3:53" or "Medio tiempo".
  nfl: ({ short, elapsed }) => elapsed || short,
};

const liveLabel = (sport, status) => (LIVE_LABEL[sport] ?? LIVE_LABEL.futbol)(status);

export default function LiveStatusChip({ fixture, sport = 'futbol' }) {
  const { status, date } = fixture;
  const shortStatus = status.short;
  const isLive = statusPriority[shortStatus] === 1;
  const isFinished = statusPriority[shortStatus] === 3;

  // Case 1. Not started matches show the scheduled time — same Chip shape as
  if (shortStatus === 'NS' || shortStatus === 'TBD') {
    const localTime = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <Chip
        label={localTime}
        size="small"
        variant="outlined"
        color="primary"
        sx={{ height: 22, fontSize: '0.775rem', fontWeight: 'bold', borderRadius: '4px' }}
      />
    );
  }

  // Case 2. Live matches show the elapsed time or status in a red chip with pulse animation
  if (isLive) {
    return (
      <Chip
        label={liveLabel(sport, status)}
        size='small'
        color={'error'}
        sx={{ 
            height: 22, 
            fontSize: '0.775rem',
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
        height: 22,
        fontSize: '0.775rem',
        backgroundColor: isFinished ? 'action.selected' : 'warning.main',
        color: isFinished ? 'text.secondary' : 'warning.contrastText',
        borderRadius: 1
      }}
    />
  );
}

LiveStatusChip.propTypes = {
  fixture: PropTypes.object.isRequired,
  sport: PropTypes.oneOf(Object.keys(LIVE_LABEL)),
};
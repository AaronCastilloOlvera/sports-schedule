import { Box, Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';

// Shared empty/error state for the Matches view — keeps "no data today" and
// "request failed" visually distinct instead of showing the same blank message.
export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }} role="status" aria-live="polite">
      <Typography sx={{ fontSize: 40 }} aria-hidden="true">{icon}</Typography>
      <Typography sx={{ fontWeight: 600, mt: 1 }}>{title}</Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="small" variant="outlined" sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

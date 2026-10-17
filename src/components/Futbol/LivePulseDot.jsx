import { Box } from '@mui/material';

export default function LivePulseDot() {
  return (
    <Box sx={{
      width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0,
      animation: 'livePulse 1.5s ease-in-out infinite',
      '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
    }} />
  );
}

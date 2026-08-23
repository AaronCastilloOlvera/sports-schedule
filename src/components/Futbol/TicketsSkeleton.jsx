import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';
import PropTypes from 'prop-types';

function StatTilesSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2, ...(i === 4 && { gridColumn: { xs: 'span 2', sm: 'auto' } }) }}>
          <Skeleton width={80} />
          <Skeleton width={100} height={32} sx={{ mt: 0.5 }} />
        </Box>
      ))}
    </Box>
  );
}

function MobileCardsSkeleton() {
  return (
    <Box>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} sx={{ mb: 1, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ p: '10px 12px', '&:last-child': { pb: '10px' } }}>
            {/* Row 1: chip + pick + action icons */}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: '6px' }}>
              <Skeleton variant="rounded" width={52} height={20} />
              <Skeleton width="55%" height={18} />
              <Box sx={{ flex: 1 }} />
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="circular" width={20} height={20} />
            </Stack>
            {/* Row 2: date · odds · stake · net P&L */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Skeleton width={32} height={14} />
              <Skeleton width={32} height={14} />
              <Skeleton width={48} height={14} />
              <Box sx={{ flex: 1 }} />
              <Skeleton width={60} height={18} />
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function DesktopTableSkeleton() {
  const colWidths = [110, 250, 90, 100, 110, 100, 130, 150];
  return (
    <Box sx={{ width: '100%', backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 2 }}>
      <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
        {colWidths.map((w, i) => <Skeleton key={i} width={w} height={20} />)}
      </Stack>
      {Array.from({ length: 8 }).map((_, i) => (
        <Stack key={i} direction="row" spacing={3} alignItems="center" sx={{ py: 1.2, borderTop: '1px solid', borderColor: 'divider' }}>
          {colWidths.map((w, j) => (
            j === 5
              ? <Skeleton key={j} variant="rounded" width={70} height={24} />
              : <Skeleton key={j} width={w} height={20} />
          ))}
        </Stack>
      ))}
    </Box>
  );
}

export default function TicketsSkeleton({ isMobile }) {
  return (
    <Box>
      <StatTilesSkeleton />
      {isMobile ? <MobileCardsSkeleton /> : <DesktopTableSkeleton />}
    </Box>
  );
}

TicketsSkeleton.propTypes = {
  isMobile: PropTypes.bool,
};

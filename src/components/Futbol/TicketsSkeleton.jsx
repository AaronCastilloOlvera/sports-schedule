import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';
import PropTypes from 'prop-types';

function StatTilesSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 2, ...(i === 4 && { gridColumn: { xs: 'span 2', sm: 'auto' } }) }}>
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
        <Card key={i} sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Skeleton variant="rounded" width={60} height={22} />
              <Skeleton width={40} />
            </Stack>
            <Skeleton width="80%" sx={{ mb: 1.5 }} />
            <Stack direction="row" spacing={3}>
              {[45, 55, 55].map((w, j) => (
                <Box key={j}>
                  <Skeleton width={35} height={14} />
                  <Skeleton width={w} height={20} />
                </Box>
              ))}
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
    <Box sx={{ width: '100%', backgroundColor: 'white', borderRadius: 2, boxShadow: 2, p: 2 }}>
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

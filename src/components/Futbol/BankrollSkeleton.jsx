import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';
import PropTypes from 'prop-types';

function SummaryCardsSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} sx={{ boxShadow: 2 }}>
          <CardContent>
            <Skeleton width={90} />
            <Skeleton width={110} height={32} sx={{ mt: 0.5 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function GoalSkeleton() {
  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
        <Box>
          <Skeleton width={110} />
          <Skeleton width={160} height={28} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton width={60} height={32} />
      </Stack>
      <Skeleton variant="rounded" height={14} sx={{ borderRadius: 7 }} />
      <Skeleton width={140} sx={{ mt: 0.5 }} />
    </Box>
  );
}

function ChartSkeleton() {
  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
      <Skeleton width={150} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={180} />
    </Box>
  );
}

function MobileTransactionsSkeleton() {
  return (
    <Box>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Skeleton variant="rounded" width={80} height={22} />
              <Skeleton width={70} />
            </Stack>
            <Skeleton width={100} height={28} sx={{ my: 0.5 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

function DesktopTransactionsSkeleton() {
  const colWidths = [120, 130, 120, 200, 100];
  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 2 }}>
      <Stack direction="row" spacing={3} sx={{ mb: 1.5 }}>
        {colWidths.map((w, i) => <Skeleton key={i} width={w} height={20} />)}
      </Stack>
      {Array.from({ length: 6 }).map((_, i) => (
        <Stack key={i} direction="row" spacing={3} alignItems="center" sx={{ py: 1.2, borderTop: '1px solid', borderColor: 'divider' }}>
          {colWidths.map((w, j) => (
            j === 0
              ? <Skeleton key={j} variant="rounded" width={90} height={24} />
              : <Skeleton key={j} width={w} height={20} />
          ))}
        </Stack>
      ))}
    </Box>
  );
}

export default function BankrollSkeleton({ isMobile }) {
  return (
    <Box>
      <SummaryCardsSkeleton />
      <GoalSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
      <ChartSkeleton />
      <Skeleton width={140} height={32} sx={{ mb: 2 }} />
      {isMobile ? <MobileTransactionsSkeleton /> : <DesktopTransactionsSkeleton />}
    </Box>
  );
}

BankrollSkeleton.propTypes = {
  isMobile: PropTypes.bool,
};

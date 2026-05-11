import { Box, Card, CardContent, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import PropTypes from 'prop-types';

function ChipsSkeleton() {
  return (
    <Stack direction="row" sx={{ flexWrap: 'nowrap', overflowX: 'auto', gap: 1, pb: 2 }}>
      {[50, 120, 100, 130, 110].map((w, i) => (
        <Skeleton key={i} variant="rounded" width={w} height={32} sx={{ borderRadius: '16px', flexShrink: 0 }} />
      ))}
    </Stack>
  );
}

function DesktopSkeleton() {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {[80, 60, 80, 50, 80, 70, 30].map((w, i) => (
              <TableCell key={i}><Skeleton width={w} /></TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="rounded" width={35} height={35} />
                  <Skeleton width={100} />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton variant="rounded" width={60} height={24} />
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                  <Skeleton width={90} />
                  <Skeleton variant="rounded" width={35} height={35} />
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Skeleton variant="rounded" width={60} height={32} />
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Skeleton variant="rounded" width={35} height={35} />
                  <Skeleton width={90} />
                </Box>
              </TableCell>
              <TableCell><Skeleton width={80} /></TableCell>
              <TableCell>
                <Skeleton variant="circular" width={32} height={32} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MobileSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ pb: '16px !important' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="rounded" width={24} height={24} />
                <Skeleton width={100} />
              </Box>
              <Skeleton variant="rounded" width={55} height={24} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 0.5 }}>
                <Skeleton variant="rounded" width={45} height={45} />
                <Skeleton width={70} />
              </Box>
              <Box sx={{ px: 2 }}>
                <Skeleton variant="rounded" width={65} height={40} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 0.5 }}>
                <Skeleton variant="rounded" width={45} height={45} />
                <Skeleton width={70} />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Skeleton width={120} />
              <Skeleton variant="circular" width={30} height={30} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default function FixturesSkeleton({ isMobile }) {
  return (
    <Box>
      <ChipsSkeleton />
      {isMobile ? <MobileSkeleton /> : <DesktopSkeleton />}
    </Box>
  );
}

FixturesSkeleton.propTypes = {
  isMobile: PropTypes.bool,
};

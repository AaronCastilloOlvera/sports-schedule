import {
  Box, Stack, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, ToggleButtonGroup,
  ToggleButton, Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

export default function H2HMatchHistory({ filteredMatches, filter, onFilterChange, team1Id }) {
  const { t } = useTranslation();

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: { xs: 2, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
          {t('h2h.lastMatches')}
        </Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => val && onFilterChange(val)}
          size="small"
          sx={{
            bgcolor: 'grey.100',
            borderRadius: '999px',
            p: '3px',
            '& .MuiToggleButtonGroup-grouped': {
              border: '0 !important',
              borderRadius: '999px !important',
              px: { xs: 1.5, sm: 2 },
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              textTransform: 'none',
              '&.Mui-selected': {
                bgcolor: 'white',
                color: 'primary.main',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: 'white' },
              },
            },
          }}
        >
          <ToggleButton value="all">{t('h2h.filters.all')}</ToggleButton>
          <ToggleButton value="home">{t('h2h.filters.home')}</ToggleButton>
          <ToggleButton value="away">{t('h2h.filters.away')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <TableContainer
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: { xs: 320, sm: 400 },
        }}
      >
        <Table size="small" sx={{ minWidth: 480 }}>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                {t('h2h.table.date')}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                {t('h2h.table.home')}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                {t('h2h.table.result')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>
                {t('h2h.table.away')}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>
                {t('h2h.table.league')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMatches.map((match) => {
              const homeWon = match.teams.home.winner;
              const awayWon = match.teams.away.winner;
              const isDraw = !homeWon && !awayWon;
              const team1Won =
                (match.teams.home.id === team1Id && homeWon) ||
                (match.teams.away.id === team1Id && awayWon);
              return (
                <TableRow
                  key={match.fixture.id}
                  hover
                  sx={{
                    '&:last-child td': { border: 0 },
                    ...(team1Won && { bgcolor: 'rgba(76,175,80,0.07)' }),
                  }}
                >
                  {/* Date + Weekday stacked */}
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 1.75 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.2 }}>
                        {new Date(match.fixture.date).toLocaleDateString('es-MX', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', textTransform: 'capitalize', lineHeight: 1.2 }}>
                        {new Date(match.fixture.date).toLocaleDateString('es-MX', { weekday: 'long' })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.75 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="flex-end">
                      <Typography sx={{ fontWeight: homeWon ? 700 : 400, fontSize: '0.88rem' }}>
                        {match.teams.home.name}
                      </Typography>
                      <Box component="img" src={match.teams.home.logo} alt="" sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                    </Stack>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.75 }}>
                    <Chip
                      label={`${match.goals.home} - ${match.goals.away}`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        borderRadius: 1,
                        fontSize: '0.82rem',
                        height: 24,
                        bgcolor: isDraw ? 'grey.200' : 'primary.main',
                        color: isDraw ? 'text.primary' : 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.75 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box component="img" src={match.teams.away.logo} alt="" sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                      <Typography sx={{ fontWeight: awayWon ? 700 : 400, fontSize: '0.88rem' }}>
                        {match.teams.away.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: '0.82rem', color: 'text.secondary', py: 1.75 }}>
                    {match.league.name}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredMatches.length === 0 && (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              {t('h2h.noMatchesFilter')}
            </Typography>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}

H2HMatchHistory.propTypes = {
  filteredMatches: PropTypes.array.isRequired,
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  team1Id: PropTypes.number.isRequired,
};

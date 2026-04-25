import { Box, Stack, Typography } from '@mui/material';
import { CalendarToday, LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const HEADER_BG = [
  'radial-gradient(ellipse 60% 80% at 25% 50%, rgba(0,122,255,0.04) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 75% 50%, rgba(0,122,255,0.03) 0%, transparent 70%)',
  'linear-gradient(160deg, #ffffff 0%, #f8f8fa 60%, #f5f5f7 100%)',
].join(', ');

function TeamColumn({ team }) {
  return (
    <Stack alignItems="center" sx={{ gap: '12px', flex: 1 }}>
      <Box
        sx={{
          width: 76, height: 76, borderRadius: '50%',
          background: '#f5f5f7',
          border: '2px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      >
        {team?.logo ? (
          <Box component="img" src={team.logo} alt={team.name}
            sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.5px', fontFamily: FONT }}>
            {team?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </Typography>
        )}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.4px', lineHeight: 1.2, fontFamily: FONT }}>
          {team?.name}
        </Typography>
      </Box>
    </Stack>
  );
}

TeamColumn.propTypes = {
  team: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
};

export default function H2HMatchHeader({ teamHome, teamAway, nextMatch, record }) {
  const { t } = useTranslation();

  const badges = record ? [
    { label: t('h2h.wins'), value: record.team1Wins, color: '#28CD41', bgColor: 'rgba(40,205,65,0.08)', borderColor: 'rgba(40,205,65,0.28)' },
    { label: t('h2h.draws'), value: record.draws, color: '#8e8e93', bgColor: '#f2f2f7', borderColor: 'rgba(0,0,0,0.1)' },
    { label: t('h2h.wins'), value: record.team2Wins, color: '#FF9500', bgColor: 'rgba(255,149,0,0.08)', borderColor: 'rgba(255,149,0,0.28)' },
  ] : [];

  return (
    <Box sx={{ background: HEADER_BG, px: { xs: 3, sm: '28px' }, pt: { xs: 3, sm: '28px' }, pb: { xs: 3, sm: '32px' }, position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>

      {/* Teams row */}
      <Stack direction="row" alignItems="center" justifyContent="center">
        <TeamColumn team={teamHome} />

        {/* VS circle + H2H label */}
        <Stack alignItems="center" sx={{ gap: '4px', px: { xs: '16px', sm: '20px' } }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#f0f0f5',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#8e8e93', letterSpacing: '0.5px', fontFamily: FONT }}>
              VS
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 10, color: '#aeaeb2', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, fontFamily: FONT }}>
            H2H
          </Typography>
        </Stack>

        <TeamColumn team={teamAway} />
      </Stack>

      {/* Record summary pills — team names removed; position + accent color convey ownership */}
      {record && (
        <Stack direction="row" justifyContent="center" sx={{ gap: '8px', mt: '20px' }}>
          {badges.map((item, i) => (
            <Box key={i} sx={{
              background: item.bgColor,
              border: `1px solid ${item.borderColor}`,
              borderRadius: '10px',
              px: '16px', py: '8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              minWidth: 72,
            }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                {item.value}
              </Typography>
              <Typography sx={{ fontSize: 10, color: '#8e8e93', fontWeight: 600, letterSpacing: '0.3px', fontFamily: FONT, lineHeight: 1.4, textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      {/* Next match info */}
      {nextMatch && (
        <Box sx={{
          mt: '20px',
          px: { xs: 2, sm: 3 }, py: '12px',
          borderRadius: 2,
          background: '#f0f0f5',
          border: '1px solid rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: '0.62rem', color: '#8e8e93', fontWeight: 700, letterSpacing: 2.5, display: 'block', mb: '6px', textTransform: 'uppercase', fontFamily: FONT }}>
            {t('h2h.nextMatch')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={{ xs: 0.5, sm: 2.5 }} alignItems="center">
            <Stack direction="row" alignItems="center" spacing="6px">
              <CalendarToday sx={{ fontSize: 12, color: '#8e8e93' }} />
              <Typography sx={{ fontSize: 12, color: '#3c3c43', textTransform: 'capitalize', fontFamily: FONT }}>
                {new Date(nextMatch.fixture.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing="6px">
              <LocationOn sx={{ fontSize: 12, color: '#8e8e93' }} />
              <Typography sx={{ fontSize: 12, color: '#3c3c43', fontFamily: FONT }}>
                {nextMatch.fixture.venue.name}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

H2HMatchHeader.propTypes = {
  teamHome: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  nextMatch: PropTypes.object,
  record: PropTypes.shape({ team1Wins: PropTypes.number, draws: PropTypes.number, team2Wins: PropTypes.number }),
};

import { Box, Stack, Typography } from '@mui/material';
import { CalendarToday, LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { keyframes } from '@mui/system';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT']);

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.3; transform: scale(0.7); }
`;

function getLiveLabel({ short, elapsed }) {
  if (short === 'HT') return 'HT';
  if (short === 'BT') return 'BT';
  if (elapsed != null) return `${elapsed}'`;
  return short;
}

// Subtle blue radial glows layered over background.paper via backgroundImage.
// background-color (bgcolor) is theme-aware; backgroundImage just adds the tint.
const HEADER_OVERLAYS = [
  'radial-gradient(ellipse 60% 80% at 25% 50%, rgba(0,122,255,0.05) 0%, transparent 70%)',
  'radial-gradient(ellipse 60% 80% at 75% 50%, rgba(0,122,255,0.04) 0%, transparent 70%)',
].join(', ');

function TeamColumn({ team }) {
  return (
    <Stack alignItems="center" sx={{ gap: '12px', flex: 1 }}>
      <Box
        sx={{
          width: { xs: 60, sm: 76 }, height: { xs: 60, sm: 76 }, borderRadius: '50%',
          bgcolor: 'action.hover',
          border: '2px solid',
          borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          flexShrink: 0,
        }}
      >
        {team?.logo ? (
          <Box component="img" src={team.logo} alt={team.name}
            sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.5px', fontFamily: FONT }}>
            {team?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </Typography>
        )}
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: { xs: 13, sm: 16 }, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.4px', lineHeight: 1.2, fontFamily: FONT }}>
          {team?.name}
        </Typography>
      </Box>
    </Stack>
  );
}

TeamColumn.propTypes = {
  team: PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
};

export default function H2HMatchHeader({ teamHome, teamAway, nextMatch, currentMatch, record }) {
  const { t } = useTranslation();
  const isLive = currentMatch && LIVE_STATUSES.has(currentMatch.fixture.status.short);

  const badges = record ? [
    { label: t('h2h.wins'),  value: record.team1Wins, color: '#28CD41', bgColor: 'rgba(40,205,65,0.08)',   borderColor: 'rgba(40,205,65,0.28)' },
    { label: t('h2h.draws'), value: record.draws,     color: 'text.secondary', bgColor: 'action.selected', borderColor: 'divider' },
    { label: t('h2h.wins'),  value: record.team2Wins, color: '#FF9500', bgColor: 'rgba(255,149,0,0.08)',   borderColor: 'rgba(255,149,0,0.28)' },
  ] : [];

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      backgroundImage: HEADER_OVERLAYS,
      px: { xs: 3, sm: '28px' }, pt: { xs: 3, sm: '28px' }, pb: { xs: 3, sm: '32px' },
      position: 'relative', overflow: 'hidden',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}>

      {/* Teams row */}
      <Stack direction="row" alignItems="center" justifyContent="center">
        <TeamColumn team={teamHome} />

        {/* Center: live score when match is in progress, VS circle otherwise */}
        <Stack alignItems="center" sx={{ gap: '6px', px: { xs: '12px', sm: '20px' } }}>
          {isLive ? (
            <>
              {/* Live score pill */}
              <Box sx={{
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                px: { xs: '12px', sm: '16px' }, py: { xs: '6px', sm: '8px' },
                display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '10px' },
              }}>
                <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                  {currentMatch.goals.home ?? 0}
                </Typography>
                <Typography sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 500, color: 'text.disabled', fontFamily: FONT, lineHeight: 1 }}>
                  –
                </Typography>
                <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: 'text.primary', fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                  {currentMatch.goals.away ?? 0}
                </Typography>
              </Box>
              {/* Pulsing live indicator + elapsed time */}
              <Stack direction="row" alignItems="center" sx={{ gap: '5px' }}>
                <Box sx={{
                  width: 7, height: 7, borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: `${pulse} 1.4s ease-in-out infinite`,
                  flexShrink: 0,
                }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'error.main', fontFamily: FONT, letterSpacing: '0.4px' }}>
                  {getLiveLabel(currentMatch.fixture.status)}
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              {/* Static VS circle */}
              <Box sx={{
                width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: '50%',
                bgcolor: 'action.selected',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 700, color: 'text.secondary', letterSpacing: '0.5px', fontFamily: FONT }}>
                  VS
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, fontFamily: FONT }}>
                H2H
              </Typography>
            </>
          )}
        </Stack>

        <TeamColumn team={teamAway} />
      </Stack>

      {/* Record summary pills */}
      {record && (
        <Stack direction="row" justifyContent="center" sx={{ gap: '8px', mt: '20px' }}>
          {badges.map((item, i) => (
            <Box key={i} sx={{
              bgcolor: item.bgColor,
              border: '1px solid',
              borderColor: item.borderColor,
              borderRadius: '10px',
              px: { xs: '10px', sm: '16px' }, py: { xs: '6px', sm: '8px' },
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              minWidth: { xs: 58, sm: 72 },
            }}>
              <Typography sx={{ fontSize: { xs: 17, sm: 20 }, fontWeight: 700, color: item.color, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                {item.value}
              </Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 600, letterSpacing: '0.3px', fontFamily: FONT, lineHeight: 1.4, textTransform: 'uppercase' }}>
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
          bgcolor: 'action.selected',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, letterSpacing: 2.5, display: 'block', mb: '6px', textTransform: 'uppercase', fontFamily: FONT }}>
            {t('h2h.nextMatch')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={{ xs: 0.5, sm: 2.5 }} alignItems="center">
            <Stack direction="row" alignItems="center" spacing="6px">
              <CalendarToday sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 12, color: 'text.primary', textTransform: 'capitalize', fontFamily: FONT }}>
                {new Date(nextMatch.fixture.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing="6px">
              <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
              <Typography sx={{ fontSize: 12, color: 'text.primary', fontFamily: FONT }}>
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
  currentMatch: PropTypes.object,
  record: PropTypes.shape({ team1Wins: PropTypes.number, draws: PropTypes.number, team2Wins: PropTypes.number }),
};

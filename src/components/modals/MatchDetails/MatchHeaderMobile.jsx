import { Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif';
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT']);

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.3; transform: scale(0.7); }
`;

const formatTime = ({ elapsed, extra }) => {
  if (elapsed == null) return '';
  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
};

const abbreviateName = (name) => {
  const parts = name.trim().split(' ');
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
};

function getStatusLabel({ short, elapsed, extra }) {
  if (short === 'HT') return 'HT';
  if (short === 'BT') return 'BT';
  if (short === 'FT')  return 'FULL TIME';
  if (short === 'AET') return 'AFTER ET';
  if (short === 'PEN') return 'PENALTIES';
  if (LIVE_STATUSES.has(short) && elapsed != null) {
    return extra > 0 ? `${elapsed}+${extra}'` : `${elapsed}'`;
  }
  return short;
}

export default function MatchHeaderMobile({ teamHome, teamAway, nextMatch, currentMatch }) {
  const { i18n } = useTranslation();

  const status   = currentMatch?.fixture?.status;
  const isLive   = currentMatch && LIVE_STATUSES.has(status.short);
  const hasScore = currentMatch && !['NS', 'TBD'].includes(status.short);

  const venueId    = (currentMatch ?? nextMatch)?.fixture?.venue?.id ?? null;
  const stadiumSrc = venueId
    ? `https://media.api-sports.io/football/venues/${venueId}.png`
    : '/generic-stadium.jpg';

  const textPrimary   = 'rgba(255,255,255,0.95)';
  const textSecondary = 'rgba(255,255,255,0.60)';
  const textDisabled  = 'rgba(255,255,255,0.35)';
  const dividerColor  = 'rgba(255,255,255,0.18)';
  const surfaceBg     = 'rgba(255,255,255,0.10)';

  const events     = currentMatch?.events ?? [];
  const isRelevant = e => (e.type === 'Goal' && e.detail !== 'Missed Penalty') || (e.type === 'Card' && e.detail === 'Red Card');
  const homeEvents = hasScore ? events.filter(e => e.team.id === currentMatch.teams.home.id && isRelevant(e)) : [];
  const awayEvents = hasScore ? events.filter(e => e.team.id === currentMatch.teams.away.id && isRelevant(e)) : [];

  const kickoffDate = (status?.short === 'NS' ? currentMatch : nextMatch)?.fixture?.date;

  const leagueName  = currentMatch?.league?.name;
  const venueName   = currentMatch?.fixture?.venue?.name;
  const contextParts = [leagueName, venueName].filter(Boolean);

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden', bgcolor: 'background.paper',
      px: '12px', pt: '14px', pb: '16px',
      borderBottom: '1px solid', borderColor: 'divider',
    }}>

      {/* Layer 1: blurred stadium image */}
      <Box
        component="img" src={stadiumSrc} alt=""
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/generic-stadium.jpg'; }}
        sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 60%',
          filter: 'blur(5px)', transform: 'scale(1.08)', zIndex: 0,
        }}
      />

      {/* Layer 2: gradient overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: [
          'linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.68) 55%, rgba(10,12,18,0.78) 100%)',
          'radial-gradient(ellipse at center, transparent 30%, rgba(10,12,18,0.40) 100%)',
        ].join(', '),
      }} />

      {/* Layer 3: content */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>

        {/* Meta info line */}
        {contextParts.length > 0 && (
          <Typography sx={{
            fontSize: 9, color: textSecondary, fontFamily: FONT,
            letterSpacing: '0.5px', textAlign: 'center',
            mb: '10px', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {contextParts.join(' · ')}
          </Typography>
        )}

        {/* Zone 1: Logo + Score + Logo */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>

          {/* Home team */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <Box sx={{
              width: 72 , height: 72, borderRadius: '50%',
              bgcolor: surfaceBg,
              border: '2px solid', borderColor: dividerColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {teamHome?.logo
                ? <Box component="img" src={teamHome.logo} alt={teamHome.name} sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                : <Typography sx={{ fontSize: 12, fontWeight: 700, color: textPrimary, fontFamily: FONT }}>
                    {teamHome?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
                  </Typography>
              }
            </Box>
            <Typography sx={{
              fontSize: 12, fontWeight: 700, color: textPrimary, fontFamily: FONT,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%', textAlign: 'center', lineHeight: 1.2, px: '2px',
            }}>
              {teamHome?.name}
            </Typography>
          </Box>

          {/* Score */}
          <Stack alignItems="center" sx={{ gap: '4px', flexShrink: 0 }}>
            {hasScore ? (
              <>
                <Box sx={{
                  bgcolor: surfaceBg, border: '1px solid', borderColor: dividerColor,
                  borderRadius: '10px', px: '10px', py: '5px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Typography sx={{ fontSize: 28, fontWeight: 600, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                    {currentMatch.goals.home ?? 0}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 400, color: textDisabled, fontFamily: FONT, lineHeight: 1 }}>–</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 600, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                    {currentMatch.goals.away ?? 0}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" sx={{ gap: '4px' }}>
                  {isLive && status.short !== 'HT' && status.short !== 'BT' && (
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', animation: `${pulse} 1.4s ease-in-out infinite`, flexShrink: 0 }} />
                  )}
                  <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4px', fontFamily: FONT, color: isLive ? 'error.main' : textSecondary }}>
                    {getStatusLabel(status)}
                  </Typography>
                </Stack>
              </>
            ) : (
              <>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  bgcolor: surfaceBg, border: '1px solid', borderColor: dividerColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: textSecondary, fontFamily: FONT }}>VS</Typography>
                </Box>
                {kickoffDate && (
                  <Typography sx={{ fontSize: 10, color: textSecondary, fontFamily: FONT, textAlign: 'center', letterSpacing: '-0.2px' }}>
                    {new Date(kickoffDate).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(kickoffDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                )}
              </>
            )}
          </Stack>

          {/* Away team */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: surfaceBg,
              border: '2px solid', borderColor: dividerColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {teamAway?.logo
                ? <Box component="img" src={teamAway.logo} alt={teamAway.name} sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                : <Typography sx={{ fontSize: 12, fontWeight: 700, color: textPrimary, fontFamily: FONT }}>
                    {teamAway?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
                  </Typography>
              }
            </Box>
            <Typography sx={{
              fontSize: 12, fontWeight: 700, color: textPrimary, fontFamily: FONT,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              maxWidth: '100%', textAlign: 'center', lineHeight: 1.2, px: '2px',
            }}>
              {teamAway?.name}
            </Typography>
          </Box>
        </Box>

        {/* Zone 2: Goal scorers */}
        {hasScore && (homeEvents.length > 0 || awayEvents.length > 0) && (
          <Box sx={{ mt: '10px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '10px', alignItems: 'start' }}>

            {/* Home events — right-aligned */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
              {homeEvents.map((event, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '3px', flexDirection: 'row-reverse' }}>
                  {event.type === 'Goal' && <Typography component="span" sx={{ fontSize: 10, lineHeight: 1 }}>⚽</Typography>}
                  {event.type === 'Card' && <Box component="span" sx={{ display: 'inline-block', width: 6, height: 9, bgcolor: 'error.main', borderRadius: '1px', flexShrink: 0 }} />}
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.4, fontFamily: FONT }}>
                    {abbreviateName(event.player.name)} {formatTime(event.time)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Vertical divider */}
            <Box sx={{
              width: '1px', alignSelf: 'stretch', bgcolor: dividerColor,
              visibility: (homeEvents.length > 0 && awayEvents.length > 0) ? 'visible' : 'hidden',
            }} />

            {/* Away events — left-aligned */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
              {awayEvents.map((event, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {event.type === 'Goal' && <Typography component="span" sx={{ fontSize: 10, lineHeight: 1 }}>⚽</Typography>}
                  {event.type === 'Card' && <Box component="span" sx={{ display: 'inline-block', width: 6, height: 9, bgcolor: 'error.main', borderRadius: '1px', flexShrink: 0 }} />}
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.4, fontFamily: FONT }}>
                    {abbreviateName(event.player.name)} {formatTime(event.time)}
                  </Typography>
                </Box>
              ))}
            </Box>

          </Box>
        )}
      </Box>
    </Box>
  );
}

MatchHeaderMobile.propTypes = {
  teamHome:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  nextMatch:    PropTypes.object,
  currentMatch: PropTypes.object,
};

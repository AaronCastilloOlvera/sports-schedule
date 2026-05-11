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

function TeamColumn({ team, textPrimary, dividerColor }) {
  return (
    <Stack alignItems="center" sx={{ gap: '4px', flex: 1, minWidth: { xs: 72, sm: 90 }, maxWidth: 140 }}>
      <Box sx={{
        width: { xs: 62, sm: 84 },
        height: { xs: 62, sm: 84 }, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.10)',
        border: '2px solid', borderColor: dividerColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', flexShrink: 0,
      }}>
        {team?.logo ? (
          <Box component="img" src={team.logo} alt={team.name}
            sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: textPrimary, letterSpacing: '-0.5px', fontFamily: FONT }}>
            {team?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </Typography>
        )}
      </Box>
      <Typography sx={{
        fontSize: { xs: 13, sm: 15 }, fontWeight: 700, color: textPrimary,
        letterSpacing: '-0.4px', lineHeight: 1.2, fontFamily: FONT,
        textAlign: 'center', width: '100%', px: '4px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {team?.name}
      </Typography>
    </Stack>
  );
}

TeamColumn.propTypes = {
  team:         PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  textPrimary:  PropTypes.string,
  dividerColor: PropTypes.string,
};

function EventRow({ event, isRight, textPrimary, textDisabled }) {
  const isGoal    = event.type === 'Goal' && event.detail !== 'Missed Penalty';
  const isRedCard = event.type === 'Card'  && event.detail === 'Red Card';
  if (!isGoal && !isRedCard) return null;

  const isPenalty = isGoal && event.detail === 'Penalty';
  const isOwnGoal = isGoal && event.detail === 'Own Goal';

  const time = event.time.extra
    ? `${event.time.elapsed}+${event.time.extra}'`
    : `${event.time.elapsed}'`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', flexDirection: isRight ? 'row-reverse' : 'row' }}>
      {isGoal    && <Typography component="span" sx={{ fontSize: 11, lineHeight: 1 }}>⚽</Typography>}
      {isRedCard && (
        <Box component="span" sx={{ display: 'inline-block', width: 7, height: 10, bgcolor: 'error.main', borderRadius: '1.5px', flexShrink: 0 }} />
      )}
      <Typography sx={{ fontSize: 10, color: textPrimary, fontFamily: FONT, lineHeight: 1.3 }}>
        {event.player.name}
        {isPenalty && <Typography component="span" sx={{ fontSize: 9, color: textDisabled, fontFamily: FONT }}>{' (P)'}</Typography>}
        {isOwnGoal && <Typography component="span" sx={{ fontSize: 9, color: textDisabled, fontFamily: FONT }}>{' (OG)'}</Typography>}
      </Typography>
      <Typography sx={{ fontSize: 9, color: textDisabled, fontFamily: FONT, lineHeight: 1.3, flexShrink: 0 }}>
        {time}
      </Typography>
    </Box>
  );
}

EventRow.propTypes = {
  event:        PropTypes.object.isRequired,
  isRight:      PropTypes.bool,
  textPrimary:  PropTypes.string.isRequired,
  textDisabled: PropTypes.string.isRequired,
};

export default function MatchHeader({ teamHome, teamAway, nextMatch, currentMatch }) {
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

  const leagueName = currentMatch?.league?.name;
  const leagueRound = currentMatch?.league?.round;
  const venueName = currentMatch?.fixture?.venue?.name;
  const contextParts = [leagueName, leagueRound, venueName].filter(Boolean);

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden', bgcolor: 'background.paper',
      px: { xs: 2, sm: '20px' }, pt: { xs: '14px', sm: '18px' }, pb: { xs: '18px', sm: '24px' },
      borderBottom: '1px solid', borderColor: 'divider',
    }}>

      {/* ── Layer 1: blurred stadium image ── */}
      <Box
        component="img" src={stadiumSrc} alt=""
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/generic-stadium.jpg'; }}
        sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 60%',
          filter: 'blur(5px)', transform: 'scale(1.08)', zIndex: 0,
        }}
      />

      {/* ── Layer 2: gradient + radial vignette ── */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: [
          'linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.68) 55%, rgba(10,12,18,0.78) 100%)',
          'radial-gradient(ellipse at center, transparent 30%, rgba(10,12,18,0.40) 100%)',
        ].join(', '),
      }} />

      {/* ── Layer 3: content ── */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>

        {/* League + venue context */}
        {contextParts.length > 0 && (
          <Typography sx={{
            fontSize: 11, color: textSecondary, fontFamily: FONT,
            letterSpacing: '0.2px', textAlign: 'center',
            mb: '10px', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {contextParts.join(' · ')}
          </Typography>
        )}

        <Stack direction="row" alignItems="flex-start" justifyContent="center">
          <TeamColumn team={teamHome} textPrimary={textPrimary} dividerColor={dividerColor} />

          {/* ── Center: score flanked by events, or VS ── */}
          <Stack alignItems="center" sx={{ gap: '6px', flex: 2, px: { xs: '6px', sm: '12px' }, flexShrink: 0, minWidth: 0 }}>
            {hasScore ? (
              <>
                {/* Score row with events flanking */}
                <Stack direction="row" alignItems="flex-start" sx={{ width: '100%', gap: 0 }}>

                  {/* Home events — right-aligned, flanking score left */}
                  <Box sx={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', gap: '4px',
                    pt: '9px', pr: '6px', minWidth: 0,
                  }}>
                    {homeEvents.map((event, i) => (
                      <EventRow key={i} event={event} isRight={true} textPrimary={textPrimary} textDisabled={textDisabled} />
                    ))}
                  </Box>

                  {/* Score box */}
                  <Stack alignItems="center" sx={{ gap: '5px', flexShrink: 0 }}>
                    <Box sx={{
                      bgcolor: surfaceBg, border: '1px solid', borderColor: dividerColor,
                      borderRadius: '12px',
                      px: '16px', py: '7px',
                      display: 'flex', alignItems: 'center', gap: { xs: '10px', sm: '14px' },
                    }}>
                      <Typography sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 600, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                        {currentMatch.goals.home ?? 0}
                      </Typography>
                      <Typography sx={{ fontSize: { xs: 16, sm: 19 }, fontWeight: 400, color: textDisabled, fontFamily: FONT, lineHeight: 1 }}>–</Typography>
                      <Typography sx={{ fontSize: { xs: 28, sm: 36 }, fontWeight: 600, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                        {currentMatch.goals.away ?? 0}
                      </Typography>
                    </Box>

                    {/* Penalty shootout result */}
                    {status?.short === 'PEN' && currentMatch?.score?.penalty?.home != null && (
                      <Typography sx={{ fontSize: 11, color: textSecondary, fontFamily: FONT, letterSpacing: '-0.2px' }}>
                        ({currentMatch.score.penalty.home} – {currentMatch.score.penalty.away} pen.)
                      </Typography>
                    )}

                    {/* Live minute / HT / FT */}
                    <Stack direction="row" alignItems="center" sx={{ gap: '5px' }}>
                      {isLive && status.short !== 'HT' && status.short !== 'BT' && (
                        <Box sx={{
                          width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main',
                          animation: `${pulse} 1.4s ease-in-out infinite`, flexShrink: 0,
                        }} />
                      )}
                      <Typography sx={{
                        fontSize: 11, fontWeight: 700,
                        color: isLive ? 'error.main' : textSecondary,
                        fontFamily: FONT, letterSpacing: '0.4px',
                      }}>
                        {getStatusLabel(status)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Away events — left-aligned, flanking score right */}
                  <Box sx={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', gap: '4px',
                    pt: '9px', pl: '6px', minWidth: 0,
                  }}>
                    {awayEvents.map((event, i) => (
                      <EventRow key={i} event={event} isRight={false} textPrimary={textPrimary} textDisabled={textDisabled} />
                    ))}
                  </Box>

                </Stack>
              </>
            ) : (
              <>
                <Box sx={{
                  width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: '50%',
                  bgcolor: surfaceBg, border: '1px solid', borderColor: dividerColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 700, color: textSecondary, letterSpacing: '0.5px', fontFamily: FONT }}>
                    VS
                  </Typography>
                </Box>

                {/* Kickoff date + time */}
                {kickoffDate && (
                  <Typography sx={{ fontSize: 12, color: textSecondary, fontFamily: FONT, letterSpacing: '-0.2px', textAlign: 'center' }}>
                    {new Date(kickoffDate).toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(kickoffDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                )}
              </>
            )}
          </Stack>

          <TeamColumn team={teamAway} textPrimary={textPrimary} dividerColor={dividerColor} />
        </Stack>

      </Box>
    </Box>
  );
}

MatchHeader.propTypes = {
  teamHome:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  nextMatch:    PropTypes.object,
  currentMatch: PropTypes.object,
};

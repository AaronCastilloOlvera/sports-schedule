import { Avatar, Box, Stack, Tooltip, Typography } from '@mui/material';
import { green, red, grey } from '@mui/material/colors';
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

function getLiveLabel({ short, elapsed, extra }) {
  if (short === 'HT') return 'HT';
  if (short === 'BT') return 'BT';
  if (elapsed != null) return extra > 0 ? `${elapsed} + ${extra}'` : `${elapsed}'`;
  return short;
}

const FORM_STYLES = {
  W: { bg: green[50],  border: green[600], color: green[600] },
  D: { bg: grey[100],  border: grey[500],  color: grey[500]  },
  L: { bg: red[50],    border: red[600],   color: red[600]   },
};

function FormGuide({ form, isLoading }) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: '6px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Tooltip key={i} title={t('loading')} placement="top" arrow>
            <Avatar variant="rounded" sx={{ width: 24, height: 24, bgcolor: grey[100], border: `2px solid ${grey[300]}`, color: grey[400], fontSize: '0.75rem', fontWeight: 'bold', fontFamily: FONT }} />
          </Tooltip>
        ))}
      </Stack>
    );
  }

  if (!form?.length) return null;

  return (
    <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: '6px' }}>
      {form.map((item, i) => {
        const style   = FORM_STYLES[item.result] ?? FORM_STYLES.D;
        const tooltip = item.opponent ?? t('loading');
        return (
          <Tooltip key={i} title={tooltip} placement="top" arrow>
            <Avatar
              variant="rounded"
              sx={{
                width: 24, height: 24,
                bgcolor: style.bg,
                border: `2px solid ${style.border}`,
                color: style.color,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                fontFamily: FONT,
                cursor: 'default',
              }}
            >
              {item.result}
            </Avatar>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

FormGuide.propTypes = { form: PropTypes.array, isLoading: PropTypes.bool };

function TeamColumn({ team, form, isLoadingForm, textPrimary, dividerColor }) {
  return (
    <Stack alignItems="center" sx={{ gap: '12px', flex: 1 }}>
      <Box
        sx={{
          width: { xs: 60, sm: 76 }, height: { xs: 60, sm: 76 }, borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.10)',
          border: '2px solid',
          borderColor: dividerColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      >
        {team?.logo ? (
          <Box component="img" src={team.logo} alt={team.name}
            sx={{ width: '72%', height: '72%', objectFit: 'contain' }} />
        ) : (
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: textPrimary, letterSpacing: '-0.5px', fontFamily: FONT }}>
            {team?.name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
          </Typography>
        )}
      </Box>
      <Box sx={{ textAlign: 'center', minWidth: 0, px: '4px' }}>
        <Typography sx={{
          fontSize: { xs: 13, sm: 16 }, fontWeight: 700, color: textPrimary,
          letterSpacing: '-0.4px', lineHeight: 1.2, fontFamily: FONT,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team?.name}
        </Typography>
        <FormGuide form={form} isLoading={isLoadingForm} />
      </Box>
    </Stack>
  );
}

TeamColumn.propTypes = {
  team:          PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  form:          PropTypes.array,
  isLoadingForm: PropTypes.bool,
  textPrimary:   PropTypes.string,
  dividerColor:  PropTypes.string,
};

function EventRow({ event, isRight, textPrimary, textDisabled }) {
  const isGoal    = event.type === 'Goal' && event.detail !== 'Missed Penalty';
  const isRedCard = event.type === 'Card' && event.detail === 'Red Card';
  if (!isGoal && !isRedCard) return null;

  const time = event.time.extra
    ? `${event.time.elapsed}+${event.time.extra}'`
    : `${event.time.elapsed}'`;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexDirection: isRight ? 'row-reverse' : 'row' }}>
      {isGoal    && <Typography component="span" sx={{ fontSize: 12, lineHeight: 1 }}>⚽</Typography>}
      {isRedCard && (
        <Box component="span" sx={{ display: 'inline-block', width: 8, height: 11, bgcolor: 'error.main', borderRadius: '1.5px', flexShrink: 0 }} />
      )}
      <Typography sx={{ fontSize: 11, color: textPrimary,  fontFamily: FONT, lineHeight: 1.3 }}>
        {event.player.name}
      </Typography>
      <Typography sx={{ fontSize: 10, color: textDisabled, fontFamily: FONT, lineHeight: 1.3, flexShrink: 0 }}>
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

export default function MatchHeader({ teamHome, teamAway, nextMatch, currentMatch, headerRecord, homeForm, awayForm, isLoadingForm }) {
  const { t } = useTranslation();
  const isLive = currentMatch && LIVE_STATUSES.has(currentMatch.fixture.status.short);
  const showNextMatch = nextMatch && (!currentMatch || currentMatch.fixture.status.short === 'NS');

  // Prefer the current fixture's venue; fall back to the next match's venue.
  const venueId    = (currentMatch ?? nextMatch)?.fixture?.venue?.id ?? null;
  const stadiumSrc = venueId
    ? `https://media.api-sports.io/football/venues/${venueId}.png`
    : '/generic-stadium.jpg';

  // A background image is always present (real venue or local fallback), so colour
  // tokens are fixed to the on-image (light-on-dark) variants.
  const textPrimary   = 'rgba(255,255,255,0.95)';
  const textSecondary = 'rgba(255,255,255,0.60)';
  const textDisabled  = 'rgba(255,255,255,0.35)';
  const dividerColor  = 'rgba(255,255,255,0.18)';
  const surfaceBg     = 'rgba(255,255,255,0.10)';

  const events     = currentMatch?.events ?? [];
  const isRelevant = e => e.type === 'Goal' || (e.type === 'Card' && e.detail === 'Red Card');
  const homeEvents = currentMatch ? events.filter(e => e.team.id === currentMatch.teams.home.id && isRelevant(e)) : [];
  const awayEvents = currentMatch ? events.filter(e => e.team.id === currentMatch.teams.away.id && isRelevant(e)) : [];
  const hasEvents  = homeEvents.length > 0 || awayEvents.length > 0;

  const isRecentMode = headerRecord?.mode === 'recent';
  const badges = headerRecord ? [
    { label: t('h2h.wins'),                                  value: headerRecord.stat1, color: '#28CD41',   bgColor: 'rgba(40,205,65,0.12)', borderColor: 'rgba(40,205,65,0.32)'  },
    { label: t('h2h.draws'),                                 value: headerRecord.stat2, color: textSecondary, bgColor: surfaceBg,                 borderColor: dividerColor            },
    { label: isRecentMode ? t('h2h.losses') : t('h2h.wins'), value: headerRecord.stat3, color: '#FF3B30',   bgColor: 'rgba(255,59,48,0.12)', borderColor: 'rgba(255,59,48,0.32)' },
  ] : [];

  return (
    <Box sx={{
      position: 'relative',
      overflow: 'hidden',
      bgcolor: 'background.paper',
      px: { xs: 3, sm: '28px' }, pt: { xs: 3, sm: '28px' }, pb: { xs: 3, sm: '32px' },
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}>

      {/* ── Layer 1: blurred stadium image ── */}
      <Box
        component="img"
        src={stadiumSrc}
        alt=""
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/generic-stadium.jpg'; }}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          filter: 'blur(3px)',
          transform: 'scale(1.05)',
          zIndex: 0,
        }}
      />

      {/* ── Layer 2: dark overlay ── */}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.62)', zIndex: 1 }} />

      {/* ── Layer 3: content ── */}
      <Box sx={{ position: 'relative', zIndex: 2 }}>

        {/* Teams row */}
        <Stack direction="row" alignItems="center" justifyContent="center">
          <TeamColumn team={teamHome} form={homeForm} isLoadingForm={isLoadingForm} textPrimary={textPrimary} dividerColor={dividerColor} />

          {/* Center: live score or VS */}
          <Stack alignItems="center" sx={{ gap: '6px', px: { xs: '12px', sm: '20px' } }}>
            {isLive ? (
              <>
                <Box sx={{
                  bgcolor: surfaceBg,
                  border: '1px solid',
                  borderColor: dividerColor,
                  borderRadius: '12px',
                  px: { xs: '12px', sm: '16px' }, py: { xs: '6px', sm: '8px' },
                  display: 'flex', alignItems: 'center', gap: { xs: '8px', sm: '10px' },
                }}>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                    {currentMatch.goals.home ?? 0}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 13, sm: 15 }, fontWeight: 500, color: textDisabled, fontFamily: FONT, lineHeight: 1 }}>
                    –
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 700, color: textPrimary, fontVariantNumeric: 'tabular-nums', fontFamily: FONT, lineHeight: 1 }}>
                    {currentMatch.goals.away ?? 0}
                  </Typography>
                </Box>
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
                <Box sx={{
                  width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: '50%',
                  bgcolor: surfaceBg,
                  border: '1px solid',
                  borderColor: dividerColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Typography sx={{ fontSize: { xs: 11, sm: 13 }, fontWeight: 700, color: textSecondary, letterSpacing: '0.5px', fontFamily: FONT }}>
                    VS
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 10, color: textDisabled, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, fontFamily: FONT }}>
                  H2H
                </Typography>
              </>
            )}
          </Stack>

          <TeamColumn team={teamAway} form={awayForm} isLoadingForm={isLoadingForm} textPrimary={textPrimary} dividerColor={dividerColor} />
        </Stack>

        {/* ── Match events ── */}
        {hasEvents && (
          <Box sx={{ display: 'flex', mt: '16px', gap: '12px' }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
              {homeEvents.map((event, i) => (
                <EventRow key={i} event={event} isRight={false} textPrimary={textPrimary} textDisabled={textDisabled} />
              ))}
            </Box>
            <Box sx={{ width: '0.5px', bgcolor: dividerColor, flexShrink: 0 }} />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
              {awayEvents.map((event, i) => (
                <EventRow key={i} event={event} isRight={true} textPrimary={textPrimary} textDisabled={textDisabled} />
              ))}
            </Box>
          </Box>
        )}

        {/* Record summary pills */}
        {headerRecord && (
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
                <Typography sx={{ fontSize: 10, color: textSecondary, fontWeight: 600, letterSpacing: '0.3px', fontFamily: FONT, lineHeight: 1.4, textTransform: 'uppercase' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}

        {/* Next match info */}
        {showNextMatch && (
          <Box sx={{
            mt: '20px',
            px: { xs: 2, sm: 3 }, py: '12px',
            borderRadius: 2,
            bgcolor: surfaceBg,
            border: '1px solid',
            borderColor: dividerColor,
            textAlign: 'center',
          }}>
            <Typography sx={{ fontSize: '0.62rem', color: textSecondary, fontWeight: 700, letterSpacing: 2.5, display: 'block', mb: '6px', textTransform: 'uppercase', fontFamily: FONT }}>
              {t('h2h.nextMatch')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" spacing={{ xs: 0.5, sm: 2.5 }} alignItems="center">
              <Stack direction="row" alignItems="center" spacing="6px">
                <CalendarToday sx={{ fontSize: 12, color: textSecondary }} />
                <Typography sx={{ fontSize: 12, color: textPrimary, textTransform: 'capitalize', fontFamily: FONT }}>
                  {new Date(nextMatch.fixture.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing="6px">
                <LocationOn sx={{ fontSize: 12, color: textSecondary }} />
                <Typography sx={{ fontSize: 12, color: textPrimary, fontFamily: FONT }}>
                  {nextMatch.fixture.venue.name}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}

      </Box>
    </Box>
  );
}

MatchHeader.propTypes = {
  teamHome:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway:     PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  nextMatch:    PropTypes.object,
  currentMatch: PropTypes.object,
  headerRecord: PropTypes.shape({ stat1: PropTypes.number, stat2: PropTypes.number, stat3: PropTypes.number, mode: PropTypes.string }),
  homeForm:      PropTypes.array,
  awayForm:      PropTypes.array,
  isLoadingForm: PropTypes.bool,
};

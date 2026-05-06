import { Box, Card, CardContent, Divider, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import LiveStatusChip from './LiveStatusChip';

// ── helpers ───────────────────────────────────────────────────────────────────

function SoccerCardIcon({ bgcolor }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 9,
        height: 12,
        bgcolor,
        borderRadius: '1.5px',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
}

SoccerCardIcon.propTypes = { bgcolor: PropTypes.string.isRequired };

function formatTime({ elapsed, extra }) {
  if (elapsed == null) return '';
  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
}

const isGoal    = e => e.type === 'Goal' && e.detail !== 'Missed Penalty';
const isRedCard = e => e.type === 'Card' && e.detail === 'Red Card';

// ── EventList ─────────────────────────────────────────────────────────────────
// Renders the relevant events (goals + red cards) for one team side.
// `align="right"` mirrors the layout so away events read right-to-left.

function EventList({ events, align }) {
  const relevant = events.filter(e => isGoal(e) || isRedCard(e));
  if (!relevant.length) return <Box sx={{ flex: 1 }} />;

  const isRight = align === 'right';

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isRight ? 'flex-end' : 'flex-start',
        gap: 0.5,
      }}
    >
      {relevant.map((event, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexDirection: isRight ? 'row-reverse' : 'row',
          }}
        >
          {isGoal(event) && (
            <Typography component="span" sx={{ fontSize: 11, lineHeight: 1 }}>
              ⚽
            </Typography>
          )}
          {isRedCard(event) && <SoccerCardIcon bgcolor="error.main" />}

          <Typography variant="caption" sx={{ lineHeight: 1.3 }}>
            {event.player.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ lineHeight: 1.3, flexShrink: 0 }}
          >
            {formatTime(event.time)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

EventList.propTypes = {
  events: PropTypes.array.isRequired,
  align: PropTypes.oneOf(['left', 'right']).isRequired,
};

// ── LiveMatchCard ─────────────────────────────────────────────────────────────

export default function LiveMatchCard({ match }) {
  const { fixture, league, teams, goals, events = [] } = match;

  const homeEvents        = events.filter(e => e.team.id === teams.home.id);
  const awayEvents        = events.filter(e => e.team.id === teams.away.id);
  const hasRelevantEvents = events.some(e => isGoal(e) || isRedCard(e));
  const scoreStarted      = fixture.status.elapsed !== null;

  return (
    <Card elevation={2} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ pb: '16px !important' }}>

        {/* ── Header: league + match time ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {league.logo && (
              <Box
                component="img"
                src={league.logo}
                alt={league.name}
                sx={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <Typography variant="caption" color="text.secondary" noWrap>
              {league.name}
            </Typography>
          </Box>
          <LiveStatusChip fixture={fixture} />
        </Box>

        {/* ── Scoreboard ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Home team */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Box
              component="img"
              src={teams.home.logo}
              alt={teams.home.name}
              sx={{ width: 48, height: 48, objectFit: 'contain', mb: 0.5 }}
            />
            <Typography variant="body2" fontWeight="bold" textAlign="center" lineHeight={1.2}>
              {teams.home.name}
            </Typography>
          </Box>

          {/* Score / VS */}
          <Box sx={{ px: 2, flexShrink: 0 }}>
            {scoreStarted ? (
              <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" lineHeight={1}>
                  {goals.home ?? 0} – {goals.away ?? 0}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h6" fontWeight="bold" color="text.secondary">
                VS
              </Typography>
            )}
          </Box>

          {/* Away team */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Box
              component="img"
              src={teams.away.logo}
              alt={teams.away.name}
              sx={{ width: 48, height: 48, objectFit: 'contain', mb: 0.5 }}
            />
            <Typography variant="body2" fontWeight="bold" textAlign="center" lineHeight={1.2}>
              {teams.away.name}
            </Typography>
          </Box>
        </Box>

        {/* ── Match events ── */}
        {hasRelevantEvents && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <EventList events={homeEvents} align="left" />
              <EventList events={awayEvents} align="right" />
            </Box>
          </>
        )}

      </CardContent>
    </Card>
  );
}

LiveMatchCard.propTypes = {
  match: PropTypes.shape({
    fixture: PropTypes.shape({
      status: PropTypes.shape({
        elapsed: PropTypes.number,
        extra: PropTypes.number,
        short: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    league: PropTypes.shape({
      logo: PropTypes.string,
      name: PropTypes.string.isRequired,
    }).isRequired,
    teams: PropTypes.shape({
      home: PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired, logo: PropTypes.string.isRequired }).isRequired,
      away: PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired, logo: PropTypes.string.isRequired }).isRequired,
    }).isRequired,
    goals: PropTypes.shape({ home: PropTypes.number, away: PropTypes.number }).isRequired,
    events: PropTypes.arrayOf(PropTypes.shape({
      time:   PropTypes.shape({ elapsed: PropTypes.number, extra: PropTypes.number }).isRequired,
      team:   PropTypes.shape({ id: PropTypes.number.isRequired }).isRequired,
      player: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
      type:   PropTypes.string.isRequired,
      detail: PropTypes.string.isRequired,
    })),
  }).isRequired,
};

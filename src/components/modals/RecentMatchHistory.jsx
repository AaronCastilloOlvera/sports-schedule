import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';

// Desktop: date | result | opponent | score | league | chevron
// Mobile:  date | result | opponent | score | chevron
const GRID_COLS        = '90px 36px minmax(0, 1fr) 72px 116px 24px';
const GRID_COLS_MOBILE = '72px 36px minmax(0, 1fr) 60px 24px';

const RESULT_STYLE = {
  W: { label: 'W', color: '#28CD41', bg: 'rgba(40,205,65,0.10)',  border: 'rgba(40,205,65,0.28)' },
  D: { label: 'D', color: '#8E8E93', bg: 'rgba(142,142,147,0.10)', border: 'rgba(142,142,147,0.28)' },
  L: { label: 'L', color: '#FF3B30', bg: 'rgba(255,59,48,0.10)',  border: 'rgba(255,59,48,0.28)' },
};

// Key stat types to display in the expandable section (from the football API).
const KEY_STATS = ['Ball Possession', 'Total Shots', 'Shots on Goal', 'Corner Kicks', 'Fouls'];

function getResult(match, teamId) {
  const isHome = match.teams.home.id === teamId;
  if (!match.teams.home.winner && !match.teams.away.winner) return 'D';
  return (isHome ? match.teams.home.winner : match.teams.away.winner) ? 'W' : 'L';
}

function MiniLogo({ logo, name }) {
  return (
    <Box sx={{
      width: 22, height: 22, borderRadius: '50%',
      bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {logo ? (
        <Box component="img" src={logo} alt={name} sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      ) : (
        <Typography sx={{ fontSize: 8, fontWeight: 700, color: 'text.disabled', fontFamily: FONT }}>
          {name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
        </Typography>
      )}
    </Box>
  );
}

MiniLogo.propTypes = { logo: PropTypes.string, name: PropTypes.string };

function ResultPill({ result }) {
  const style = RESULT_STYLE[result] ?? RESULT_STYLE.D;
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '6px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: style.bg, border: '1px solid', borderColor: style.border,
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: style.color, fontFamily: FONT, lineHeight: 1 }}>
        {style.label}
      </Typography>
    </Box>
  );
}

ResultPill.propTypes = { result: PropTypes.string };

function ScoreBadge({ homeScore, awayScore, homeWon, awayWon }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      bgcolor: 'action.selected', border: '1px solid', borderColor: 'divider',
      borderRadius: '10px', px: '8px', py: '4px',
      minWidth: { xs: 48, sm: 58 }, justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: homeWon ? '#28CD41' : awayWon ? '#FF3B30' : 'text.secondary' }}>
        {homeScore ?? '—'}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500, mx: '2px', lineHeight: 1, fontFamily: FONT }}>–</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: awayWon ? '#28CD41' : homeWon ? '#FF3B30' : 'text.secondary' }}>
        {awayScore ?? '—'}
      </Typography>
    </Box>
  );
}

ScoreBadge.propTypes = {
  homeScore: PropTypes.number, awayScore: PropTypes.number,
  homeWon: PropTypes.bool,     awayWon: PropTypes.bool,
};

// Renders a single stat row: homeValue — label — awayValue + optional split bar.
function StatRow({ type, homeValue, awayValue }) {
  const isPossession = type === 'Ball Possession';
  const homeNum      = isPossession ? parseInt(homeValue) || 50 : null;

  return (
    <Box sx={{ mb: '10px', '&:last-child': { mb: 0 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: isPossession ? '5px' : 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', fontFamily: FONT, minWidth: 32 }}>
          {homeValue ?? '—'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', flex: 1, px: '6px' }}>
          {type}
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', fontFamily: FONT, minWidth: 32, textAlign: 'right' }}>
          {awayValue ?? '—'}
        </Typography>
      </Stack>
      {isPossession && (
        <Box sx={{ height: 4, borderRadius: 2, display: 'flex', overflow: 'hidden', bgcolor: 'error.main' }}>
          <Box sx={{ width: `${homeNum}%`, bgcolor: 'primary.main', flexShrink: 0 }} />
        </Box>
      )}
    </Box>
  );
}

StatRow.propTypes = { type: PropTypes.string, homeValue: PropTypes.any, awayValue: PropTypes.any };

// Expandable match stats panel.
function MatchStats({ statistics, homeTeamId, awayTeamId }) {
  const { t } = useTranslation();

  if (!statistics?.length) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', py: 1 }}>
        {t('recent.stats.noData')}
      </Typography>
    );
  }

  const homeStats = statistics.find(s => s.team?.id === homeTeamId)?.statistics ?? [];
  const awayStats = statistics.find(s => s.team?.id === awayTeamId)?.statistics ?? [];

  const pairs = KEY_STATS
    .map(type => ({
      type,
      homeValue: homeStats.find(s => s.type === type)?.value ?? null,
      awayValue: awayStats.find(s => s.type === type)?.value ?? null,
    }))
    .filter(p => p.homeValue != null || p.awayValue != null);

  if (!pairs.length) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.disabled', fontFamily: FONT, textAlign: 'center', py: 1 }}>
        {t('recent.stats.noData')}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.8px', mb: '10px', fontFamily: FONT }}>
        {t('recent.stats.title')}
      </Typography>
      {pairs.map(p => <StatRow key={p.type} {...p} />)}
    </Box>
  );
}

MatchStats.propTypes = {
  statistics:  PropTypes.array,
  homeTeamId:  PropTypes.number,
  awayTeamId:  PropTypes.number,
};

// ── Team sub-toggle ────────────────────────────────────────────────────────────
function TeamToggle({ teamHome, teamAway, value, onChange }) {
  const teams = [
    { key: 'home', team: teamHome },
    { key: 'away', team: teamAway },
  ];
  return (
    <Box sx={{ display: 'inline-flex', bgcolor: 'action.hover', borderRadius: '10px', p: '3px' }}>
      {teams.map(({ key, team }) => {
        const active = value === key;
        return (
          <Box
            key={key}
            component="button"
            onClick={() => onChange(key)}
            sx={{
              display: 'flex', alignItems: 'center', gap: '6px',
              px: { xs: '10px', sm: '14px' }, py: '5px',
              borderRadius: '8px',
              bgcolor: active ? 'background.paper' : 'transparent',
              border: 'none', outline: 'none', cursor: 'pointer',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              maxWidth: { xs: 120, sm: 160 },
            }}
          >
            {team?.logo && (
              <Box component="img" src={team.logo} alt={team.name}
                sx={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
            )}
            <Typography sx={{
              fontSize: { xs: 11, sm: 12 }, fontWeight: active ? 600 : 400,
              color: active ? 'text.primary' : 'text.disabled',
              fontFamily: FONT, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.1px',
            }}>
              {team?.name ?? '—'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

TeamToggle.propTypes = {
  teamHome:  PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway:  PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  value:     PropTypes.string.isRequired,
  onChange:  PropTypes.func.isRequired,
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function RecentMatchHistory({ homeMatches, awayMatches, teamHome, teamAway, team1Id, team2Id, teamView, onTeamViewChange }) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const matches = teamView === 'home' ? homeMatches : awayMatches;
  const teamId  = teamView === 'home' ? team1Id : team2Id;

  return (
    <Box sx={{ bgcolor: 'background.paper', fontFamily: FONT }}>

      {/* Title + team toggle */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        px: { xs: 2, sm: '20px' }, pt: { xs: 2, sm: '18px' }, pb: '10px',
      }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.4px', lineHeight: 1, fontFamily: FONT }}>
            {t('h2h.tabs.recent')}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px', fontFamily: FONT }}>
            {matches.length} {t('recent.results')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <TeamToggle
            teamHome={teamHome}
            teamAway={teamAway}
            value={teamView}
            onChange={onTeamViewChange}
          />
        </Box>
      </Box>

      {/* Column headers */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
        gap: '8px', px: { xs: '12px', sm: '16px' }, py: '6px',
        borderBottom: '0.5px solid', borderColor: 'divider',
      }}>
        {[
          { label: t('recent.table.date'),     align: 'left',   hideXs: false },
          { label: t('recent.table.result'),   align: 'center', hideXs: false },
          { label: t('recent.table.opponent'), align: 'left',   hideXs: false },
          { label: t('recent.table.score'),    align: 'center', hideXs: false },
          { label: t('recent.table.league'),   align: 'center', hideXs: true  },
          { label: '',                          align: 'center', hideXs: false },
        ].map((col, idx) => (
          <Typography
            key={idx}
            sx={{
              display: col.hideXs ? { xs: 'none', sm: 'block' } : 'block',
              fontSize: 11, fontWeight: 600, color: 'text.disabled',
              textTransform: 'uppercase', letterSpacing: '0.5px',
              textAlign: col.align, fontFamily: FONT,
            }}
          >
            {col.label}
          </Typography>
        ))}
      </Box>

      {/* Match rows */}
      <Box sx={{ maxHeight: { xs: 280, sm: 340 }, overflowY: 'auto', pt: '4px', pb: '8px' }}>
        {matches.map((match, i) => {
          const isHome     = match.teams.home.id === teamId;
          const opponent   = isHome ? match.teams.away : match.teams.home;
          const result     = getResult(match, teamId);
          const isExpanded = expandedId === match.fixture.id;

          return (
            <Box key={match.fixture.id}>
              {/* Clickable row */}
              <Box
                onClick={() => toggleExpand(match.fixture.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
                  alignItems: 'center', gap: '8px',
                  px: { xs: '12px', sm: '16px' }, py: '10px',
                  cursor: 'pointer',
                  bgcolor: isExpanded ? 'action.hover' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Date */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', letterSpacing: '-0.2px', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: 'text.disabled', mt: '2px', textTransform: 'capitalize', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString(i18n.language, { weekday: 'long' })}
                  </Typography>
                </Box>

                {/* W/D/L pill */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ResultPill result={result} />
                </Box>

                {/* Opponent */}
                <Stack direction="row" alignItems="center" sx={{ gap: '6px', minWidth: 0 }}>
                  <MiniLogo logo={opponent.logo} name={opponent.name} />
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', letterSpacing: '-0.2px', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opponent.name}
                  </Typography>
                </Stack>

                {/* Score */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreBadge
                    homeScore={match.goals.home}
                    awayScore={match.goals.away}
                    homeWon={match.teams.home.winner}
                    awayWon={match.teams.away.winner}
                  />
                </Box>

                {/* League — hidden on mobile */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', overflow: 'hidden' }}>
                  <Typography component="span" sx={{
                    fontSize: 11, color: 'text.secondary', fontWeight: 500,
                    bgcolor: 'action.selected', borderRadius: '6px',
                    px: '7px', py: '3px', letterSpacing: '0.1px', fontFamily: FONT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}>
                    {match.league.name}
                  </Typography>
                </Box>

                {/* Chevron */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ExpandMoreIcon sx={{
                    fontSize: 16, color: 'text.disabled', flexShrink: 0,
                    transition: 'transform 0.25s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </Box>
              </Box>

              {/* Expandable stats */}
              <Box sx={{
                maxHeight: isExpanded ? '400px' : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <Box sx={{
                  mx: { xs: '12px', sm: '16px' }, mb: '8px',
                  borderRadius: '12px',
                  bgcolor: 'action.selected',
                  border: '1px solid', borderColor: 'divider',
                  p: '14px',
                }}>
                  <MatchStats
                    statistics={match.statistics}
                    homeTeamId={match.teams.home.id}
                    awayTeamId={match.teams.away.id}
                  />
                </Box>
              </Box>

              {/* Hairline separator */}
              {i < matches.length - 1 && (
                <Box sx={{ height: '0.5px', bgcolor: 'divider', mx: '12px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

RecentMatchHistory.propTypes = {
  homeMatches:       PropTypes.array.isRequired,
  awayMatches:       PropTypes.array.isRequired,
  teamHome:          PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  teamAway:          PropTypes.shape({ name: PropTypes.string, logo: PropTypes.string }),
  team1Id:           PropTypes.number.isRequired,
  team2Id:           PropTypes.number.isRequired,
  teamView:          PropTypes.string.isRequired,
  onTeamViewChange:  PropTypes.func.isRequired,
};

import { useState } from 'react';
import { Box, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import { green, grey, red } from '@mui/material/colors';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif';
const GRID_COLS        = '110px minmax(0, 1fr) 80px minmax(0, 1fr) 116px 24px';
const GRID_COLS_MOBILE = '80px minmax(0, 1fr) 64px minmax(0, 1fr) 24px';
const FORM_STYLES = {  
  W: { label: 'W', bg: green[50],  border: green[600], color: green[600] },
  D: { label: 'D', bg: grey[100],  border: grey[500],  color: grey[500]  },
  L: { label: 'L', bg: red[50],    border: red[600],   color: red[600]   },
};

const STAT_PLACEHOLDERS = ['Posesión', 'Tiros a puerta', 'Tiros totales', 'Córners', 'Faltas'];

// ── Sub-components ─────

function SegmentedControl({ options, value, onChange }) {
  return (
    <Box sx={{ display: 'inline-flex', bgcolor: 'action.hover', borderRadius: '9px', p: '2px' }}>
      {options.map(opt => (
        <Box
          key={opt.value}
          component="button"
          onClick={() => onChange(opt.value)}
          sx={{
            bgcolor: value === opt.value ? 'background.paper' : 'transparent',
            border: 'none', outline: 'none', cursor: 'pointer',
            borderRadius: '7px',
            px: { xs: '10px', sm: '14px' },
            py: { xs: '4px', sm: '5px' },
            fontSize: { xs: 12, sm: 13 },
            fontWeight: value === opt.value ? 600 : 400,
            color: value === opt.value ? 'text.primary' : 'text.disabled',
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: value === opt.value ? '0 1px 4px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none',
            letterSpacing: '-0.1px',
            fontFamily: FONT,
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Box>
  );
}

SegmentedControl.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

function ScoreBadge({ homeScore, awayScore, homeWon, awayWon }) {
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: '2px',
      bgcolor: 'action.selected',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: '10px', px: '10px', py: '5px',
      minWidth: { xs: 52, sm: 62 }, justifyContent: 'center',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: homeWon ? '#28CD41' : awayWon ? '#FF3B30' : 'text.secondary' }}>
        {homeScore}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 500, mx: '2px', lineHeight: 1, fontFamily: FONT }}>–</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', color: awayWon ? '#28CD41' : homeWon ? '#FF3B30' : 'text.secondary' }}>
        {awayScore}
      </Typography>
    </Box>
  );
}

ScoreBadge.propTypes = {
  homeScore: PropTypes.number,
  awayScore: PropTypes.number,
  homeWon:   PropTypes.bool,
  awayWon:   PropTypes.bool,
};

function MiniLogo({ logo, name }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '50%',
      bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {logo ? (
        <Box component="img" src={logo} alt={name} sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
      ) : (
        <Typography sx={{ fontSize: 9, fontWeight: 700, color: 'text.disabled', fontFamily: FONT }}>
          {name?.split(' ').map(w => w[0]).join('').slice(0, 3)}
        </Typography>
      )}
    </Box>
  );
}

MiniLogo.propTypes = { logo: PropTypes.string, name: PropTypes.string };

function FormDot({ result, opponent, homeScore, awayScore, isHome }) {
  const style = FORM_STYLES[result] ?? FORM_STYLES.D;
  const venue = isHome ? 'H' : 'A';
  const title = `vs ${opponent}  ${homeScore}-${awayScore} (${venue})`;

  return (
    <Tooltip title={title} placement="top" arrow>
      <Box sx={{
        width: 22, height: 22, borderRadius: '6px', flexShrink: 0,
        bgcolor: style.bg, border: '1px solid', borderColor: style.border,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default',
      }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: style.color, fontFamily: FONT, lineHeight: 1 }}>
          {style.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

FormDot.propTypes = {
  result:    PropTypes.string,
  opponent:  PropTypes.string,
  homeScore: PropTypes.number,
  awayScore: PropTypes.number,
  isHome:    PropTypes.bool,
};

function FormGuide({ form, team, align }) {
  if (!form?.length) return null;
  const isRight = align === 'right';
  return (
    <Stack direction={isRight ? 'row-reverse' : 'row'} alignItems="center" sx={{ gap: '6px', minWidth: 0 }}>
      {team?.logo && (
        <Box sx={{
          width: 20, height: 20, borderRadius: '50%', bgcolor: 'action.hover',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          <Box component="img" src={team.logo} alt={team.name}
            sx={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </Box>
      )}
      <Stack direction={isRight ? 'row-reverse' : 'row'} sx={{ gap: '3px' }}>
        {form.map((item, i) => <FormDot key={i} {...item} />)}
      </Stack>
    </Stack>
  );
}

FormGuide.propTypes = {
  form:  PropTypes.array,
  team:  PropTypes.object,
  align: PropTypes.string,
};

function WinDistributionBar({ team1Wins, draws, team2Wins, teamHome, teamAway }) {
  const total = team1Wins + draws + team2Wins;
  if (total === 0) return null;

  const pHome = Math.round((team1Wins / total) * 100);
  const pDraw = Math.round((draws     / total) * 100);
  const pAway = 100 - pHome - pDraw;

  return (
    <Box sx={{ px: { xs: 2, sm: '20px' }, pt: '14px', pb: '12px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: '8px' }}>
        <Stack direction="row" alignItems="center" sx={{ gap: '6px' }}>
          {teamHome?.logo && (
            <Box component="img" src={teamHome.logo} alt={teamHome.name}
              sx={{ width: 18, height: 18, objectFit: 'contain' }} />
          )}
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'primary.main', fontFamily: FONT }}>
            {team1Wins}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, color: 'text.disabled', fontFamily: FONT }}>
          {draws} {draws === 1 ? 'empate' : 'empates'}
        </Typography>
        <Stack direction="row" alignItems="center" sx={{ gap: '6px' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'warning.main', fontFamily: FONT }}>
            {team2Wins}
          </Typography>
          {teamAway?.logo && (
            <Box component="img" src={teamAway.logo} alt={teamAway.name}
              sx={{ width: 18, height: 18, objectFit: 'contain' }} />
          )}
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: '1px' }}>
        {pHome > 0 && <Box sx={{ flex: pHome, bgcolor: 'primary.main', borderRadius: '3px 0 0 3px' }} />}
        {pDraw > 0 && <Box sx={{ flex: pDraw, bgcolor: 'action.disabled' }} />}
        {pAway > 0 && <Box sx={{ flex: pAway, bgcolor: 'warning.main', borderRadius: '0 3px 3px 0' }} />}
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: '4px' }}>
        <Typography sx={{ fontSize: 10, color: 'primary.main', fontFamily: FONT }}>{pHome}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'text.disabled', fontFamily: FONT }}>{pDraw}%</Typography>
        <Typography sx={{ fontSize: 10, color: 'warning.main', fontFamily: FONT }}>{pAway}%</Typography>
      </Stack>
    </Box>
  );
}

WinDistributionBar.propTypes = {
  team1Wins: PropTypes.number.isRequired,
  draws:     PropTypes.number.isRequired,
  team2Wins: PropTypes.number.isRequired,
  teamHome:  PropTypes.object,
  teamAway:  PropTypes.object,
};

function RecentFormSection({ homeForm, awayForm, teamHome, teamAway, isLoadingForm }) {
  if (isLoadingForm) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: '10px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
        <CircularProgress size={16} />
      </Box>
    );
  }
  if (!homeForm?.length && !awayForm?.length) return null;

  return (
    <Box sx={{ px: { xs: 2, sm: '20px' }, py: '10px', borderBottom: '0.5px solid', borderColor: 'divider' }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.8px', mb: '8px', fontFamily: FONT }}>
        Recent Form
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <FormGuide form={homeForm} team={teamHome} align="left" />
        <FormGuide form={awayForm} team={teamAway} align="right" />
      </Stack>
    </Box>
  );
}

RecentFormSection.propTypes = {
  homeForm:      PropTypes.array,
  awayForm:      PropTypes.array,
  teamHome:      PropTypes.object,
  teamAway:      PropTypes.object,
  isLoadingForm: PropTypes.bool,
};

// ── Main component ────────────────────────────────────────────────────────────

export default function HeadToHead({
  filteredMatches, filter, onFilterChange, team1Id,
  teamHome, teamAway, homeForm, awayForm, isLoadingForm,
}) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const filterOptions = [
    { value: 'all',  label: t('h2h.filters.all') },
    { value: 'home', label: t('h2h.filters.home') },
    { value: 'away', label: t('h2h.filters.away') },
  ];

  const team1Wins = filteredMatches.filter(m =>
    (m.teams.home.id === team1Id && m.teams.home.winner) ||
    (m.teams.away.id === team1Id && m.teams.away.winner)
  ).length;
  const draws     = filteredMatches.filter(m => !m.teams.home.winner && !m.teams.away.winner).length;
  const team2Wins = filteredMatches.length - team1Wins - draws;

  return (
    <Box sx={{ bgcolor: 'background.paper', fontFamily: FONT, display: 'flex', flexDirection: 'column', height: '100%' }}>

      <WinDistributionBar
        team1Wins={team1Wins} draws={draws} team2Wins={team2Wins}
        teamHome={teamHome} teamAway={teamAway}
      />

      <RecentFormSection
        homeForm={homeForm} awayForm={awayForm}
        teamHome={teamHome} teamAway={teamAway}
        isLoadingForm={isLoadingForm}
      />

      {/* Title + filter row */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        px: { xs: 2, sm: '20px' }, pt: { xs: 2, sm: '18px' }, pb: '10px',
      }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'text.primary', letterSpacing: '-0.4px', lineHeight: 1, fontFamily: FONT }}>
            {t('h2h.lastMatches')}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '2px', fontFamily: FONT }}>
            {filteredMatches.length} {t('h2h.results')}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <SegmentedControl options={filterOptions} value={filter} onChange={onFilterChange} />
        </Box>
      </Box>

      {/* Column headers */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
        gap: '8px',
        px: { xs: '12px', sm: '16px' },
        py: '6px',
        borderBottom: '0.5px solid',
        borderColor: 'divider',
      }}>
        {[
          { label: t('h2h.table.date'),   align: 'left',   hideXs: false },
          { label: t('h2h.table.home'),   align: 'right',  hideXs: false },
          { label: t('h2h.table.result'), align: 'center', hideXs: false },
          { label: t('h2h.table.away'),   align: 'left',   hideXs: false },
          { label: t('h2h.table.league'), align: 'center', hideXs: true  },
          { label: '',                    align: 'center', hideXs: false },
        ].map(col => (
          <Typography
            key={col.label}
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
      <Box sx={{ flex: 1, overflowY: 'auto', pt: '4px', pb: '8px' }}>
        {filteredMatches.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.disabled', fontSize: 14, fontFamily: FONT }}>
              {t('h2h.noMatchesFilter')}
            </Typography>
          </Box>
        ) : filteredMatches.map((match, i) => {
          const homeWon    = match.teams.home.winner;
          const awayWon    = match.teams.away.winner;
          const isExpanded = expandedId === match.fixture.id;

          return (
            <Box key={match.fixture.id}>
              <Box
                onClick={() => toggleExpand(match.fixture.id)}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: GRID_COLS_MOBILE, sm: GRID_COLS },
                  alignItems: 'center', gap: '8px',
                  px: { xs: '12px', sm: '16px' }, py: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  bgcolor: isExpanded ? 'action.hover' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {/* Date */}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary', letterSpacing: '-0.2px', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: '2px', textTransform: 'capitalize', lineHeight: 1.2, fontFamily: FONT }}>
                    {new Date(match.fixture.date).toLocaleDateString(i18n.language, { weekday: 'long' })}
                  </Typography>
                </Box>

                {/* Home team */}
                <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ gap: '6px', minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', textAlign: 'right', letterSpacing: '-0.2px', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.teams.home.name}
                  </Typography>
                  <MiniLogo logo={match.teams.home.logo} name={match.teams.home.name} />
                </Stack>

                {/* Score */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ScoreBadge homeScore={match.goals.home} awayScore={match.goals.away} homeWon={homeWon} awayWon={awayWon} />
                </Box>

                {/* Away team */}
                <Stack direction="row" alignItems="center" sx={{ gap: '6px', minWidth: 0 }}>
                  <MiniLogo logo={match.teams.away.logo} name={match.teams.away.name} />
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary', letterSpacing: '-0.2px', fontFamily: FONT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {match.teams.away.name}
                  </Typography>
                </Stack>

                {/* League — hidden on xs */}
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, justifyContent: 'center', overflow: 'hidden' }}>
                  <Typography component="span" sx={{
                    fontSize: 11, color: 'text.secondary', fontWeight: 500,
                    bgcolor: 'action.selected', borderRadius: '6px',
                    px: '7px', py: '3px', letterSpacing: '0.1px', fontFamily: FONT,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                  }}>
                    {match.league.name}
                  </Typography>
                </Box>

                {/* Expand chevron */}
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ExpandMoreIcon sx={{
                    fontSize: 16, color: 'text.disabled', flexShrink: 0,
                    transition: 'transform 0.25s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }} />
                </Box>
              </Box>

              {/* Expandable stats placeholder */}
              <Box sx={{
                maxHeight: isExpanded ? '400px' : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <Box sx={{
                  mx: { xs: '12px', sm: '16px' }, mb: '8px',
                  borderRadius: '12px', bgcolor: 'action.selected',
                  border: '1px dashed', borderColor: 'divider', p: '14px',
                }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.8px', mb: '12px', fontFamily: FONT }}>
                    Estadísticas detalladas
                  </Typography>
                  {STAT_PLACEHOLDERS.map(stat => (
                    <Box key={stat} sx={{ mb: '10px', '&:last-child': { mb: 0 } }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: '5px' }}>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontFamily: FONT }}>{stat}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontFamily: FONT }}>— vs —</Typography>
                      </Stack>
                      <Box sx={{ height: 4, bgcolor: 'divider', borderRadius: 2 }} />
                    </Box>
                  ))}
                </Box>
              </Box>

              {i < filteredMatches.length - 1 && (
                <Box sx={{ height: '0.5px', bgcolor: 'divider', mx: '12px' }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

HeadToHead.propTypes = {
  filteredMatches: PropTypes.array.isRequired,
  filter:          PropTypes.string.isRequired,
  onFilterChange:  PropTypes.func.isRequired,
  team1Id:         PropTypes.number.isRequired,
  teamHome:        PropTypes.object,
  teamAway:        PropTypes.object,
  homeForm:        PropTypes.array,
  awayForm:        PropTypes.array,
  isLoadingForm:   PropTypes.bool,
};

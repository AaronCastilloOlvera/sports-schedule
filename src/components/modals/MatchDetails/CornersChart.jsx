import { useMemo, useState } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceLine,
  ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import PropTypes from 'prop-types';
import { fmt } from './useBettingStats';

const HOME_COLOR  = '#1976d2';
const AWAY_COLOR  = '#ed6c02';
const TOTAL_COLOR = '#7b1fa2';

const mean = (arr) => {
  const v = arr.filter(x => x !== null && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

function FilterChips({ options, value, onChange }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {options.map(opt => (
        <Chip
          key={opt.value}
          label={opt.label}
          size="small"
          onClick={() => onChange(opt.value)}
          color={value === opt.value ? 'primary' : 'default'}
          variant={value === opt.value ? 'filled' : 'outlined'}
          clickable
          sx={{ fontSize: 11, height: 24 }}
        />
      ))}
    </Stack>
  );
}
FilterChips.propTypes = { options: PropTypes.array, value: PropTypes.string, onChange: PropTypes.func };

// ── Tooltip for H2H single-line chart ────────────────────────────────────────

function CornerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const p = payload[0];
  const color = p.stroke ?? p.color ?? HOME_COLOR;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, boxShadow: 2, minWidth: 120 }}>
      <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.25 }}>{d?.date}</Typography>
      {d?.vs && <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5 }}>{d.vs}</Typography>}
      <Typography sx={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>
        {p.value ?? '—'}
        <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>corners</Typography>
      </Typography>
    </Box>
  );
}
CornerTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array };

// ── Tooltip for combined two-line chart ───────────────────────────────────────

function CombinedTooltip({ active, payload, teamHome, teamAway }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const homeP = payload.find(p => p.dataKey === 'home');
  const awayP = payload.find(p => p.dataKey === 'away');
  return (
    <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, boxShadow: 2, minWidth: 140 }}>
      {homeP && (
        <Box sx={{ mb: awayP ? 1 : 0 }}>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{teamHome?.name}</Typography>
          {d?.homeDate && <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{d.homeDate}{d.homeVs ? ` · vs ${d.homeVs}` : ''}</Typography>}
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: HOME_COLOR, lineHeight: 1.2 }}>
            {homeP.value ?? '—'}
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>corners</Typography>
          </Typography>
        </Box>
      )}
      {awayP && (
        <Box>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{teamAway?.name}</Typography>
          {d?.awayDate && <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{d.awayDate}{d.awayVs ? ` · vs ${d.awayVs}` : ''}</Typography>}
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: AWAY_COLOR, lineHeight: 1.2 }}>
            {awayP.value ?? '—'}
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 400, color: 'text.secondary', ml: 0.5 }}>corners</Typography>
          </Typography>
        </Box>
      )}
    </Box>
  );
}
CombinedTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.array, teamHome: PropTypes.object, teamAway: PropTypes.object };

// ── Single-line mini chart (used for H2H) ────────────────────────────────────

function MiniChart({ data, barKey, barColor, avgVal, line, emptyMsg }) {
  const filtered = data.filter(d => d[barKey] !== null && d[barKey] !== undefined);
  if (!filtered.length) {
    return (
      <Box sx={{ py: 2.5, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{emptyMsg ?? 'No data'}</Typography>
      </Box>
    );
  }
  return (
    <Box>
      {avgVal !== null && (
        <Typography sx={{ fontSize: 10, color: 'text.disabled', mb: 0.5, textAlign: 'right' }}>
          avg {fmt(avgVal)}{line !== null ? ` · line ${fmt(line)}` : ''}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={filtered} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <RechartsTooltip content={<CornerTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.08)' }} />
          {avgVal !== null && (
            <ReferenceLine y={avgVal} stroke="#9e9e9e" strokeDasharray="4 3" />
          )}
          {line !== null && (
            <ReferenceLine y={line} stroke="#d32f2f" strokeDasharray="4 3" label={{ value: fmt(line), fontSize: 9, fill: '#d32f2f', position: 'insideTopRight' }} />
          )}
          <Line
            type="monotone"
            dataKey={barKey}
            stroke={barColor}
            strokeWidth={2}
            dot={{ r: 4, fill: barColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: barColor, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
MiniChart.propTypes = {
  data: PropTypes.array,
  barKey: PropTypes.string,
  barColor: PropTypes.string,
  avgVal: PropTypes.number,
  line: PropTypes.number,
  emptyMsg: PropTypes.string,
};

// ── Combined two-line chart (home as local, away as visitante) ───────────────

function CombinedChart({ data, homeAvg, awayAvg, teamHome, teamAway }) {
  if (!data.length) return null;
  return (
    <Box>
      <Typography sx={{ fontSize: 10, color: 'text.disabled', mb: 0.5, textAlign: 'right' }}>
        <Typography component="span" sx={{ color: HOME_COLOR, fontWeight: 700, fontSize: 10 }}>avg {fmt(homeAvg)}</Typography>
        {' · '}
        <Typography component="span" sx={{ color: AWAY_COLOR, fontWeight: 700, fontSize: 10 }}>avg {fmt(awayAvg)}</Typography>
      </Typography>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="index" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <RechartsTooltip
            content={(props) => <CombinedTooltip {...props} teamHome={teamHome} teamAway={teamAway} />}
            cursor={{ stroke: 'rgba(0,0,0,0.08)' }}
          />
          {homeAvg !== null && <ReferenceLine y={homeAvg} stroke={HOME_COLOR} strokeDasharray="4 3" strokeOpacity={0.5} />}
          {awayAvg !== null && <ReferenceLine y={awayAvg} stroke={AWAY_COLOR} strokeDasharray="4 3" strokeOpacity={0.5} />}
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            formatter={(value) => value === 'home' ? (teamHome?.name ?? 'Home') : (teamAway?.name ?? 'Away')}
          />
          <Line
            type="monotone"
            dataKey="home"
            stroke={HOME_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: HOME_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: HOME_COLOR, strokeWidth: 0 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="away"
            stroke={AWAY_COLOR}
            strokeWidth={2}
            dot={{ r: 4, fill: AWAY_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: AWAY_COLOR, strokeWidth: 0 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
CombinedChart.propTypes = {
  data: PropTypes.array,
  homeAvg: PropTypes.number,
  awayAvg: PropTypes.number,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
};

// ── CornersChart ──────────────────────────────────────────────────────────────

export default function CornersChart({ stats, teamHome, teamAway }) {
  const [h2hFilter, setH2hFilter] = useState('total');

  const h2hPoints = stats?.h2hCornerPoints  ?? [];
  const homePts   = stats?.homeCornerPoints ?? [];
  const awayPts   = stats?.awayCornerPoints ?? [];

  // H2H — map to a single _val depending on filter
  const h2hData = useMemo(() => h2hPoints.map(d => ({
    ...d,
    _val: h2hFilter === 'home' ? d.home : h2hFilter === 'away' ? d.away : d.total,
  })), [h2hPoints, h2hFilter]);

  const h2hAvg  = useMemo(() => mean(h2hData.map(d => d._val)), [h2hData]);
  const h2hLine = h2hFilter === 'total' ? (stats?.cornerLine ?? null) : null;
  const h2hColor = h2hFilter === 'total' ? TOTAL_COLOR : h2hFilter === 'home' ? HOME_COLOR : AWAY_COLOR;

  // Combined: home team as local, away team as visitante
  const homeLocal    = useMemo(() => homePts.filter(d => d.venue === 'home' && d.corners !== null && d.corners !== undefined), [homePts]);
  const awayVisitor  = useMemo(() => awayPts.filter(d => d.venue === 'away' && d.corners !== null && d.corners !== undefined), [awayPts]);

  const combinedData = useMemo(() => {
    const maxLen = Math.max(homeLocal.length, awayVisitor.length);
    if (!maxLen) return [];
    return Array.from({ length: maxLen }, (_, i) => ({
      index: i + 1,
      home:     homeLocal[i]?.corners  ?? null,
      away:     awayVisitor[i]?.corners ?? null,
      homeDate: homeLocal[i]?.date     ?? '',
      homeVs:   homeLocal[i]?.vs       ?? '',
      awayDate: awayVisitor[i]?.date   ?? '',
      awayVs:   awayVisitor[i]?.vs     ?? '',
    }));
  }, [homeLocal, awayVisitor]);

  const homeAvg = useMemo(() => mean(homeLocal.map(d => d.corners)), [homeLocal]);
  const awayAvg = useMemo(() => mean(awayVisitor.map(d => d.corners)), [awayVisitor]);

  if (!h2hPoints.length && !combinedData.length) return null;

  const h2hOptions = [
    { value: 'total', label: 'Total' },
    { value: 'home',  label: teamHome?.name ?? 'Home' },
    { value: 'away',  label: teamAway?.name ?? 'Away' },
  ];

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>🚩 Corners Trend</Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* ── H2H ── */}
        {h2hData.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                H2H ({h2hData.length})
              </Typography>
              <FilterChips options={h2hOptions} value={h2hFilter} onChange={setH2hFilter} />
            </Stack>
            <MiniChart
              data={h2hData}
              barKey="_val"
              barColor={h2hColor}
              avgVal={h2hAvg}
              line={h2hLine}
            />
          </Box>
        )}

        {/* ── Combined recent form ── */}
        {combinedData.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.4px', mb: 1 }}>
              Forma reciente · local vs visitante
            </Typography>
            <CombinedChart
              data={combinedData}
              homeAvg={homeAvg}
              awayAvg={awayAvg}
              teamHome={teamHome}
              teamAway={teamAway}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

CornersChart.propTypes = {
  stats:    PropTypes.object.isRequired,
  teamHome: PropTypes.object,
  teamAway: PropTypes.object,
};

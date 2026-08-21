import { useEffect, useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BET_TYPES } from '../../utils/consts.jsx';
import { apiClient } from '../../api/api.js';

const GREEN = '#2e7d32';
const RED = '#d32f2f';
const BLUE = '#1976d2';
const PIE_COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#7b1fa2', '#0097a7', '#c62828', '#558b2f', '#ad1457'];
const LINE_COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#7b1fa2', '#0097a7', '#c62828', '#558b2f', '#ad1457'];
const SPORT_ICONS = { futbol: '⚽', basketball: '🏀', american_football: '🏈', baseball: '⚾' };
const BET_TYPE_LABELS = Object.fromEntries(BET_TYPES.map(b => [b.value, b.label]));

const usd = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (value, data) => `${((value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%`;

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{ bgcolor: 'background.paper', p: '8px 10px', borderRadius: 1, boxShadow: 2, fontSize: 12 }}>
      <div>{d.date}</div>
      <div>{d.count} bet{d.count === 1 ? '' : 's'} · {usd(d.profit)}</div>
    </Box>
  );
}

function ChartCard({ title, children, sx = {} }) {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: 3, ...sx }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

export default function BetsAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 8,
    color: theme.palette.text.primary,
  };

  useEffect(() => {
    apiClient.fetchBetsAnalytics()
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!analytics) return null;

  const { summary } = analytics;

  // Pie helpers — trivial index-based color maps, no useMemo needed
  const winLossPie = [
    { name: 'Won',  value: analytics.win_loss_counts.won,  fill: GREEN },
    { name: 'Lost', value: analytics.win_loss_counts.lost, fill: RED },
    ...(analytics.win_loss_counts.push > 0 ? [{ name: 'Push', value: analytics.win_loss_counts.push, fill: '#757575' }] : []),
  ].filter(d => d.value > 0);

  const sportPie = analytics.sport_data.map((d, i) => ({
    name: `${SPORT_ICONS[d.sport] || '🎯'} ${d.sport}`,
    value: d.count,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const leaguePie = [...analytics.league_data]
    .sort((a, b) => b.count - a.count)
    .map((d, i) => ({ name: d.league, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  // Apply label mapping from raw bet_type values
  const betTypeData = analytics.bet_type_data.map(d => ({
    ...d,
    betType: BET_TYPE_LABELS[d.betType] || d.betType,
  }));
  const betTypePie = betTypeData.map((d, i) => ({ name: d.betType, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  const oddsBucketPie = analytics.odds_bucket_data.map((d, i) => ({ name: d.range, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));
  const studiedPie    = analytics.studied_data.map(d => ({ name: d.label, value: d.count, fill: d.label === 'Studied' ? BLUE : '#757575' }));
  const dayOfWeekPie  = analytics.day_of_week_data.map((d, i) => ({ name: d.day, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));
  const timeOfDayPie  = analytics.time_of_day_data.map((d, i) => ({ name: d.time, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] }));

  const renderPieTooltip = (data) => ({ formatter: (v) => [`${v} tickets (${pct(v, data)})`, ''] });

  return (
    <Box>
      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Best Day',       display: summary.best_day  ? `${usd(summary.best_day.profit)} (${summary.best_day.date})` : '—', color: GREEN },
          { label: 'Best Bet',       display: summary.best_bet_profit != null ? usd(summary.best_bet_profit) : '—', color: GREEN },
          { label: 'Current Streak', display: summary.streak ? `${summary.streak} ${summary.streak_type === 'won' ? 'W' : 'L'}` : '—', color: summary.streak_type === 'won' ? GREEN : RED },
          { label: 'Avg Odds',       display: summary.avg_odds ? `${summary.avg_odds}x` : '—', color: BLUE },
        ].map(({ label, display, color }) => (
          <Paper key={label} elevation={2} sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{display}</Typography>
          </Paper>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="General" />
        <Tab label="By Sport" />
        <Tab label="By League" />
        <Tab label="By Bet Type" />
        <Tab label="By Odds" />
        <Tab label="Studied" />
        <Tab label="Timing" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Accumulated Profit">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.accumulated_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(analytics.accumulated_data.length / 8)} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                <Line type="monotone" dataKey="profit" stroke={BLUE} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Daily P&L" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.daily_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(analytics.daily_data.length / 8)} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'P&L']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.daily_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Won / Lost / Push" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={winLossPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {winLossPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} tickets`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Accumulated Profit by Sport">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.accumulated_by_sport}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(analytics.accumulated_by_sport.length / 8)} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [usd(v), `${SPORT_ICONS[name] || '🎯'} ${name}`]} />
                <Legend />
                {(analytics.sports || []).map((sport, i) => (
                  <Line key={sport} type="monotone" dataKey={sport} stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Sport" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.sport_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.sport_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Sport" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sportPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {sportPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(sportPie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Sport">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.sport_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ROI % by Sport">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.sport_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'ROI']} />
                <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                  {analytics.sport_data.map((entry, i) => <Cell key={i} fill={entry.roi >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Leagues by Profit">
            <ResponsiveContainer width="100%" height={Math.max(300, analytics.league_data.length * 28)}>
              <BarChart data={analytics.league_data} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={usd} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="league" width={150} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {analytics.league_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tickets by League">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={leaguePie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={110}>
                  {leaguePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(leaguePie)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ROI % by League">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.league_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="league" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'ROI']} />
                <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                  {analytics.league_data.map((entry, i) => <Cell key={i} fill={entry.roi >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 3 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Accumulated Profit by Bet Type">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={analytics.accumulated_by_bet_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor((analytics.accumulated_by_bet_type || []).length / 8)} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [usd(v), BET_TYPE_LABELS[name] || name]} />
                <Legend formatter={(name) => BET_TYPE_LABELS[name] || name} />
                {(analytics.bet_types || []).map((bt, i) => (
                  <Line key={bt} type="monotone" dataKey={bt} stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Bet Type" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={betTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="betType" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {betTypeData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Bet Type" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={betTypePie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {betTypePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(betTypePie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Bet Type">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={betTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="betType" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="ROI % by Bet Type">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={betTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="betType" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'ROI']} />
                <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                  {betTypeData.map((entry, i) => <Cell key={i} fill={entry.roi >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 4 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Odds Range" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.odds_bucket_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.odds_bucket_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Odds Range" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={oddsBucketPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {oddsBucketPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(oddsBucketPie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Odds Range">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.odds_bucket_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 5 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit — Studied vs Not" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.studied_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.studied_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets — Studied vs Not" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={studiedPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {studiedPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(studiedPie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate — Studied vs Not">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.studied_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 6 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Day of Week" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.day_of_week_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.day_of_week_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Day of Week" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={dayOfWeekPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {dayOfWeekPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(dayOfWeekPie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Day of Week">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.day_of_week_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Time of Day" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.time_of_day_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {analytics.time_of_day_data.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Time of Day" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={timeOfDayPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80}>
                    {timeOfDayPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} {...renderPieTooltip(timeOfDayPie)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Time of Day">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.time_of_day_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Bets per Day vs. Profit">
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 1 }}>
              Cada punto es un día — ¿los días con más apuestas te van peor?
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="count" name="Bets" allowDecimals={false} tick={{ fontSize: 12 }}
                  label={{ value: 'Bets that day', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                <YAxis type="number" dataKey="profit" name="Profit" tickFormatter={usd} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={analytics.daily_count_profit}>
                  {analytics.daily_count_profit.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}
    </Box>
  );
}

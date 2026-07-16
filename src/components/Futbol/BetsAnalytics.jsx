import { useMemo, useState } from 'react';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const GREEN = '#2e7d32';
const RED = '#d32f2f';
const BLUE = '#1976d2';
const PIE_COLORS = ['#1976d2', '#2e7d32', '#f57c00', '#7b1fa2', '#0097a7', '#c62828', '#558b2f', '#ad1457'];
const SPORT_ICONS = { futbol: '⚽', basketball: '🏀', american_football: '🏈', baseball: '⚾' };

const usd = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (value, data) => `${((value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%`;

function ChartCard({ title, children, sx = {} }) {
  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, ...sx }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>{title}</Typography>
      {children}
    </Box>
  );
}

export default function BetsAnalytics({ tickets }) {
  const [tab, setTab] = useState(0);

  const resolved = useMemo(
    () => tickets.filter(t => t.status === 'won' || t.status === 'lost' || t.status === 'push'),
    [tickets],
  );

  // General — accumulated profit
  const accumulatedData = useMemo(() => {
    let acc = 0;
    const points = [...resolved]
      .sort((a, b) => new Date(a.match_datetime) - new Date(b.match_datetime))
      .map(t => {
        acc += t.net_profit || 0;
        return {
          date: new Date(t.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
          profit: parseFloat(acc.toFixed(2)),
        };
      });
    return [{ date: '', profit: 0 }, ...points];
  }, [resolved]);

  // General — daily P&L
  const dailyData = useMemo(() => {
    const byDay = {};
    resolved.forEach(t => {
      const date = new Date(t.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
      byDay[date] = (byDay[date] || 0) + (t.net_profit || 0);
    });
    return Object.entries(byDay)
      .map(([date, profit]) => ({ date, profit: parseFloat(profit.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [resolved]);

  // General — won/lost/push pie
  const winLossPie = useMemo(() => {
    const won = resolved.filter(t => t.status === 'won').length;
    const lost = resolved.filter(t => t.status === 'lost').length;
    const push = resolved.filter(t => t.status === 'push').length;
    return [
      { name: 'Won', value: won, fill: GREEN },
      { name: 'Lost', value: lost, fill: RED },
      ...(push > 0 ? [{ name: 'Push', value: push, fill: '#757575' }] : []),
    ].filter(d => d.value > 0);
  }, [resolved]);

  // By sport — profit + win rate
  const sportData = useMemo(() => {
    const map = {};
    resolved.forEach(t => {
      const key = t.sport || 'Unknown';
      if (!map[key]) map[key] = { profit: 0, won: 0, total: 0 };
      map[key].profit += t.net_profit || 0;
      map[key].total++;
      if (t.status === 'won') map[key].won++;
    });
    return Object.entries(map).map(([sport, d]) => ({
      sport,
      profit: parseFloat(d.profit.toFixed(2)),
      winRate: parseFloat(((d.won / d.total) * 100).toFixed(1)),
      count: d.total,
    }));
  }, [resolved]);

  // By sport — pie (tickets by sport)
  const sportPie = useMemo(() =>
    sportData.map((d, i) => ({ name: `${SPORT_ICONS[d.sport] || '🎯'} ${d.sport}`, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] })),
    [sportData],
  );

  // By league — top 10 by profit
  const leagueData = useMemo(() => {
    const map = {};
    resolved.forEach(t => {
      const key = t.league || 'Unknown';
      if (!map[key]) map[key] = { profit: 0, count: 0 };
      map[key].profit += t.net_profit || 0;
      map[key].count++;
    });
    return Object.entries(map)
      .map(([league, d]) => ({ league, profit: parseFloat(d.profit.toFixed(2)), count: d.count }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }, [resolved]);

  // By league — pie (tickets by league, top 8)
  const leaguePie = useMemo(() =>
    [...leagueData]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((d, i) => ({ name: d.league, value: d.count, fill: PIE_COLORS[i % PIE_COLORS.length] })),
    [leagueData],
  );

  // Analytics summary stats
  const analyticsStats = useMemo(() => {
    const byDay = {};
    resolved.forEach(t => {
      const date = new Date(t.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
      byDay[date] = (byDay[date] || 0) + (t.net_profit || 0);
    });
    const bestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    const bestBet = resolved.reduce((best, t) => (t.net_profit || 0) > (best?.net_profit || 0) ? t : best, null);
    const sorted = [...resolved]
      .filter(t => t.status === 'won' || t.status === 'lost')
      .sort((a, b) => new Date(b.match_datetime) - new Date(a.match_datetime));
    let streak = 0, streakType = null;
    for (const t of sorted) {
      if (!streakType) { streakType = t.status; streak = 1; }
      else if (t.status === streakType) streak++;
      else break;
    }
    const withOdds = resolved.filter(t => t.odds > 0);
    const avgOdds = withOdds.length ? (withOdds.reduce((s, t) => s + t.odds, 0) / withOdds.length).toFixed(2) : 0;
    return { bestDay, bestBet, streak, streakType, avgOdds };
  }, [resolved]);

  const { bestDay, bestBet, streak, streakType, avgOdds } = analyticsStats;

  const renderPieTooltip = (data) => ({ formatter: (v) => [`${v} tickets (${pct(v, data)})`, ''] });

  return (
    <Box>
      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Best Day', display: bestDay ? `${usd(bestDay[1])} (${bestDay[0]})` : '—', color: GREEN },
          { label: 'Best Bet', display: bestBet ? usd(bestBet.net_profit) : '—', color: GREEN },
          { label: 'Current Streak', display: streak ? `${streak} ${streakType === 'won' ? 'W' : 'L'}` : '—', color: streakType === 'won' ? GREEN : RED },
          { label: 'Avg Odds', display: avgOdds ? `${avgOdds}x` : '—', color: BLUE },
        ].map(({ label, display, color }) => (
          <Box key={label} sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 2 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{display}</Typography>
          </Box>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="General" />
        <Tab label="By Sport" />
        <Tab label="By League" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Accumulated Profit" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accumulatedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [usd(v), 'Profit']} />
                  <Line type="monotone" dataKey="profit" stroke={BLUE} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Won / Lost / Push" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={winLossPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} >
                    {winLossPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} tickets`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Daily P&L">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [usd(v), 'P&L']} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            <ChartCard title="Profit by Sport" sx={{ flex: 2 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sportData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [usd(v), 'Profit']} />
                  <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                    {sportData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Tickets by Sport" sx={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sportPie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} >
                    {sportPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} tickets`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Stack>

          <ChartCard title="Win Rate by Sport">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Win Rate']} />
                <Bar dataKey="winRate" fill={BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 2 && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <ChartCard title="Top Leagues by Profit" sx={{ flex: 2 }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={leagueData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={usd} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="league" width={130} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [usd(v), 'Profit']} />
                <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                  {leagueData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Tickets by League" sx={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={leaguePie} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={110} >
                  {leaguePie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v, name) => [`${v} tickets`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Stack>
      )}
    </Box>
  );
}

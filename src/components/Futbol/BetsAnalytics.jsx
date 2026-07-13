import { useMemo, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const GREEN = '#2e7d32';
const RED = '#d32f2f';
const BLUE = '#1976d2';

const usd = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ChartCard({ title, children }) {
  return (
    <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3 }}>
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

  // General — accumulated profit per ticket (sorted by match date)
  const accumulatedData = useMemo(() => {
    let acc = 0;
    return [...resolved]
      .sort((a, b) => new Date(a.match_datetime) - new Date(b.match_datetime))
      .map(t => {
        acc += t.net_profit || 0;
        return {
          date: new Date(t.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' }),
          profit: parseFloat(acc.toFixed(2)),
        };
      });
  }, [resolved]);

  // General — daily P&L (sum per day)
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
    }));
  }, [resolved]);

  // By league — top 10 by profit
  const leagueData = useMemo(() => {
    const map = {};
    resolved.forEach(t => {
      const key = t.league || 'Unknown';
      map[key] = (map[key] || 0) + (t.net_profit || 0);
    });
    return Object.entries(map)
      .map(([league, profit]) => ({ league, profit: parseFloat(profit.toFixed(2)) }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }, [resolved]);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="General" />
        <Tab label="By Sport" />
        <Tab label="By League" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Accumulated Profit">
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

          <ChartCard title="Daily P&L">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [usd(v), 'P&L']} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, i) => (
                    <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ChartCard title="Profit by Sport">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={usd} width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [usd(v), 'Profit']} />
                <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                  {sportData.map((entry, i) => (
                    <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

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
        <ChartCard title="Top Leagues by Profit">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={leagueData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={usd} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="league" width={130} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [usd(v), 'Profit']} />
              <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                {leagueData.map((entry, i) => (
                  <Cell key={i} fill={entry.profit >= 0 ? GREEN : RED} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </Box>
  );
}

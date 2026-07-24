import { useMemo } from 'react';
import {
  Box, Dialog, DialogContent, DialogTitle, IconButton, Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import PropTypes from 'prop-types';

// Soccer runs ~2h including HT stoppage; baseball has no clock but averages ~3h.
// Used only to estimate how long a match "occupies" the timeline, not shown anywhere.
const DURATION_HOURS = { baseball: 3, futbol: 2 };

// For every match, mark every hour its estimated window touches as "occupied",
// then count how many matches occupy each hour of the day — the wave is just
// that count plotted across 24 hours.
function computeHourlyDensity(matches) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  matches.forEach((match) => {
    const start = new Date(match.fixture.date);
    if (Number.isNaN(start.getTime())) return;
    const startHour = start.getHours();
    const duration = DURATION_HOURS[match.sport] ?? 2;
    for (let i = 0; i < duration; i++) {
      buckets[(startHour + i) % 24].count += 1;
    }
  });
  return buckets.map((b) => ({ label: `${String(b.hour).padStart(2, '0')}:00`, count: b.count }));
}

export default function SimultaneousChart({ matches, onClose }) {
  const data = useMemo(() => computeHourlyDensity(matches), [matches]);
  const peak = useMemo(() => data.reduce((max, d) => (d.count > max.count ? d : max), data[0]), [data]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>🌊 Partidos simultáneos por hora</Typography>
          {peak.count > 0 && (
            <Typography variant="body2" color="text.secondary">
              Pico del día: {peak.label} — {peak.count} partido{peak.count === 1 ? '' : 's'} a la vez
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="simultaneousWave" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
            <Tooltip formatter={(v) => [`${v} partido${v === 1 ? '' : 's'}`, '']} />
            <Area type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} fill="url(#simultaneousWave)" />
          </AreaChart>
        </ResponsiveContainer>
      </DialogContent>
    </Dialog>
  );
}

SimultaneousChart.propTypes = {
  matches: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};

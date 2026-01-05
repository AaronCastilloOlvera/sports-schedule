import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../api/api.js';
import { Typography, Box } from '@mui/material';

export default function FutbolCharts() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndProcessTickets = async () => {
      try {
        setLoading(true);
        const tickets = await apiClient.fetchTickets();

        // Process only resolved bets and sort them by date
        const sortedTickets = tickets
          .filter(t => (t.status === 'won' || t.status === 'lost') && t.created_at)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        let accumulatedProfit = 0;
        const processedData = sortedTickets.map(ticket => {
          accumulatedProfit += ticket.net_profit || 0; // Ensure net_profit is a number
          return {
            date: new Date(ticket.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
            accumulatedProfit: accumulatedProfit,
            // Pass through other data for the tooltip
            net_profit: ticket.net_profit || 0,
            pick: ticket.pick,
            status: ticket.status,
            stake: ticket.stake,
            odds: ticket.odds,
          };
        });
        
        setChartData(processedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching tickets for chart:", err);
        setError("Failed to load chart data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndProcessTickets();
  }, []); // Empty dependency array means this runs once on mount

  // Render loading state
  if (loading) {
    return <Typography sx={{ p: 3 }}>Loading chart data...</Typography>;
  }

  // Render error state
  if (error) {
    return <Typography color="error" sx={{ p: 3 }}>{error}</Typography>;
  }

  // Render message if no data is available
  if (chartData.length === 0) {
    return <Typography sx={{ p: 3 }}>No resolved bet data available to display.</Typography>;
  }

  // Render the chart
  return (
    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 2, width: '60%', maxWidth: '100%', margin: '0 auto', mt: 6 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        Profit Evolution
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{
            top: 5, right: 20, left: 30, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value)}
            width={80}
          />
          
          <Legend />
          <Line 
            type="monotone" 
            dataKey="accumulatedProfit" 
            name="Accumulated Profit" 
            stroke="#8884d8" 
            strokeWidth={2} 
            dot={{ r: 2 }}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
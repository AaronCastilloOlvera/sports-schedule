import { Box, Grid, Typography } from '@mui/material';

const RULES = [
  {
    text: "Keep it simple. The best bets are the ones you can explain in one sentence.",
    author: "The Analyst",
  },
  {
    text: "If it can go wrong, it will. Build your strategy around the worst case, not the best.",
    author: "Murphy",
  },
  {
    text: "Bet as though someone is watching every move you make — because you are. Have some respect for the process.",
    author: "The Analyst",
  },
  {
    text: "This isn't a 100-meter dash, it's a marathon. Consistency beats intensity every single time.",
    author: "The Analyst",
  },
  {
    text: "Slow, steady bankroll growth beats one lucky night — every time.",
    author: "Compound Interest",
  },
];

function QuoteCard({ text, author }) {
  return (
    <Box
      sx={{
        bgcolor: 'white',
        borderRadius: 2,
        boxShadow: 2,
        p: 4,
        borderLeft: '4px solid #1976d2',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: '100%',
      }}
    >
      <Typography
        variant="h3"
        sx={{ color: '#1976d2', lineHeight: 0.5, fontFamily: 'Georgia, serif', userSelect: 'none' }}
      >
        "
      </Typography>
      <Typography
        variant="body1"
        sx={{ fontStyle: 'italic', fontSize: '1.05rem', color: '#333', flexGrow: 1 }}
      >
        {text}
      </Typography>
      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 'bold', textAlign: 'right' }}>
        — {author}
      </Typography>
    </Box>
  );
}

export default function BettingRules() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Betting Rules</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Principles to keep you grounded. Read before placing a bet.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {RULES.map((rule, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <QuoteCard text={rule.text} author={rule.author} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

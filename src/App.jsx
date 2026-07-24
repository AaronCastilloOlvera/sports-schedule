import { useMemo, useState } from 'react';
import { Box, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext.jsx';
import Header from './components/layout/Header.jsx';
import FutbolDashboard from './views/FutbolDashboard.jsx';
import Leagues from './components/Futbol/Leagues.jsx';
import Bets from './components/Futbol/Bets.jsx';

// Reads mode from context, builds the MUI theme, and renders the app.
// Kept as a separate component so it can consume ThemeModeContext before
// ThemeProvider is mounted — you cannot do both in the same component.
// section → component mapping. "My Leagues" and "Control" (Bets) are sport-agnostic,
// so they live at this top level instead of nested under a sport tab. "Home" is
// the unified schedule — sport filter chips live inside Fixtures.jsx itself.
const SECTION_VIEWS = {
  home: <FutbolDashboard />,
  myLeagues: <Leagues />,
  control: <Bets />,
};

function AppContent() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const [activeSection, setActiveSection] = useState('home');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
        <Header activeSection={activeSection} onSectionChange={setActiveSection} />
        <Box sx={{
          flexGrow: 1,
          p: { xs: 1, md: 2 },
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {SECTION_VIEWS[activeSection]}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  );
}

export default App;

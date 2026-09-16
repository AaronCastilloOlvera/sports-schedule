import { useMemo, useState } from 'react';
import { Box, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import { ThemeModeProvider, useThemeMode } from './context/ThemeContext.jsx';
import Header from './components/layout/Header.jsx';
import FutbolDashboard from './views/FutbolDashboard.jsx';
import Bets from './components/Futbol/Bets.jsx';
import BetRadarView from './components/Futbol/BetRadarView.jsx';

const SECTION_VIEWS = {
  radar:   <BetRadarView />,
  home:    <FutbolDashboard />,
  control: <Bets />,
};

function AppContent() {
  const { mode } = useThemeMode();
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  const [activeSection, setActiveSection] = useState('radar');

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

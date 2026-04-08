import { Box } from "@mui/material";
import './App.css';
import Header from './components/layout/Header.jsx';
import FutbolDashboard from './views/FutbolDashboard.jsx';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      <Header />
      <Box sx={{ 
        flexGrow: 1, 
        p: { xs: 1, md: 2 },
        maxWidth: '1200px', 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box' 
      }}>
        <FutbolDashboard />
      </Box>
    </Box>
  )
}

export default App
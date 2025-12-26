import { Box } from "@mui/material";
import './App.css';
import Header from './Header';
import FutbolDashboard from './Futbol';

function App() {
  return (
    
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <FutbolDashboard />
      </Box>
    </Box>
  )
}

export default App

import { Box } from "@mui/material";
import Header from './Header';
import './App.css';
import Sidebar from './Sidebar';
import FutbolDashboard from './Futbol';

function App() {
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header /> 
      <Sidebar />
      <Box sx={{ flex: 1, padding: 2, marginTop: 8 }}>
        <FutbolDashboard />
      </Box>
    </Box>
  )
}

export default App

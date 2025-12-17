import { Box } from "@mui/material";
import Header from './Header';
import './App.css';
import Sidebar from './Sidebar';
import Fixtures from './Fixtures';

function App() {
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header currentRequests={0} limitDay={0} /> 
      <Sidebar />
      <Box sx={{ flex: 1, padding: 2 }}>
        <Fixtures />
      </Box>
    </Box>
  )
}

export default App

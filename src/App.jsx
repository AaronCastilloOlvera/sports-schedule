import { useEffect, useState } from 'react'
import { Box } from "@mui/material";
import Header from './Header';
import './App.css';
import { apiClient } from './api';
import Sidebar from './Sidebar';
import Fixtures from './Fixtures';

function App() {
  const [leagues, setLeagues] = useState(null)
  
  useEffect(() => {
    let mounted = true;
    
    apiClient.fetchFavoriteLeagues()
      .then((leagues) => { if (mounted) setLeagues(leagues); })
      .catch((error) => console.error(error));

    return () => { mounted = false; };
  }, [])
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

import { useEffect, useState } from 'react'
import { Box } from "@mui/material";
import Header from './Header';
import './App.css';
import { apiClient } from './api';
import Sidebar from './Sidebar';

function App() {
  const [leagues, setLeagues] = useState(null)
  
  useEffect(() => {
    let mounted = true;
    
    apiClient.fetchFavoriteLeagues()
      .then((leagues) => { if (mounted) setLeagues(leagues); })
      .catch((error) => console.error(error));

      console.log(leagues);

    return () => { mounted = false; };
  }, [])
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header currentRequests={0} limitDay={0} /> 
      <Sidebar />
    </Box>
  )
}

export default App

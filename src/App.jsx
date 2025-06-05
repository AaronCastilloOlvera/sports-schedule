import { useEffect, useState } from 'react'
import { Box, List, ListItemButton, ListItemText } from "@mui/material";
import Header from './Header';
import './App.css';
import { fetchFavoriteLeagues } from './api';
import Sidebar from './Sidebar';

function App() {
  const [leagues, setLeagues] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL, VITE_API_HOST: apiHost } = import.meta.env;
  
  useEffect(() => {
    fetchFavoriteLeagues(apiHost)
    .then((leagues) => { setLeagues(leagues) })
    .catch((error) => console.error(error))
  }, [])
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header currentRequests={0} limitDay={0} /> 
      <Sidebar />
    </Box>
  )
}

export default App

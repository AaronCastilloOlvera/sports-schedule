import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material';
import Header from './Header';
import './App.css';
import { fetchStatus, fetchLeagues, fetchFavoriteLeagues, fetchLeaguesCountries } from './api';
import Sidebar from './Sidebar';

function App() {
  const [leaguesCountries, setLeaguesCountries] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL, VITE_API_HOST: apiHost } = import.meta.env;
  
  useEffect(() => {
    /*
    fetchLeagues(apiHost)
      .then((leagues) => setLeagues(leagues))
      .catch((error) => console.error(error))
    */
    
    fetchLeaguesCountries(apiHost)
    .then((leaguesCountries) => setLeaguesCountries(leaguesCountries))
    .catch((error) => console.error(error))

    fetchFavoriteLeagues(apiHost)
      .then((leagues) => setLeagues(leagues))
      .catch((error) => console.error(error))

  }, [])
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header currentRequests={0} limitDay={0} /> 
      <Sidebar />

      <Box sx={{ flexGrow: 1, p: 3 }} >        
        { 
          //leaguesCountries && <pre>{JSON.stringify(leaguesCountries, null, 2)}</pre> 
        }
      </Box>
    </Box>
  )
}

export default App

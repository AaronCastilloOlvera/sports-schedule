import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material';
import Header from './Header';
import './App.css';
import { fetchFavoriteLeagues } from './api';
import Sidebar from './Sidebar';
import { Box, Drawer, List, ListItemButton, ListItemText } from "@mui/material";

function App() {
  const [leagues, setLeagues] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL, VITE_API_HOST: apiHost } = import.meta.env;
  
  useEffect(() => {
    fetchFavoriteLeagues(apiHost)
    .then((leagues) => setLeagues(leagues))
    .catch((error) => console.error(error))
  }, [])
  return (
    
    <Box sx={{ display: 'flex' }}>
      <Header currentRequests={0} limitDay={0} /> 
      <Sidebar />

      <Box sx={{ flexGrow: 1, p: 3 }} >
        <List>
          {leagues && leagues.response && leagues.response.map((item, index) => (
            <ListItemButton key={index} sx={{ display: 'flex', alignItems: 'center' }}>
              {item.logo && (
                <Box
                  component="img"
                  src={item.logo}
                  alt={item.name}
                  sx={{ width: 60, height: 60, objectFit: 'contain', marginRight: 2 }}
                />
              )}
              <ListItemText primary={item.name} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default App

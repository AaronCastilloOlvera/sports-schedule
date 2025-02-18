import React, { useEffect, useState } from 'react'
import { Box, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import Header from './Header';
import './App.css';
import { fetchStatus, fetchLeagues, fetchFavoriteLeagues } from './api';

function App() {
  const [data, setData] = useState(null)
  const [leagues, setLeagues] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL, VITE_API_HOST: apiHost } = import.meta.env;
  
  useEffect(() => {
    /*
    fetchLeagues(apiHost)
      .then((leagues) => setLeagues(leagues))
      .catch((error) => console.error(error))
    */
    
      fetchFavoriteLeagues(apiHost)
      .then((leagues) => setLeagues(leagues))
      .catch((error) => console.error(error))
  
    fetchStatus(apiKey, apiURL)
      .then((data) => setData(data))
      .catch((error) => console.error(error))
  }, [])

  if (!data) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  const currentRequests = data.response.requests.current;
  const limitDay = data.response.requests.limit_day;

  return (
    <React.Fragment>
      <Header currentRequests={currentRequests} limitDay={limitDay} /> 
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h6">
          Leagues
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>League Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Logo</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Country Code</TableCell>
                <TableCell>Country Flag</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leagues && leagues.response.map((item) => (
                <TableRow key={item.league.id}>
                  <TableCell>{item.league.name}</TableCell>
                  <TableCell>{item.league.type}</TableCell>
                  <TableCell>
                    <img src={item.league.logo} alt={item.name} width="50" />
                  </TableCell>
                  <TableCell>{item.country.name}</TableCell>
                  <TableCell>{item.country.code}</TableCell>
                  <TableCell>
                    {item.country.flag ? (
                      <img src={item.country.flag} alt={item.country.name} width="50" />
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      { leagues && <pre>{JSON.stringify(leagues, null, 2)}</pre> }
    </React.Fragment>
  )
}

export default App

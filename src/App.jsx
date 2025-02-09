import { useEffect, useState } from 'react'
import { Box, LinearProgress, Typography } from '@mui/material';
import Header from './Header';
import './App.css';
import { fetchStatus } from './api';

function App() {
  const [data, setData] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL } = import.meta.env;

  useEffect(() => {
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
    <>
      <Header currentRequests={currentRequests} limitDay={limitDay} />
      {
       // data && <pre>{JSON.stringify(data, null, 2)}</pre>
      }
    </>
  )
}

export default App

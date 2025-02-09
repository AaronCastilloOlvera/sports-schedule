import { useEffect, useState } from 'react'
import { Box, LinearProgress, Typography } from '@mui/material';
import Header from './Header';
import './App.css';

function App() {
  const [data, setData] = useState(null)
  const { VITE_API_KEY: apiKey, VITE_API_URL: apiURL } = import.meta.env;

  useEffect(() => {
    var myHeaders = new Headers();
    myHeaders.append("x-rapidapi-key", apiKey);
    myHeaders.append("x-rapidapi-host", apiURL);

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    fetch(`https://${apiURL}/status`, requestOptions)
      .then(response => response.json())
      .then(result => setData(result))
      .catch(error => console.log('error', error));
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

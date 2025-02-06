import { useEffect, useState } from 'react'
import { AppBar, Toolbar, Typography } from '@mui/material';

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

    fetch(`https://${apiURL}/leagues`, requestOptions)
      .then(response => response.json())
      .then(result => setData(result))
      .catch(error => console.log('error', error));
  }, [])

  const Header = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6">Sports Schedule</Typography>
            </Toolbar>
        </AppBar>
    );
};

  return (
      <>
        <Header />
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </>
  )
}

export default App

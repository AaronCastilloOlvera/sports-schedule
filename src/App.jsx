import { useEffect, useState } from 'react'
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';

function App() {
  const [data, setData] = useState(null)

  useEffect(() => {
    var myHeaders = new Headers();
    myHeaders.append("x-rapidapi-key", "510d14a176b8062557cfa86f735abf14");
    myHeaders.append("x-rapidapi-host", "v3.football.api-sports.io");

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow'
    };

    fetch("https://v3.football.api-sports.io/leagues", requestOptions)
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

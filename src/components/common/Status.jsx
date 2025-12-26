import { useEffect, useState }  from 'react';
import { Typography } from "@mui/material";
import { fetchStatus } from './../../api/api.js';

const Status = () => {  
  const [status, setStatus] = useState(null);
  const { VITE_API_KEY: apiKey,  VITE_API_URL: apiURL } = import.meta.env;

  useEffect(() => {
    fetchStatus(apiKey, apiURL)
      .then((status) => setStatus(status))
      .catch((error) => console.error(error))
  }, [apiKey, apiURL]);

  if (!status || !status === '') {
    return <Typography variant="body1">Loading...</Typography>;
  }

  const currentRequests = status.response.requests?.current;
  const limitDay = status.response.requests?.limit_day;

  return(
    <Typography variant="body1"> Requests: {currentRequests} / {limitDay} </Typography>
  );
};

export default Status;
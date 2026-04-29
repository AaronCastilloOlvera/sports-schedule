import { useEffect, useState, useCallback }  from 'react';
import { Typography, IconButton, Tooltip } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { apiClient } from '../../api/api';

const Status = () => {
  const [status, setStatus] = useState(null);

  const loadUsage = useCallback(() => {
    setStatus(null);
    apiClient.fetchUsage()
      .then((status) => setStatus(status))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => { loadUsage(); }, [loadUsage]);

  const currentRequests = status?.current;
  const limitDay = status?.limit_day;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Typography variant="body1">
        Requests: {status ? `${currentRequests} / ${limitDay}` : 'Loading...'}
      </Typography>
      <Tooltip title="Refresh usage">
        <IconButton size="small" onClick={loadUsage}>
          <RefreshIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </span>
  );
};

export default Status;
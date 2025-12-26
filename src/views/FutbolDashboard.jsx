import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tab, Tabs }  from '@mui/material';
import Fixtures from '../components/Futbol/Fixtures';
import LeagueSelector from '../components/Futbol/LeagueSelector';

const Predictions = () => <div>Análisis de la Supercoppa con IA...</div>;

function FutbolTab(props) {
  const { children, value, index } = props;

  return (
    <Box
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{
        width: '100%',
        transition: 'all 0.3s ease',
      }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

export default function FutbolDashboard() {
  const [tabValue, setTabValue] = useState(0);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleChange}>
          <Tab label="En Vivo" />
          <Tab label="Mis Ligas" />
          <Tab label="Control" />
        </Tabs>
      </Box>
      
      <FutbolTab value={tabValue} index={0}>
        <Fixtures />
      </FutbolTab>
      
      <FutbolTab value={tabValue} index={1}>
        <LeagueSelector />
      </FutbolTab>
      
      <FutbolTab value={tabValue} index={2}>
        <Predictions />
      </FutbolTab>
    </Box>
  );
}

FutbolTab.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

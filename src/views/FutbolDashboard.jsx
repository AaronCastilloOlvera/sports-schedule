import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Tab, Tabs }  from '@mui/material';
import Fixtures from '../components/Futbol/Fixtures';
import Leagues from '../components/Futbol/Leagues';
import Bets from '../components/Futbol/Bets';

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
        boxSizing: 'border-box'
      }}
    >
      {value === index && (
        <Box sx={{ p: { xs: 1, md: 3 }, width: '100%', boxSizing: 'border-box', overflowX: 'auto' }}>
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
    <Box sx={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="En Vivo" />
          <Tab label="Mis Ligas" />
          <Tab label="Control" />
        </Tabs>
      </Box>
      
      <FutbolTab value={tabValue} index={0}>
        <Fixtures />
      </FutbolTab>
      
      <FutbolTab value={tabValue} index={1}>
        <Leagues />
      </FutbolTab>
      
      <FutbolTab value={tabValue} index={2}>
        <Bets />
      </FutbolTab>
    </Box>
  );
}

FutbolTab.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
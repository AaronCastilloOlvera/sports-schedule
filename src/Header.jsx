import React, { useState } from "react";
import { AppBar, Badge, Box, Tab, Tabs, Toolbar, Typography } from "@mui/material"; 
import { SportsSoccer, SportsBasketball, SportsBaseball, SportsFootball, NightsStay } from "@mui/icons-material";

const Header = ({ currentRequests, limitDay }) => {
  const [value, setValue] = useState(0);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">Sports Schedule</Typography>
        
        <Box sx={{ flexGrow: 1 }}/>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Tabs
            value={value}
            onChange={(event, newValue) => setValue(newValue)}
            textColor="inherit"
            indicatorColor="secondary"
          >            
            <Tab icon={<SportsSoccer />} label="Soccer" iconPosition="start" />
            <Tab icon={<SportsBasketball />} label="Basketball" iconPosition="start" />
            <Tab icon={<SportsBaseball />} label="Baseball" iconPosition="start" />
            <Tab icon={<SportsFootball />} label="Football" iconPosition="start" />
          </Tabs>
        </Box>
                
        <Box sx={{ flexGrow: 1 }}/>
        <Typography variant="body1"> Requests: {currentRequests} / {limitDay} </Typography>
      </Toolbar>
    </AppBar>
    );
  };

export default Header;
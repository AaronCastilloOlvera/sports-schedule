import React from "react";
import { AppBar, Box, Toolbar, Typography } from "@mui/material"; 

const Header = ({ currentRequests, limitDay }) => {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Sports Schedule</Typography>
          <Box sx={{ flexGrow: 1 }}/>
          <Typography variant="body1"> Requests: {currentRequests} / {limitDay} </Typography>
        </Toolbar>
      </AppBar>
    );
  };

export default Header;
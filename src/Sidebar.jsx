import React, { use, useState, useEffect } from "react";
import { Avatar, Box, Drawer, List, ListItemAvatar, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { fetchFavoriteLeagues } from "./api";
const { VITE_API_HOST: apiHost } = import.meta.env;

const drawerWidth = 280;

const Sidebar = () => {
  
  const [data, setData] = useState(null);

  useEffect(() => { 
    fetchFavoriteLeagues(apiHost)
      .then((leagues) => setData(leagues))
      .catch((error) => console.error(error))
  }, []);

  return (
    <Drawer
      variant="permanent"
      anchor='left'
      open={true}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          marginTop: '90px',
        },
      }}
    >
      <List>
        { data && data.response.map((item, index) => (
            <ListItemButton key={index}>
              <Box
                component="img"
                src={item.league.logo}
                alt={item.league.name}
                sx={{ width: 60, height: 60, objectFit: 'contain', marginRight: 2 }}
              />
              <ListItemText primary={item.league.name} />
            </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;

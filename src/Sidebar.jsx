import React, { use, useState, useEffect } from "react";
import { Box, Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import { fetchFavoriteLeagues } from "./api";
const { VITE_API_HOST: apiHost } = import.meta.env;

const drawerWidth = 280;

const Sidebar = () => {
  
  const [data, setData] = useState(null);

  useEffect(() => { 
    fetchFavoriteLeagues(apiHost)
      .then((leagues) => {
        setData(leagues)
      })
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
          height: 'calc(100% - 90px)',
        },
      }}
    >
      <List>
        { data && data.response && data.response.map((item, index) => (
            <ListItemButton key={index}>
              <Box
                component="img"
                src={item.logo}
                alt={item.name}
                sx={{ width: 60, height: 60, objectFit: 'contain', marginRight: 2 }}
              />
              <ListItemText primary={item.name} />
            </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;

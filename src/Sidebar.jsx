import { useState, useEffect } from "react";
import { Box, Drawer, LinearProgress, List, ListItemButton, ListItemText } from "@mui/material";
import { apiClient } from "./api";

const drawerWidth = 280;

const Sidebar = () => {
  
  const [data, setData] = useState(null);

  useEffect(() => { 
    let mounted = true;
    
    apiClient.fetchFavoriteLeagues()
      .then((leagues) => {
        if (mounted) setData(leagues);
      })
      .catch((error) => console.error(error));
    
    return () => { mounted = false; };
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
        {data ? 
          data.map((item, index) => (
            <ListItemButton key={index} sx={{ display: 'flex', alignItems: 'center' }}>
              {item.logo && (
                <Box
                  component="img"
                  src={item.logo}
                  alt={item.name}
                  sx={{ width: 60, height: 60, objectFit: 'contain', marginRight: 2 }}
                />
              )}
              <ListItemText primary={item.name} />
            </ListItemButton>
          )) : 
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>}
      </List>
    </Drawer>
  );
};

export default Sidebar;

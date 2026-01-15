import { useState, useEffect } from 'react';
import { Box, TextField, List, ListItem, ListItemAvatar, LinearProgress, ListItemText, InputAdornment, Typography, IconButton } from '@mui/material';
import { apiClient } from '../../api/api';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

function Leagues() {

  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeagues = leagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    apiClient.fetchLeagues(leagues)
    .then((data) => {
      setLeagues(data);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching leagues:', error)
      setLoading(false);
    });

  }, []);

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  const handleToggleFavorite = async (e, league) => {
    e.stopPropagation();
    const newStatus = !league.is_favorite;
    const originalLeagues = [...leagues];

    setLeagues(prev => prev.map(l => l.id === league.id ? { ...l, is_favorite: newStatus } : l));

    try {
      await apiClient.updateLeague(league.id, newStatus);
    } catch (error) {
      console.error('Error updating favorite:', error);
      setLeagues(originalLeagues);
    }
  };

return (
  <Box sx={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
    
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Buscar liga o tipo (Cup, League)..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      sx={{ mb: 2 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />

    <List sx={{ 
      width: '100%', 
      bgcolor: 'background.paper',
      maxHeight: 400, 
      overflow: 'auto',
      borderRadius: 2,
      boxShadow: 1
    }}>
      {filteredLeagues.length > 0 ? (
        filteredLeagues.map((league) => (
          <ListItem
            key={league.id} 
            divider
            sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
            onClick={() => console.log("Seleccionada:", league.id)}
          >
            <ListItemAvatar>
              <Box 
                component="img" 
                src={league.logo} 
                alt={league.name} 
                sx={{  width: 50,  height: 50, objectFit: 'contain', display: 'block', flexShrink: 0 }} 
              />
            </ListItemAvatar>
            <ListItemText
              primary={league.name}
              secondary={`${league.type} - ID: ${league.id}`}
            />
            <IconButton onClick={(e) => handleToggleFavorite(e, league)}>
              {league.is_favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
            </IconButton>
          </ListItem>
        ))
      ) : (
        <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">
          Not leagues found.
        </Typography>
      )}
    </List>
  </Box>
  );
}

export default Leagues
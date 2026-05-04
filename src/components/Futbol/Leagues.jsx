import { useState, useEffect, useMemo } from 'react';
import { Box, TextField, List, ListItem, ListItemAvatar, LinearProgress, ListItemText, InputAdornment, Typography, IconButton } from '@mui/material';
import { apiClient } from '../../api/api';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

function Leagues() {
  const { t } = useTranslation();
  const [leagues, setLeagues]                     = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [searchTerm, setSearchTerm]               = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    apiClient.fetchLeagues()
      .then(data => {
        setLeagues(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching leagues:', error);
        setLoading(false);
      });
  }, []);

  const filteredLeagues = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return leagues.filter(league => {
      const matchesSearch   = league.name.toLowerCase().includes(query) ||
                              league.type.toLowerCase().includes(query);
      const matchesFavorite = !showFavoritesOnly || league.is_favorite;
      return matchesSearch && matchesFavorite;
    });
  }, [leagues, searchTerm, showFavoritesOnly]);

  const handleToggleFavorite = async (e, league) => {
    e.stopPropagation();
    const newStatus       = !league.is_favorite;
    const originalLeagues = [...leagues];
    setLeagues(prev => prev.map(l => l.id === league.id ? { ...l, is_favorite: newStatus } : l));
    try {
      await apiClient.updateLeague(league.id, newStatus);
    } catch (error) {
      console.error('Error updating favorite:', error);
      setLeagues(originalLeagues);
    }
  };

  if (loading) {
    return <Box sx={{ width: '100%' }}><LinearProgress /></Box>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>

      {/* Search bar + favourites toggle */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('leagues.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <IconButton
          onClick={() => setShowFavoritesOnly(prev => !prev)}
          color={showFavoritesOnly ? 'warning' : 'default'}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5 }}
        >
          {showFavoritesOnly ? <StarIcon /> : <StarBorderIcon />}
        </IconButton>
      </Box>

      {filteredLeagues.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">
          {t('leagues.notFound')}
        </Typography>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: 400, overflow: 'auto', borderRadius: 2, boxShadow: 1 }}>
          {filteredLeagues.map(league => (
            <ListItem
              key={league.id}
              divider
              sx={{ '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' } }}
              onClick={() => console.log('Seleccionada:', league.id)}
            >
              <ListItemAvatar>
                <Box
                  component="img"
                  src={league.logo}
                  alt={league.name}
                  sx={{ width: 50, height: 50, objectFit: 'contain', display: 'block', flexShrink: 0 }}
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
          ))}
        </List>
      )}
    </Box>
  );
}

export default Leagues;

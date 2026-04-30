import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, InputAdornment, Stack, Tab, Tabs, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ChevronLeft, ChevronRight, Close, Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import Fixtures from '../components/Futbol/Fixtures';
import Leagues from '../components/Futbol/Leagues';
import Bets from '../components/Futbol/Bets';

function FutbolTab({ children, value, index }) {
  return (
    <Box
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ width: '100%', transition: 'all 0.3s ease', boxSizing: 'border-box' }}
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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hasLiveMatches, setHasLiveMatches] = useState(false);
  const { t } = useTranslation();

  const handleTabChange = (_, newValue) => setTabValue(newValue);
  const handlePreviousDay = () => setSelectedDate(prev => prev.subtract(1, 'day'));
  const handleNextDay = () => setSelectedDate(prev => prev.add(1, 'day'));

  const handleSearchClose = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  // Collapse only when focus leaves the entire search area AND no text is active.
  const handleSearchBlur = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (!searchTerm) setIsSearchOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

        {/* ── Row 1: Navigation ───────────────────────────────────────────────── */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label={
              <Stack direction="row" alignItems="center" spacing={1}>
                {hasLiveMatches && (
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: 'error.main',
                    animation: 'livePulse 1.5s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                )}
                <span>{t('tabs.live')}</span>
              </Stack>
            } />
            <Tab label={t('tabs.myLeagues')} />
            <Tab label={t('tabs.control')} />
          </Tabs>
        </Box>

        {/* ── Row 2: Filter bar (Fixtures tab only) ───────────────────────────── */}
        {tabValue === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: { sm: 'space-between' },
              gap: 2,
              backgroundColor: 'background.paper',
              px: { xs: 1, sm: 2 },
              mt: 2,
              mb: 1,
            }}
          >
            {/* Date navigator — far LEFT */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton onClick={handlePreviousDay} size="small" color="primary">
                <ChevronLeft />
              </IconButton>
              <DatePicker
                label={t('fixtures.selectDate')}
                value={selectedDate}
                onChange={newValue => setSelectedDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: 'small',
                    readOnly: true,
                    sx: { minWidth: 180, width: { xs: '100%', sm: 'auto' } },
                  },
                }}
              />
              <IconButton onClick={handleNextDay} size="small" color="primary">
                <ChevronRight />
              </IconButton>
            </Box>

            {/* Search — far RIGHT (expandable) */}
            <Box
              onBlur={handleSearchBlur}
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexGrow: isSearchOpen ? 1 : 0,
                transition: 'flex-grow 0.25s ease',
                overflow: 'hidden',
              }}
            >
              {isSearchOpen ? (
                <TextField
                  autoFocus
                  size="small"
                  placeholder="Search teams…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleSearchClose}>
                            <Close fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    width: '100%',
                    '@keyframes slideIn': {
                      from: { opacity: 0, transform: 'translateX(8px)' },
                      to:   { opacity: 1, transform: 'translateX(0)' },
                    },
                    animation: 'slideIn 0.2s ease',
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper',
                      color: 'text.primary',
                      '& fieldset': { borderColor: 'divider' },
                      '&:hover fieldset': { borderColor: 'text.secondary' },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'text.secondary',
                      opacity: 1,
                    },
                  }}
                />
              ) : (
                <IconButton
                  onClick={() => setIsSearchOpen(true)}
                  color={searchTerm ? 'primary' : 'default'}
                >
                  <Search />
                </IconButton>
              )}
            </Box>
          </Box>
        )}

        {/* ── Tab panels ──────────────────────────────────────────────────────── */}
        <FutbolTab value={tabValue} index={0}>
          <Fixtures selectedDate={selectedDate} searchTerm={searchTerm} onLiveChange={setHasLiveMatches} />
        </FutbolTab>

        <FutbolTab value={tabValue} index={1}>
          <Leagues />
        </FutbolTab>

        <FutbolTab value={tabValue} index={2}>
          <Bets />
        </FutbolTab>

      </Box>
    </LocalizationProvider>
  );
}

FutbolTab.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

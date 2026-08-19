import { useState } from "react";
import PropTypes from 'prop-types';
import {
  AppBar, Box, Button, Dialog, DialogContent, DialogTitle, Drawer, IconButton,
  List, ListItemButton, ListItemText, Popover, Switch,
  Tab, Tabs, Toolbar, Tooltip, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import {
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  Home as HomeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import Leagues from '../Futbol/Leagues.jsx';
import { useTranslation } from "react-i18next";
import { useThemeMode } from "../../context/ThemeContext.jsx";
import Status from "./../common/Status.jsx";

// ── helpers ──────────────────────────────────────────────────────────────────

// Uses MUI theme tokens so these automatically adapt to light / dark mode.
const SECTION_LABEL_SX = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.6px',
  textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: '8px',
};

const DIVIDER_SX = {
  height: '0.5px', bgcolor: 'divider', my: '16px',
};

const LANG_OPTIONS = [
  { code: 'en', label: 'EN', flag: '🇺🇸' },
  { code: 'es', label: 'ES', flag: '🇲🇽' },
];

// ── component ─────────────────────────────────────────────────────────────────

const Header = ({ activeSection = 'home', onSectionChange }) => {
  const [anchor, setAnchor] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const open = Boolean(anchor);

  const SECTIONS = [
    { value: 'home',    label: t('tabs.home'),    icon: <HomeIcon fontSize="small" /> },
    { value: 'control', label: t('tabs.control'), icon: <ShowChartIcon fontSize="small" /> },
  ];

  const handleRefreshLeagues = () => {
    window.dispatchEvent(new CustomEvent('refresh-leagues'));
    setAnchor(null);
  };

  const handleMobileNavClick = (value) => {
    onSectionChange?.(value);
    setMobileNavOpen(false);
  };

  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* ── hamburger — mobile only ── */}
        <IconButton
          color="inherit"
          onClick={() => setMobileNavOpen(true)}
          aria-label="open navigation menu"
          sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6">🔥 HotPicks365</Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Tabs
            value={activeSection}
            onChange={(_, v) => onSectionChange?.(v)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            {SECTIONS.map(section => (
              <Tab key={section.value} value={section.value} label={section.label} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* ── gear icon ── */}
        <Tooltip title="Settings">
          <IconButton
            color="inherit"
            onClick={(e) => setAnchor(e.currentTarget)}
            aria-label="open settings"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>

        {/* ── settings popover ── */}
        <Popover
          open={open}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              mt: '8px',
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)',
              minWidth: 230,
            },
          }}
        >
          <Box sx={{ p: '16px' }}>

            {/* ── my leagues ── */}
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<StarIcon sx={{ color: '#f59e0b' }} />}
              onClick={() => { setAnchor(null); setLeaguesOpen(true); }}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: 13,
                borderColor: 'divider',
                color: 'text.primary',
                justifyContent: 'flex-start',
                mb: '16px',
                '&:hover': { borderColor: 'text.disabled', bgcolor: 'action.hover' },
              }}
            >
              My Leagues
            </Button>

            {/* ── language ── */}
            <Typography sx={SECTION_LABEL_SX}>Language</Typography>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              {LANG_OPTIONS.map(lang => {
                const active = i18n.language.startsWith(lang.code);
                return (
                  <Box
                    key={lang.code}
                    component="button"
                    onClick={() => i18n.changeLanguage(lang.code)}
                    sx={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px',
                      py: '7px', px: '10px',
                      border: '1.5px solid',
                      borderColor: active ? 'primary.main' : 'divider',
                      borderRadius: '8px',
                      bgcolor: active ? 'primary.main' : 'transparent',
                      // bgColor alpha handled via sx opacity workaround below
                      background: active ? 'rgba(25,118,210,0.1)' : 'transparent',
                      color: active ? 'primary.main' : 'text.primary',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        background: active ? 'rgba(25,118,210,0.16)' : 'action.hover',
                      },
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{lang.flag}</span>
                    {lang.label}
                  </Box>
                );
              })}
            </Box>

            <Box sx={DIVIDER_SX} />

            {/* ── api usage ── */}
            <Typography sx={SECTION_LABEL_SX}>API Usage</Typography>
            <Status />

            <Box sx={DIVIDER_SX} />

            {/* ── dark mode ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mode === 'dark'
                  ? <DarkModeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  : <LightModeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                }
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', lineHeight: 1.2 }}>
                  Dark Mode
                </Typography>
              </Box>
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
                size="small"
              />
            </Box>

            <Box sx={DIVIDER_SX} />

            {/* ── developer tools ── */}
            <Typography sx={SECTION_LABEL_SX}>Developer</Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefreshLeagues}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: 13,
                borderColor: 'divider',
                color: 'text.primary',
                justifyContent: 'flex-start',
                '&:hover': {
                  borderColor: 'text.disabled',
                  bgcolor: 'action.hover',
                },
              }}
            >
              Refresh Leagues
            </Button>

          </Box>
        </Popover>

        {/* ── my leagues dialog ── */}
        <Dialog
          open={leaguesOpen}
          onClose={() => setLeaguesOpen(false)}
          fullScreen={isMobile}
          fullWidth
          maxWidth="sm"
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
              My Leagues
            </Box>
            <IconButton size="small" onClick={() => setLeaguesOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 0 }}>
            <Leagues />
          </DialogContent>
        </Dialog>

        {/* ── mobile nav drawer ── */}
        <Drawer
          anchor="left"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          PaperProps={{ sx: { width: 270, display: 'flex', flexDirection: 'column' } }}
        >
          {/* header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
              🔥 HotPicks365
            </Typography>
            <IconButton size="small" onClick={() => setMobileNavOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2 }} />

          {/* main nav */}
          <List sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
            {SECTIONS.map(({ value, label, icon }) => {
              const active = activeSection === value;
              return (
                <ListItemButton
                  key={value}
                  onClick={() => handleMobileNavClick(value)}
                  sx={{
                    borderRadius: '10px',
                    mb: 0.5,
                    px: 1.5,
                    bgcolor: active ? 'primary.main' : 'transparent',
                    color: active ? 'primary.contrastText' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? 'primary.dark' : 'action.hover',
                    },
                    '& .MuiListItemText-primary': {
                      fontWeight: active ? 700 : 500,
                      fontSize: 15,
                    },
                  }}
                >
                  <Box sx={{ mr: 1.5, display: 'flex', opacity: active ? 1 : 0.6 }}>{icon}</Box>
                  <ListItemText primary={label} />
                </ListItemButton>
              );
            })}
          </List>

          <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2, my: 1 }} />

          {/* secondary: my leagues */}
          <List sx={{ px: 1.5, py: 0 }}>
            <ListItemButton
              onClick={() => { setMobileNavOpen(false); setLeaguesOpen(true); }}
              sx={{ borderRadius: '10px', px: 1.5, '& .MuiListItemText-primary': { fontSize: 15, fontWeight: 500 } }}
            >
              <Box sx={{ mr: 1.5, display: 'flex', color: '#f59e0b' }}><StarIcon fontSize="small" /></Box>
              <ListItemText primary="My Leagues" />
            </ListItemButton>
          </List>

          {/* spacer */}
          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ height: '1px', bgcolor: 'divider', mx: 2 }} />

          {/* quick settings footer */}
          <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {mode === 'dark'
                ? <DarkModeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                : <LightModeIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>Dark mode</Typography>
            </Box>
            <Switch checked={mode === 'dark'} onChange={toggleTheme} size="small" />
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  activeSection: PropTypes.string,
  onSectionChange: PropTypes.func,
};

export default Header;

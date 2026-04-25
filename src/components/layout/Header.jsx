import { useState } from "react";
import {
  AppBar, Box, Button, IconButton, Popover, Switch,
  Tab, Tabs, Toolbar, Tooltip, Typography,
} from "@mui/material";
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  SportsSoccer, SportsBasketball, SportsBaseball, SportsFootball,
} from "@mui/icons-material";
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

const Header = () => {
  const [tab, setTab] = useState(0);
  const [anchor, setAnchor] = useState(null);
  const { i18n } = useTranslation();
  const { mode, toggleTheme } = useThemeMode();

  const open = Boolean(anchor);

  const handleRefreshLeagues = () => {
    window.dispatchEvent(new CustomEvent('refresh-leagues'));
    setAnchor(null);
  };

  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Typography variant="h6">🔥 HotPicks365</Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab icon={<SportsSoccer />}     label="Soccer"     iconPosition="start" />
            <Tab icon={<SportsBasketball />} label="Basketball" iconPosition="start" />
            <Tab icon={<SportsBaseball />}   label="Baseball"   iconPosition="start" />
            <Tab icon={<SportsFootball />}   label="Football"   iconPosition="start" />
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
      </Toolbar>
    </AppBar>
  );
};

export default Header;

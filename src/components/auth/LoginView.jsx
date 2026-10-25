import { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/api.js';
import { setToken } from '../../auth/session.js';

const ERROR_KEYS = { 401: 'auth.invalid', 429: 'auth.tooMany', 503: 'auth.notConfigured' };

function LoginView({ onLogin }) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await apiClient.login(username.trim(), password);
      setToken(access_token);
      onLogin();
    } catch (err) {
      setError(t(ERROR_KEYS[err.response?.status] ?? 'auth.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 4, width: '100%', maxWidth: 360, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>🔥 HotPicks365</Typography>
            <Typography variant="body2" color="text.secondary">{t('auth.subtitle')}</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('auth.username')} value={username} onChange={(e) => setUsername(e.target.value)}
            autoComplete="username" autoFocus required fullWidth size="small"
          />
          <TextField
            label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password" required fullWidth size="small"
          />
          <Button type="submit" variant="contained" disabled={loading || !username.trim() || !password} fullWidth>
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

LoginView.propTypes = { onLogin: PropTypes.func.isRequired };

export default LoginView;

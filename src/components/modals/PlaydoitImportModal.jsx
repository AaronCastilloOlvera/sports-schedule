import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import PropTypes from "prop-types";
import { apiClient } from "../../api/api.js";

const MX_OFFSET_MS = 6 * 3600 * 1000;

function decodeTokenExp(token) {
  try {
    const payload = token.trim().split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const data = JSON.parse(atob(padded));
    return data.exp ? new Date(data.exp * 1000) : null;
  } catch {
    return null;
  }
}

function todayMx() {
  return new Date(Date.now() - MX_OFFSET_MS).toISOString().slice(0, 10);
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00-06:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayRangeUtc(dateStr) {
  const from = new Date(`${dateStr}T00:00:00-06:00`);
  const to = new Date(from.getTime() + 24 * 3600 * 1000 - 1);
  return { date_from: from.toISOString(), date_to: to.toISOString() };
}

function PlaydoitImportModal({ open, onClose, onImported }) {
  const [token, setToken] = useState('');
  const [date, setDate] = useState(todayMx());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const expDate = useMemo(() => decodeTokenExp(token), [token]);
  const expired = expDate ? expDate.getTime() < Date.now() : false;
  const minutesLeft = expDate ? Math.round((expDate.getTime() - Date.now()) / 60000) : null;

  const runImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { date_from, date_to } = dayRangeUtc(date);
      const data = await apiClient.importPlaydoit(token.trim(), date_from, date_to, false);
      setResult(data);
      if (data.imported > 0 || data.updated > 0) onImported();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo importar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Importar de Playdoit</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Token" value={token} onChange={(e) => setToken(e.target.value)}
            multiline minRows={2} fullWidth size="small" placeholder="eyJhbGci..."
          />
          {expDate && (
            <Typography variant="caption" color={expired ? 'error' : 'text.secondary'}>
              {expired ? 'Token vencido' : `Expira en ~${minutesLeft} min`}
            </Typography>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="small" onClick={() => setDate((d) => shiftDate(d, -1))}>
              <ChevronLeft />
            </IconButton>
            <TextField
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }}
            />
            <IconButton size="small" onClick={() => setDate((d) => shiftDate(d, 1))}>
              <ChevronRight />
            </IconButton>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {result && (
            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5 }}>
              <Typography variant="body2">
                Encontrados: {result.found} &nbsp;·&nbsp; Importados: {result.imported} &nbsp;·&nbsp;
                Actualizados: {result.updated} &nbsp;·&nbsp; Sin cambio: {result.skipped_final} &nbsp;·&nbsp;
                Fallidos: {result.failed}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Cerrar</Button>
        <Button variant="contained" onClick={runImport} disabled={loading || !token.trim() || expired}>
          {loading ? 'Importando...' : 'Importar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PlaydoitImportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImported: PropTypes.func.isRequired,
};

export default PlaydoitImportModal;

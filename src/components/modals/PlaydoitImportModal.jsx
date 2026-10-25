import { useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Stack, TextField, Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import PropTypes from "prop-types";
import { apiClient } from "../../api/api.js";
import { getAllBets, getBetDetail, PlaydoitError } from "../../api/playdoit.js";

const MX_OFFSET_MS = 6 * 3600 * 1000;
// Courtesy pause between detail calls so an import never hammers Playdoit's API.
const DETAIL_COOLDOWN_MS = 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The browser's Authorization header reads "Bearer eyJ..."; getAllBets adds its own prefix.
const cleanToken = (token) => token.trim().replace(/^Bearer\s+/i, '');
const isAuthError = (err) => err instanceof PlaydoitError && (err.status === 401 || err.status === 403);

function importErrorMessage(err) {
  if (isAuthError(err)) return 'Playdoit rechazó el token: puede estar vencido.';
  if (err instanceof PlaydoitError) return `Playdoit respondió con un error (${err.status}).`;
  if (err instanceof TypeError) return 'No se pudo conectar con Playdoit.'; // fetch network failure
  return err.response?.data?.detail || 'No se pudo importar.';
}

function decodeTokenExp(token) {
  try {
    const payload = cleanToken(token).split('.')[1];
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
  const [progress, setProgress] = useState('');

  const expDate = useMemo(() => decodeTokenExp(token), [token]);
  const expired = expDate ? expDate.getTime() < Date.now() : false;
  const minutesLeft = expDate ? Math.round((expDate.getTime() - Date.now()) / 60000) : null;

  // 1) history from Playdoit  2) backend says which bets need their detail
  // 3) details from Playdoit, one by one with a pause  4) backend maps and saves them
  const runImport = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    const playdoitToken = cleanToken(token);
    try {
      const { date_from, date_to } = dayRangeUtc(date);
      setProgress('Consultando historial de Playdoit...');
      const history = await getAllBets(playdoitToken, date_from, date_to);
      const pending = history.length ? await apiClient.playdoitPending(history.map((b) => b.id)) : [];

      const details = [];
      let fetchFailed = 0;
      for (const [i, betId] of pending.entries()) {
        if (i > 0) await sleep(DETAIL_COOLDOWN_MS);
        setProgress(`Obteniendo detalle ${i + 1} de ${pending.length}...`);
        try {
          details.push(await getBetDetail(playdoitToken, betId));
        } catch (err) {
          if (isAuthError(err)) throw err; // token died mid-import: stop, don't count every bet as failed
          fetchFailed++;
        }
      }

      setProgress('Guardando...');
      const saved = details.length
        ? await apiClient.importPlaydoit(details)
        : { imported: 0, updated: 0, skipped_final: 0, failed: 0 };
      setResult({
        found: history.length,
        imported: saved.imported,
        updated: saved.updated,
        skipped_final: history.length - pending.length + saved.skipped_final,
        failed: saved.failed + fetchFailed,
      });
      if (saved.imported > 0 || saved.updated > 0) onImported();
    } catch (err) {
      setError(importErrorMessage(err));
    } finally {
      setLoading(false);
      setProgress('');
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

          {progress && <Typography variant="body2" color="text.secondary">{progress}</Typography>}

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

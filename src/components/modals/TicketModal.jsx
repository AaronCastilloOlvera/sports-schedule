import { useCallback, useEffect, useState } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, MenuItem, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { BET_TYPES, SPORT_TYPES, STATUS, DEVICE_TYPES } from "../../utils/consts.jsx";
import PropTypes from "prop-types";

const americanToDecimal = (val) => {
  const v = parseFloat(val);
  if (!val || isNaN(v) || v === 0) return null;
  return v > 0
    ? ((v / 100) + 1).toFixed(2)
    : ((100 / Math.abs(v)) + 1).toFixed(2);
};

function CurrencyField({ label, name, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const numValue = parseFloat(value);
  const displayValue = focused
    ? (value ?? '')
    : (isNaN(numValue) ? '' : numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <TextField
      label={label}
      value={displayValue}
      fullWidth
      size="small"
      inputMode="decimal"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange({ target: { name, value: e.target.value.replace(/[^0-9.-]/g, '') } })}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
    />
  );
}

CurrencyField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

function TicketModal({ openModal, setOpenModal, currentTicket, handleChange, handleSubmit, setFile, file }) {
  const [tab, setTab] = useState(0);
  const isEdit = Boolean(currentTicket.ticket_id);

  useEffect(() => {
    if (openModal) setTab(0);
  }, [openModal]);

  const handlePaste = useCallback((event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        setFile(new File([blob], "pasted-image.png", { type: blob.type }));
        break;
      }
    }
  }, [setFile]);

  useEffect(() => {
    if (openModal) window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [openModal, handlePaste]);

  return (
    <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>{isEdit ? 'Edit Ticket' : 'Add Ticket'}</DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider', px: 0 }}>
        <Tab label="Bet" />
        <Tab label="Result" />
        <Tab label="Extra" />
      </Tabs>

      <DialogContent sx={{ minHeight: 300, pt: 2 }}>
        {tab === 0 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField select label="Sport" name="sport" value={currentTicket.sport} fullWidth size="small" onChange={handleChange}>
                {SPORT_TYPES.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField select label="Bet Type" name="bet_type" value={currentTicket.bet_type} fullWidth size="small" onChange={handleChange}>
                {BET_TYPES.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="League" name="league" value={currentTicket.league} fullWidth size="small" onChange={handleChange} />
              <TextField
                label="Match Date" name="match_datetime" type="datetime-local"
                value={currentTicket.match_datetime} fullWidth size="small"
                onChange={handleChange} InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField label="Match Name" name="match_name" value={currentTicket.match_name} placeholder="Chivas vs América" fullWidth size="small" onChange={handleChange} />
            <TextField label="Pick" name="pick" value={currentTicket.pick} placeholder="Over 2.5, Chivas gana..." fullWidth size="small" onChange={handleChange} />
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField label="Odds" name="odds" type="number" value={currentTicket.odds} fullWidth size="small" onChange={handleChange} />
              <Tooltip title="Convertir de momio americano a decimal">
                <IconButton
                  size="small"
                  onClick={() => {
                    const converted = americanToDecimal(currentTicket.odds);
                    if (converted) handleChange({ target: { name: 'odds', value: converted } });
                  }}
                >
                  <SwapHoriz fontSize="small" />
                </IconButton>
              </Tooltip>
              <CurrencyField label="Stake" name="stake" value={currentTicket.stake} onChange={handleChange} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <CurrencyField label="Payout" name="payout" value={currentTicket.payout} onChange={handleChange} />
              <CurrencyField label="Net Profit" name="net_profit" value={currentTicket.net_profit} onChange={handleChange} />
            </Stack>
            <TextField select label="Status" name="status" value={currentTicket.status} fullWidth size="small" onChange={handleChange}>
              {STATUS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={2}>
            <TextField label="Ticket ID" name="ticket_id" value={currentTicket.ticket_id} fullWidth size="small" onChange={handleChange} />
            <TextField select label="Device Type" name="device_type" value={currentTicket.device_type} fullWidth size="small" onChange={handleChange}>
              {DEVICE_TYPES.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>
            <FormControlLabel
              control={<Checkbox name="studied" checked={currentTicket.studied} onChange={handleChange} size="small" />}
              label="Studied"
            />
            <TextField label="Comments" name="comments" multiline rows={3} value={currentTicket.comments} fullWidth size="small" onChange={handleChange} />
            <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>TICKET IMAGE</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Paste from clipboard or select a file
              </Typography>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
              {file && (
                <Typography variant="caption" color="primary" display="block" sx={{ mt: 1 }}>
                  ✓ {file.name}
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={() => setOpenModal(false)} color="inherit">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} sx={{ flex: 1, py: 1, fontWeight: 'bold' }}>
          {isEdit ? 'Save Changes' : 'Save Ticket'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TicketModal.propTypes = {
  openModal: PropTypes.bool.isRequired,
  setOpenModal: PropTypes.func.isRequired,
  currentTicket: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  setFile: PropTypes.func.isRequired,
  file: PropTypes.object,
};

export default TicketModal;

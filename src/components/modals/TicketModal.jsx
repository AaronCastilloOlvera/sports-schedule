import { useCallback, useEffect, useState } from "react";
import {
  Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper,
  Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, AttachMoney, Cancel, CheckCircle, CompareArrows, Delete, Flag, HelpOutline, RadioButtonUnchecked, SportsSoccer, Square } from "@mui/icons-material";
import { BET_TYPES, SPORT_TYPES, STATUS, DEVICE_TYPES } from "../../utils/consts.jsx";
import { apiClient } from "../../api/api.js";
import PropTypes from "prop-types";

// ---------------------------------------------------------------------------
// Odds helpers
// ---------------------------------------------------------------------------
const americanToDecimal = (val) => {
  const v = parseFloat(val);
  if (!val || isNaN(v) || v === 0) return null;
  return v > 0
    ? ((v / 100) + 1).toFixed(2)
    : ((100 / Math.abs(v)) + 1).toFixed(2);
};

const decimalToAmerican = (val) => {
  const d = parseFloat(val);
  if (!d || isNaN(d) || d <= 1) return '';
  return d >= 2
    ? '+' + Math.round((d - 1) * 100)
    : String(Math.round(-100 / (d - 1)));
};

// ---------------------------------------------------------------------------
// Legs constants
// ---------------------------------------------------------------------------
const MARKET_OPTIONS = [
  { value: 'goals',     label: 'Goals' },
  { value: 'corners',   label: 'Corners' },
  { value: 'cards',     label: 'Cards' },
  { value: 'btts',      label: 'BTTS' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'other',     label: 'Other' },
];

const SIDE_BY_MARKET = {
  goals:     ['over', 'under'],
  corners:   ['over', 'under'],
  cards:     ['over', 'under'],
  btts:      ['yes', 'no'],
  moneyline: ['home', 'away'],
  other:     ['over', 'under', 'yes', 'no', 'home', 'away'],
};

const SIDE_LABEL = { over: 'Over', under: 'Under', yes: 'Yes', no: 'No', home: 'Home', away: 'Away' };
const MARKET_LABEL = { goals: 'Goals', corners: 'Corners', cards: 'Cards', btts: 'BTTS', moneyline: 'Moneyline', other: 'Other' };

const HAS_LINE = (market) => !['btts', 'moneyline'].includes(market);

const MARKET_ICON = {
  goals:     <SportsSoccer sx={{ fontSize: 18, color: '#4caf50' }} />,
  corners:   <Flag         sx={{ fontSize: 18, color: '#2196f3' }} />,
  cards:     <Square       sx={{ fontSize: 18, color: '#ffc107' }} />,
  btts:      <CompareArrows sx={{ fontSize: 18, color: '#9c27b0' }} />,
  moneyline: <AttachMoney  sx={{ fontSize: 18, color: '#00bcd4' }} />,
  other:     <HelpOutline  sx={{ fontSize: 18, color: '#9e9e9e' }} />,
};

const buildPick = (leg) => {
  const m = MARKET_LABEL[leg.market] || leg.market || '';
  const s = SIDE_LABEL[leg.side] || leg.side || '';
  const l = leg.line_used != null ? String(leg.line_used) : '';
  return [m, s, l].filter(Boolean).join(' ');
};

const defaultLeg = (ticket) => ({
  match_name: ticket.match_name || '',
  league: ticket.league || '',
  market: 'goals',
  side: 'over',
  line_used: null,
  pick: '',
  odd: null,
  outcome: null,
});

// ---------------------------------------------------------------------------
// CurrencyField
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// LegRow
// ---------------------------------------------------------------------------
function LegRow({ leg, index, isParlay, onUpdate, onDelete }) {
  const sides = SIDE_BY_MARKET[leg.market] || SIDE_BY_MARKET.other;
  const [rawOdds, setRawOdds] = useState('');
  const [oddsFocused, setOddsFocused] = useState(false);

  const handleOddsFocus = () => {
    setOddsFocused(true);
    setRawOdds(leg.odd != null ? String(leg.odd) : '');
  };
  const handleOddsChange = (e) => setRawOdds(e.target.value);
  const handleOddsBlur = () => {
    setOddsFocused(false);
    const v = parseFloat(rawOdds);
    if (isNaN(v) || v === 0) { onUpdate(index, 'odd', null); return; }
    const isAmerican = Math.abs(v) >= 100 && Number.isInteger(v);
    const decimal = parseFloat((isAmerican ? parseFloat(americanToDecimal(v)) : v).toFixed(2));
    onUpdate(index, 'odd', decimal);
  };
  const oddsDisplay = oddsFocused ? rawOdds : (leg.odd != null ? leg.odd.toFixed(2) : '');

  const cycleOutcome = () => {
    const next = leg.outcome === null ? true : leg.outcome === true ? false : null;
    onUpdate(index, 'outcome', next);
  };

  const handleMarketChange = (e) => {
    const market = e.target.value;
    const validSides = SIDE_BY_MARKET[market];
    const side = validSides.includes(leg.side) ? leg.side : validSides[0];
    onUpdate(index, 'market', market);
    onUpdate(index, 'side', side);
    if (!HAS_LINE(market)) onUpdate(index, 'line_used', null);
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, bgcolor: 'action.hover', borderColor: 'divider' }}
    >
      {isParlay && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small" sx={{ flex: 1 }} label="Match" value={leg.match_name || ''}
            onChange={(e) => onUpdate(index, 'match_name', e.target.value)}
          />
          <TextField
            size="small" label="Odds" value={oddsDisplay}
            onChange={handleOddsChange} onFocus={handleOddsFocus} onBlur={handleOddsBlur}
            sx={{ width: 86 }} placeholder="2.50"
          />
        </Stack>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {MARKET_ICON[leg.market] || MARKET_ICON.other}
        </Box>
        <TextField
          select size="small" label="Market" value={leg.market || 'goals'}
          onChange={handleMarketChange} sx={{ flex: 2 }}
        >
          {MARKET_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Side" value={leg.side || sides[0]}
          onChange={(e) => onUpdate(index, 'side', e.target.value)} sx={{ flex: 1.5 }}
        >
          {sides.map(s => <MenuItem key={s} value={s}>{SIDE_LABEL[s]}</MenuItem>)}
        </TextField>

        {HAS_LINE(leg.market) && (
          <TextField
            size="small" label="Line" type="number" value={leg.line_used ?? ''}
            onChange={(e) => onUpdate(index, 'line_used', e.target.value ? parseFloat(e.target.value) : null)}
            sx={{ width: 76 }}
          />
        )}


        <Tooltip title={leg.outcome === true ? 'Won' : leg.outcome === false ? 'Lost' : 'Pending'}>
          <IconButton size="small" onClick={cycleOutcome}
            sx={{ color: leg.outcome === true ? 'success.main' : leg.outcome === false ? 'error.main' : 'text.disabled' }}
          >
            {leg.outcome === true
              ? <CheckCircle fontSize="small" />
              : leg.outcome === false
                ? <Cancel fontSize="small" />
                : <RadioButtonUnchecked fontSize="small" />}
          </IconButton>
        </Tooltip>

        <IconButton size="small" color="error" onClick={() => onDelete(index)}>
          <Delete fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}

LegRow.propTypes = {
  leg: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isParlay: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

// ---------------------------------------------------------------------------
// TicketModal
// ---------------------------------------------------------------------------
function TicketModal({ openModal, setOpenModal, currentTicket, handleChange, handleSubmit, setFile, file }) {
  const [tab, setTab] = useState(0);
  const [leagueOptions, setLeagueOptions] = useState([]);
  const [americanOdds, setAmericanOdds] = useState('');
  const [legs, setLegs] = useState([]);
  const isEdit = Boolean(currentTicket.ticket_id);
  const hasLegs = ['parlay', 'crear_apuesta'].includes(currentTicket.bet_type);

  // Sync legs from parent when modal opens or ticket changes
  useEffect(() => {
    if (openModal) {
      setTab(0);
      setAmericanOdds(decimalToAmerican(currentTicket.odds));
      setLegs(Array.isArray(currentTicket.legs) ? currentTicket.legs : []);
    }
  }, [openModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push legs to parent + rebuild pick and match_name whenever legs change
  useEffect(() => {
    if (!hasLegs) return;
    const normalized = legs.map(leg => ({ ...leg, pick: buildPick(leg) }));
    const value = normalized.length > 0 ? normalized : null;
    handleChange({ target: { name: 'legs', value } });
    if (normalized.length > 0) {
      handleChange({ target: { name: 'pick', value: normalized.map(l => l.pick).join(' + ') } });
      if (currentTicket.bet_type === 'parlay') {
        const matchNames = [...new Set(normalized.map(l => l.match_name).filter(Boolean))];
        if (matchNames.length > 0)
          handleChange({ target: { name: 'match_name', value: matchNames.join(' | ') } });
      }
    }
  }, [legs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear legs when switching away from parlay/crear_apuesta
  useEffect(() => {
    if (!hasLegs) {
      setLegs([]);
      handleChange({ target: { name: 'legs', value: null } });
    }
  }, [currentTicket.bet_type]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLeg = (i, field, value) =>
    setLegs(prev => prev.map((l, j) => j === i ? { ...l, [field]: value } : l));

  const deleteLeg = (i) =>
    setLegs(prev => prev.filter((_, j) => j !== i));

  const addLeg = () =>
    setLegs(prev => [...prev, defaultLeg(currentTicket)]);

  const handleOddsChange = (e) => {
    handleChange(e);
    setAmericanOdds(decimalToAmerican(e.target.value));
  };

  const handleAmericanChange = (e) => {
    const val = e.target.value;
    setAmericanOdds(val);
    const decimal = americanToDecimal(val);
    if (decimal) handleChange({ target: { name: 'odds', value: decimal } });
  };

  useEffect(() => {
    if (!openModal || !currentTicket.sport) return;
    apiClient.fetchLeaguesBySport(currentTicket.sport)
      .then(setLeagueOptions)
      .catch(() => setLeagueOptions([]));
  }, [currentTicket.sport, openModal]);

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
              <Autocomplete
                freeSolo options={leagueOptions} value={currentTicket.league ?? ''} fullWidth size="small"
                onChange={(_, v) => handleChange({ target: { name: 'league', value: v ?? '' } })}
                onInputChange={(_, v, reason) => { if (reason === 'input') handleChange({ target: { name: 'league', value: v } }); }}
                renderInput={(params) => <TextField {...params} label="League" size="small" />}
              />
              <TextField
                label="Match Date" name="match_datetime" type="datetime-local"
                value={currentTicket.match_datetime} fullWidth size="small"
                onChange={handleChange} InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label="Match Name" name="match_name" value={currentTicket.match_name}
              placeholder="Chivas vs América" fullWidth size="small" onChange={handleChange}
              helperText={currentTicket.bet_type === 'parlay' && legs.length > 0 ? 'Auto-generated from picks below' : undefined}
              slotProps={{ input: { readOnly: currentTicket.bet_type === 'parlay' && legs.length > 0 } }}
              sx={currentTicket.bet_type === 'parlay' && legs.length > 0 ? { '& .MuiInputBase-input': { color: 'text.secondary' } } : {}}
            />
            <TextField
              label="Pick" name="pick" value={currentTicket.pick}
              placeholder="Over 2.5, Chivas gana..." fullWidth size="small"
              onChange={handleChange}
              helperText={hasLegs && legs.length > 0 ? 'Auto-generated from picks below' : undefined}
              slotProps={{ input: { readOnly: hasLegs && legs.length > 0 } }}
              sx={hasLegs && legs.length > 0 ? { '& .MuiInputBase-input': { color: 'text.secondary' } } : {}}
            />

            {/* Legs section */}
            {hasLegs && (
              <Box>
                <Divider sx={{ mb: 1.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={0.8} color="text.secondary">
                    Picks ({legs.length})
                  </Typography>
                  <Button size="small" startIcon={<Add />} onClick={addLeg}>Add pick</Button>
                </Stack>
                {legs.length === 0
                  ? <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>No picks yet — click Add pick</Typography>
                  : (
                    <Stack spacing={1}>
                      {legs.map((leg, i) => (
                        <LegRow
                          key={i}
                          leg={leg}
                          index={i}
                          isParlay={currentTicket.bet_type === 'parlay'}
                          onUpdate={updateLeg}
                          onDelete={deleteLeg}
                        />
                      ))}
                    </Stack>
                  )}
              </Box>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField label="Decimal" name="odds" type="number" value={currentTicket.odds} fullWidth size="small" onChange={handleOddsChange} />
              <TextField
                label="Americano" value={americanOdds} fullWidth size="small" placeholder="+110"
                onChange={handleAmericanChange}
                sx={{
                  '& .MuiInputLabel-root:not(.Mui-focused)': { color: 'text.disabled' },
                  '& .MuiOutlinedInput-root:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': { borderStyle: 'dashed' },
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <CurrencyField label="Stake" name="stake" value={currentTicket.stake} onChange={handleChange} />
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

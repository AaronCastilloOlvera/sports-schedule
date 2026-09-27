import { useEffect, useState } from "react";
import {
  Autocomplete, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper,
  Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from "@mui/material";
import { Add, AttachMoney, Cancel, CheckCircle, CompareArrows, Delete, Flag, HelpOutline, RadioButtonUnchecked, SportsBaseball, SportsSoccer, Square } from "@mui/icons-material";
import { BET_TYPES, SPORT_TYPES, STATUS, DEVICE_TYPES } from "../../utils/consts.jsx";
import { apiClient } from "../../api/api.js";
import PropTypes from "prop-types";

const americanToDecimal = (val) => {
  const v = parseFloat(val);
  if (!val || isNaN(v) || v === 0) return null;
  return v > 0
    ? ((v / 100) + 1).toFixed(2)
    : ((100 / Math.abs(v)) + 1).toFixed(2);
};

const MARKET_OPTIONS = [
  { value: 'goals',     label: 'Goals' },
  { value: 'corners',   label: 'Corners' },
  { value: 'cards',     label: 'Cards' },
  { value: 'btts',      label: 'BTTS' },
  { value: 'runs',      label: 'Runs' },
  { value: 'moneyline', label: 'Moneyline' },
  { value: 'other',     label: 'Other' },
];

const SIDE_BY_MARKET = {
  goals:     ['over', 'under'],
  corners:   ['over', 'under'],
  cards:     ['over', 'under'],
  btts:      ['yes', 'no'],
  runs:      ['over', 'under'],
  moneyline: ['home', 'away'],
  other:     ['over', 'under', 'yes', 'no', 'home', 'away'],
};

const SIDE_LABEL = { over: 'Over', under: 'Under', yes: 'Yes', no: 'No', home: 'Home', away: 'Away' };
const MARKET_LABEL = { goals: 'Goals', corners: 'Corners', cards: 'Cards', btts: 'BTTS', runs: 'Runs', moneyline: 'Moneyline', other: 'Other' };

const HAS_LINE = (market) => !['btts', 'moneyline'].includes(market);

const MARKET_ICON = {
  goals:     <SportsSoccer sx={{ fontSize: 18, color: '#4caf50' }} />,
  corners:   <Flag         sx={{ fontSize: 18, color: '#2196f3' }} />,
  cards:     <Square       sx={{ fontSize: 18, color: '#ffc107' }} />,
  btts:      <CompareArrows sx={{ fontSize: 18, color: '#9c27b0' }} />,
  runs:      <SportsBaseball sx={{ fontSize: 18, color: '#1976d2' }} />,
  moneyline: <AttachMoney  sx={{ fontSize: 18, color: '#00bcd4' }} />,
  other:     <HelpOutline  sx={{ fontSize: 18, color: '#9e9e9e' }} />,
};

const buildPick = (leg) => {
  if (!leg.market) return leg.pick || '';
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

function LeagueChampPicker({ leg, index, catalogLeagues, onAssociate }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async (_, league) => {
    if (!league) return;
    setSaving(true);
    setError('');
    try {
      await onAssociate(index, leg, league);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo asociar la liga.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={0.5} sx={{ mb: 1 }}>
      <Autocomplete
        size="small" options={catalogLeagues}
        getOptionLabel={(o) => o.country?.name ? `${o.name} (${o.country.name})` : o.name}
        loading={saving} disabled={saving}
        onChange={handlePick}
        renderInput={(params) => (
          <TextField {...params} label="¿Qué liga es?" size="small" />
        )}
      />
      {error && <Typography variant="caption" color="error">{error}</Typography>}
    </Stack>
  );
}

LeagueChampPicker.propTypes = {
  leg: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  catalogLeagues: PropTypes.array.isRequired,
  onAssociate: PropTypes.func.isRequired,
};

const formatEventDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Mexico_City',
    });
  } catch {
    return null;
  }
};

function PlaydoitLegView({ leg }) {
  const outcomeColor = leg.outcome === true ? 'success.main' : leg.outcome === false ? 'error.main' : 'text.disabled';
  const outcomeIcon = leg.outcome === true
    ? <CheckCircle fontSize="small" />
    : leg.outcome === false
      ? <Cancel fontSize="small" />
      : <RadioButtonUnchecked fontSize="small" />;
  const eventDate = formatEventDate(leg.event_date);

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Typography variant="body2" fontWeight={600}>{leg.match_name}</Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
          {leg.odd != null && <Typography variant="body2" color="text.secondary">{leg.odd.toFixed(2)}</Typography>}
          <Tooltip title={leg.outcome === true ? 'Ganado' : leg.outcome === false ? 'Perdido' : 'Pendiente'}>
            <Box sx={{ color: outcomeColor, display: 'flex' }}>{outcomeIcon}</Box>
          </Tooltip>
        </Stack>
      </Stack>
      <Typography variant="body2">{leg.pick}</Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {leg.market_name_raw && (
          <Typography variant="caption" color="text.secondary">{leg.market_name_raw}</Typography>
        )}
        {eventDate && <Typography variant="caption" color="text.disabled">· {eventDate}</Typography>}
      </Stack>
    </Stack>
  );
}

PlaydoitLegView.propTypes = {
  leg: PropTypes.object.isRequired,
};

function LegRow({ leg, index, isParlay, onUpdate, onDelete, catalogLeagues, onAssociateChamp }) {
  const isPlaydoit = leg.market_type_id !== undefined;
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

  if (isPlaydoit) {
    return (
      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', borderColor: 'divider' }}>
        {!leg.league && leg.champ_id && (
          <LeagueChampPicker
            leg={leg} index={index} catalogLeagues={catalogLeagues} onAssociate={onAssociateChamp}
          />
        )}
        <PlaydoitLegView leg={leg} />
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, bgcolor: 'action.hover', borderColor: 'divider' }}
    >
      {!leg.league && leg.champ_id && (
        <LeagueChampPicker
          leg={leg} index={index} catalogLeagues={catalogLeagues} onAssociate={onAssociateChamp}
        />
      )}
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
          onChange={handleMarketChange} sx={{ flex: 1.5 }}
        >
          {MARKET_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>

        <TextField
          select size="small" label="Side" value={leg.side || sides[0]}
          onChange={(e) => onUpdate(index, 'side', e.target.value)} sx={{ flex: 1.2 }}
        >
          {sides.map(s => <MenuItem key={s} value={s}>{SIDE_LABEL[s]}</MenuItem>)}
        </TextField>

        {HAS_LINE(leg.market) && (
          <TextField
            size="small" label="Line" type="number" value={leg.line_used ?? ''}
            onChange={(e) => onUpdate(index, 'line_used', e.target.value ? parseFloat(e.target.value) : null)}
            sx={{ width: 96 }}
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
  catalogLeagues: PropTypes.array.isRequired,
  onAssociateChamp: PropTypes.func.isRequired,
};

function TicketModal({ openModal, setOpenModal, currentTicket, handleChange, handleSubmit }) {
  const [tab, setTab] = useState(0);
  const [leagueOptions, setLeagueOptions] = useState([]);
  const [catalogLeagues, setCatalogLeagues] = useState([]);
  const [legs, setLegs] = useState([]);
  const isEdit = Boolean(currentTicket.ticket_id);
  const hasLegs = ['parlay', 'crear_apuesta'].includes(currentTicket.bet_type);
  const isPlaydoitTicket = Array.isArray(currentTicket.legs) && currentTicket.legs.length > 0
    && currentTicket.legs[0].market_type_id !== undefined;
  const showLegsSection = hasLegs || isPlaydoitTicket;

  useEffect(() => {
    if (openModal) {
      setTab(0);
      setLegs(Array.isArray(currentTicket.legs) ? currentTicket.legs : []);
    }
  }, [openModal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showLegsSection) return;
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

  useEffect(() => {
    if (!hasLegs && !isPlaydoitTicket) {
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

  const handleAssociateChamp = async (index, leg, league) => {
    await apiClient.associatePlaydoitChamp(league.id, leg.champ_id);
    updateLeg(index, 'league', league.name);
  };


  useEffect(() => {
    if (!openModal || !currentTicket.sport) return;
    apiClient.fetchLeaguesBySport(currentTicket.sport)
      .then(setLeagueOptions)
      .catch(() => setLeagueOptions([]));
  }, [currentTicket.sport, openModal]);

  useEffect(() => {
    if (!openModal || !currentTicket.sport) return;
    apiClient.fetchLeagues()
      .then(all => setCatalogLeagues(
        all.filter(l => l.sport === currentTicket.sport && (l.is_favorite || l.sport !== 'futbol'))
      ))
      .catch(() => setCatalogLeagues([]));
  }, [currentTicket.sport, openModal]);


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
              helperText={showLegsSection && legs.length > 0 ? 'Auto-generated from picks below' : undefined}
              slotProps={{ input: { readOnly: showLegsSection && legs.length > 0 } }}
              sx={showLegsSection && legs.length > 0 ? { '& .MuiInputBase-input': { color: 'text.secondary' } } : {}}
            />

            {!showLegsSection && (
              <Button
                size="small" startIcon={<Add />} color="inherit"
                onClick={() => {
                  handleChange({ target: { name: 'bet_type', value: 'crear_apuesta' } });
                  setLegs([defaultLeg(currentTicket)]);
                }}
                sx={{ alignSelf: 'flex-start', fontSize: 12, color: 'text.secondary' }}
              >
                Add picks
              </Button>
            )}

            {showLegsSection && (
              <Box>
                <Divider sx={{ mb: 1.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing={0.8} color="text.secondary">
                    Picks ({legs.length})
                  </Typography>
                  {!isPlaydoitTicket && (
                    <Button size="small" startIcon={<Add />} onClick={addLeg}>Add pick</Button>
                  )}
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
                          catalogLeagues={catalogLeagues}
                          onAssociateChamp={handleAssociateChamp}
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
            <TextField label="Odds" name="odds" type="number" value={currentTicket.odds} fullWidth size="small" onChange={handleChange} />
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
};

export default TicketModal;

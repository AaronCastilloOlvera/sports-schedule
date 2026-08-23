import { useEffect, useRef, useState } from "react";
import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, IconButton, InputAdornment, Paper, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, ContentCopy, Delete, Edit, RemoveRedEye, Search } from '@mui/icons-material';
import PropTypes from 'prop-types';
import TicketModal from "./../modals/TicketModal";
import BetsAnalytics from "./BetsAnalytics";
import BankrollView from "./BankrollView";
import BettingRules from "./BettingRules";
import TicketsSkeleton from "./TicketsSkeleton";
import BetRadarView from "./BetRadarView";

const toLocalInput = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().substring(0, 16);
};

const initialStatedata = {
    ticket_id: '',
    bet_type: '',
    pick: '',
    sport: 'futbol',
    league: '',
    match_name: '',
    match_datetime: toLocalInput(new Date()),
    odds: 0,
    stake: 0,
    payout: 0,
    net_profit: 0,
    status: 'pending',
    device_type: '',
    studied: false,
    comments: ''
}

const SPORT_ICONS = { futbol: '⚽', basketball: '🏀', american_football: '🏈', baseball: '⚾' };

function TicketIdCell({ id = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Tooltip title={copied ? '✓ Copied!' : id} placement="top">
      <Box
        onClick={handleCopy}
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'text.secondary', fontSize: '0.8rem' }}
      >
        <ContentCopy sx={{ fontSize: 13, opacity: 0.5 }} />
        ...{String(id).slice(-3)}
      </Box>
    </Tooltip>
  );
}

TicketIdCell.propTypes = { id: PropTypes.string.isRequired };

function TicketCard({ ticket, onEdit, onDelete }) {
  const STATUS = {
    won:     { chip: 'success', border: '#2e7d32' },
    lost:    { chip: 'error',   border: '#d32f2f' },
    push:    { chip: 'default', border: '#757575' },
    pending: { chip: 'warning', border: '#ed6c02' },
  };
  const { chip: chipColor, border: borderColor } = STATUS[ticket.status] || STATUS.pending;
  const profit = ticket.net_profit || 0;
  const isPush = ticket.status === 'push';
  const profitColor = isPush ? '#757575' : profit >= 0 ? '#2e7d32' : '#d32f2f';
  const absProfit = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(profit));
  const dateFormatted = new Date(ticket.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  const icon = SPORT_ICONS[ticket.sport] || '🎯';
  const isParlay = ticket.bet_type === 'parlay';
  const isCrear  = ticket.bet_type === 'crear_apuesta';
  const badgeBase = { px: '4px', py: '1px', fontSize: '0.58rem', fontWeight: 700, borderRadius: '4px', border: '1px solid', lineHeight: 1.4 };

  return (
    <Card sx={{ mb: 1, borderRadius: 2, boxShadow: 1, borderLeft: `4px solid ${borderColor}` }}>
      <CardContent sx={{ p: '10px 12px', '&:last-child': { pb: '10px' } }}>

        {/* Row 1: status · pick · actions */}
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: '6px' }}>
          <Chip label={ticket.status.toUpperCase()} color={chipColor} size="small"
            sx={{ fontSize: '0.65rem', height: 20, '& .MuiChip-label': { px: '6px' } }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, flexShrink: 0 }}>{icon}</span>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {ticket.pick || '—'}
            </Typography>
            {isParlay && <Box component="span" sx={{ ...badgeBase, borderColor: 'primary.main', color: 'primary.main', flexShrink: 0 }}>P</Box>}
            {isCrear  && <Box component="span" sx={{ ...badgeBase, borderColor: 'warning.main',  color: 'warning.main',  flexShrink: 0 }}>C</Box>}
          </Box>
          <IconButton size="small" sx={{ p: '2px' }} color="info"  onClick={() => onEdit(ticket.ticket_id)}><Edit sx={{ fontSize: 16 }} /></IconButton>
          <IconButton size="small" sx={{ p: '2px' }} color="error" onClick={() => onDelete(ticket.ticket_id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
        </Stack>

        {/* Row 2: date · odds · stake · net P&L */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>{dateFormatted}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {ticket.odds ? `${Number(ticket.odds).toFixed(2)}x` : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(ticket.stake || 0)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: profitColor, flexShrink: 0 }}>
            {profit >= 0 ? `+$${absProfit}` : `-$${absProfit}`}
          </Typography>
        </Stack>

      </CardContent>
    </Card>
  );
}
TicketCard.propTypes = {
  ticket: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function Bets() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketsPage, setTicketsPage] = useState(0);
  const [stats, setStats] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(initialStatedata);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, ticketId: null });
  const [mainTab, setMainTab] = useState(0);
  const [searchId, setSearchId] = useState('');
  const [leagueFilter, setLeagueFilter] = useState(null);
  const [leagueOptions, setLeagueOptions] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const skipSearchEffect = useRef(true);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const loadTickets = (page, search, league = leagueFilter) => {
    setLoadingTickets(true);
    return apiClient.fetchTickets(page, 10, search, league || '')
      .then(res => { setTickets(res.data); setTicketsTotal(res.total); })
      .catch(() => showToast(t('bets.error_load'), 'error'))
      .finally(() => setLoadingTickets(false));
  };

  const loadStats = (league = leagueFilter) =>
    apiClient.fetchBetsStats(league || '').then(setStats).catch(() => {});

  useEffect(() => {
    loadStats();
    loadTickets(0, '');
    apiClient.fetchLeaguesBySport('futbol').then(setLeagueOptions).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced server-side search — skip the initial render
  useEffect(() => {
    if (skipSearchEffect.current) { skipSearchEffect.current = false; return; }
    const timer = setTimeout(() => {
      setTicketsPage(0);
      loadTickets(0, searchId.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTicketsPage(0);
    loadTickets(0, searchId.trim(), leagueFilter);
    loadStats(leagueFilter);
  }, [leagueFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentTicket(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleUploadImage = async (ticket_id, file) => {
    if (file) {
      const imageFormData = new FormData();
      imageFormData.append('file', file);
      await apiClient.uploadTicketImage(ticket_id, imageFormData)
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCurrentTicket(initialStatedata);
    setEditId(null);
    setFile(null);
  }

  const handleSubmit = async () => {
    try {
      if (editId) {
        await apiClient.updateTicket(editId, currentTicket);
        await handleUploadImage(editId, file);
        showToast(t('bets.ticket_updated'));
      } else {
        const created = await apiClient.createTicket(currentTicket);
        await handleUploadImage(created.ticket_id, file);
        showToast(t('bets.ticket_created'));
      }

      handleCloseModal();
      loadStats();
      setTicketsPage(0);
      loadTickets(0, searchId);
    } catch {
      const key = editId ? 'bets.error_update' : 'bets.error_create';
      showToast(t(key), 'error');
    }
  };

  const handleAdd = () => {
    setCurrentTicket(initialStatedata);
    setEditId(null);
    setOpenModal(true);
  }

  const handleDelete = (ticket_id) => {
    setConfirmDelete({ open: true, ticketId: ticket_id });
  };

  const handleConfirmDelete = async () => {
    const ticket_id = confirmDelete.ticketId;
    setConfirmDelete({ open: false, ticketId: null });
    try {
      await apiClient.deleteTicket(ticket_id);
      showToast(t('bets.ticket_deleted'));
      loadStats();
      setTicketsPage(0);
      loadTickets(0, searchId);
      setFile(null);
      setCurrentTicket(initialStatedata);
      setOpenModal(false);
    } catch {
      showToast(t('bets.error_delete'), 'error');
    }
  };

  const handleEdit = (ticket_id) => {
    const ticketToEdit = tickets.find(ticket => ticket.ticket_id === ticket_id);
    if (ticketToEdit) {
      setCurrentTicket({
        ticket_id: ticketToEdit.ticket_id ?? '',
        bet_type: ticketToEdit.bet_type ?? '',
        pick: ticketToEdit.pick ?? '',
        sport: ticketToEdit.sport ?? 'futbol',
        league: ticketToEdit.league ?? '',
        match_name: ticketToEdit.match_name ?? '',
        match_datetime: toLocalInput(ticketToEdit.match_datetime),
        odds: ticketToEdit.odds ?? 0,
        stake: ticketToEdit.stake ?? 0,
        payout: ticketToEdit.payout ?? 0,
        net_profit: ticketToEdit.net_profit ?? 0,
        status: ticketToEdit.status ?? 'pending',
        device_type: ticketToEdit.device_type ?? '',
        studied: ticketToEdit.studied ?? false,
        comments: ticketToEdit.comments ?? '',
      });
      setEditId(ticket_id);
      setOpenModal(true);
    }
  }

  const columns = [
    {
      field: 'ticket_id',
      headerName: 'ID',
      width: 75,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <TicketIdCell id={params.value} />,
    },
    {
      field: 'pick',
      headerName: 'Pick',
      width: 350,
      renderCell: (params) => {
        const { pick, sport, match_name, bet_type } = params.row;
        const icon = SPORT_ICONS[sport] || '🎯';
        const isParlay = bet_type === 'parlay';
        const isCrear = bet_type === 'crear_apuesta';
        const badgeBase = { px: '4px', py: '1px', fontSize: '0.6rem', fontWeight: 700, borderRadius: '4px', border: '1px solid', lineHeight: 1.4, flexShrink: 0 };
        const tooltipContent = match_name ? `${match_name}\n${pick}` : pick;
        return (
          <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipContent}</span>} placement="top" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden', width: '100%' }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
              <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.83rem', fontWeight: 500 }}>
                {pick}
              </Box>
              {isParlay && <Box component="span" sx={{ ...badgeBase, borderColor: 'primary.main', color: 'primary.main' }}>P</Box>}
              {isCrear  && <Box component="span" sx={{ ...badgeBase, borderColor: 'warning.main',  color: 'warning.main'  }}>C</Box>}
            </Box>
          </Tooltip>
        );
      },
    },
    { 
      field: 'odds', 
      headerName: 'Odds', 
      type: 'number', 
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <strong>{params.value ? `${Number(params.value).toFixed(2)}x` : '—'}</strong>
    },
    { 
      field: 'stake', 
      headerName: 'Stake', 
      type: 'number', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value || 0)
    },
    { 
      field: 'net_profit', 
      headerName: 'Net Profit', 
      type: 'number', 
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const value = params.value || 0;
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Math.abs(value));

        const isPush = params.row.status === 'push';
        const color = isPush ? '#757575' : value >= 0 ? '#2e7d32' : '#d32f2f';
        return (
          <span style={{ color, fontWeight: 'bold' }}>
            {value >= 0 ? `+$${formatted}` : `-$${formatted}`}
          </span>
        )
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const color = params.value === 'won' ? 'success' : params.value === 'lost' ? 'error' : params.value === 'push' ? 'default' : 'warning';
        return <Chip label={params.value.toUpperCase()} color={color} size="small" />;
      }
    },
    { 
      field: 'match_datetime', 
      headerName: 'Date Event',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value) => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    {
      field: 'actions',
      width: 150,
      headerName: 'Actions',
      sortable: false,
      disableColumnMenu: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="error" onClick={() => handleDelete(params.row.ticket_id)} size="small">
              <Delete />
            </IconButton>
            <IconButton color="info" onClick={() => handleEdit(params.row.ticket_id)} size="small">
              <Edit /> 
            </IconButton>

            {
              params.row.image_path && (
                <IconButton color="info" size="small">
                  <RemoveRedEye /> 
                </IconButton>
              )
            }
          </Box>    
        )
      }
    }
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bets Log</Typography>
        {mainTab === 0 && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Autocomplete
              options={leagueOptions}
              value={leagueFilter}
              onChange={(_, value) => setLeagueFilter(value)}
              size="small"
              sx={{ width: { xs: 150, sm: 200 } }}
              isOptionEqualToValue={(opt, val) => opt === val}
              noOptionsText="Sin ligas registradas"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Liga"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
            <TextField
              size="small"
              placeholder="Buscar por ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: 130, sm: 180 } }}
            />
            <Fab size="small" color="primary" aria-label="add" onClick={handleAdd}>
              <Add />
            </Fab>
          </Stack>
        )}
      </Stack>

      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Log" />
        <Tab label="Analytics" />
        <Tab label="Bankroll" />
        <Tab label="Rules" />
        <Tab label="BetRadar" />
      </Tabs>

      {mainTab === 0 && (
        loadingTickets ? (
          <TicketsSkeleton isMobile={isMobile} />
        ) : (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
            {[
              { label: 'Total Tickets', display: stats?.total ?? '—', color: '#1976d2' },
              { label: 'Avg Odds', display: stats?.avg_odds ? `${stats.avg_odds}x` : '—', color: '#1976d2' },
              { label: 'Win Rate', display: stats ? `${stats.win_rate}%` : '—', color: '#2e7d32' },
              { label: 'Net Profit', display: stats ? `$${Number(stats.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', color: (stats?.net_profit ?? 0) >= 0 ? '#2e7d32' : '#d32f2f' },
              { label: 'Total Staked', display: stats ? `$${Number(stats.total_staked).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', color: '#757575' },
            ].map(({ label, display, color }) => (
              <Paper key={label} elevation={2} sx={{ borderRadius: 2, p: 2, ...(label === 'Total Staked' && { gridColumn: { xs: 'span 2', sm: 'auto' } }) }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{display}</Typography>
              </Paper>
            ))}
          </Box>
          {isMobile ? (
            <Box>
              {tickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <Typography>{ticketsTotal === 0 ? 'No tickets yet. Tap + to add your first bet.' : 'No tickets match that ID.'}</Typography>
                </Box>
              ) : (
                <>
                  {tickets.map(ticket => (
                    <TicketCard key={ticket.ticket_id} ticket={ticket} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                  {ticketsTotal > 10 && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Button size="small" disabled={ticketsPage === 0} onClick={() => { const p = ticketsPage - 1; setTicketsPage(p); loadTickets(p, searchId); }}>Prev</Button>
                      <Typography variant="caption" color="text.secondary">{ticketsPage + 1} / {Math.ceil(ticketsTotal / 10)}</Typography>
                      <Button size="small" disabled={(ticketsPage + 1) * 10 >= ticketsTotal} onClick={() => { const p = ticketsPage + 1; setTicketsPage(p); loadTickets(p, searchId); }}>Next</Button>
                    </Stack>
                  )}
                </>
              )}
            </Box>
          ) : (
            <Paper elevation={2} sx={{ width: '100%', borderRadius: 2 }}>
              <DataGrid
                rows={tickets}
                columns={columns}
                getRowId={(row) => row.ticket_id}
                rowCount={ticketsTotal}
                paginationMode="server"
                paginationModel={{ page: ticketsPage, pageSize: 10 }}
                onPaginationModelChange={(model) => {
                  setTicketsPage(model.page);
                  loadTickets(model.page, searchId);
                }}
                pageSizeOptions={[10]}
                disableRowSelectionOnClick
                disableColumnMenu
                rowHeight={42}
                sx={{
                  '& .MuiDataGrid-cell': { alignItems: 'center', display: 'flex' },
                  '& .MuiDataGrid-columnHeader': { alignItems: 'center', display: 'flex' },
                }}
              />
            </Paper>
          )}
        </Box>
        )
      )}

      {mainTab === 1 && <BetsAnalytics />}
      {mainTab === 2 && <BankrollView />}
      {mainTab === 3 && <BettingRules />}
      {mainTab === 4 && <BetRadarView />}

      <TicketModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        currentTicket={currentTicket}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        setFile={setFile}
        file={file}
      />

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, ticketId: null })}>
        <DialogTitle>{t('bets.confirm_delete_title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('bets.confirm_delete_body', { id: confirmDelete.ticketId })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, ticketId: null })}>{t('bets.confirm_cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">{t('bets.confirm_delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast(prev => ({ ...prev, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Bets;

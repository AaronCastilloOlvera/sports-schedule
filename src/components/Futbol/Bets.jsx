import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, IconButton, InputAdornment, Snackbar, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, ContentCopy, Delete, Edit, RemoveRedEye, Search } from '@mui/icons-material';
import PropTypes from 'prop-types';
import TicketModal from "./../modals/TicketModal";
import BetsAnalytics from "./BetsAnalytics";
import BankrollView from "./BankrollView";
import BettingRules from "./BettingRules";

const initialStatedata = {
    ticket_id: '',
    bet_type: '',
    pick: '',
    sport: 'futbol',
    league: '',
    match_name: '',
    match_datetime: new Date().toISOString().substring(0, 16),
    odds: 0,
    stake: 0,
    payout: 0,
    net_profit: 0,
    status: 'pending',
    device_type: '',
    studied: false,
    comments: ''
}

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
        ...{String(id).slice(-6)}
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
  const stakeFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(ticket.stake || 0);
  const dateFormatted = new Date(ticket.match_datetime).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

  return (
    <Card sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1, borderLeft: `4px solid ${borderColor}` }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Chip label={ticket.status.toUpperCase()} color={chipColor} size="small" />
          <Typography variant="caption" color="text.secondary">{dateFormatted}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500, lineHeight: 1.4 }}>
          {ticket.pick || '—'}
        </Typography>
        <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Odds</Typography>
            <Typography variant="body2" fontWeight="bold">{ticket.odds ? `${Number(ticket.odds).toFixed(2)}x` : '—'}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Stake</Typography>
            <Typography variant="body2" fontWeight="bold">{stakeFormatted}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">Net P&L</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: profitColor }}>
              {profit >= 0 ? `+$${absProfit}` : `-$${absProfit}`}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <IconButton size="small" color="info" onClick={() => onEdit(ticket.ticket_id)}><Edit /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(ticket.ticket_id)}><Delete /></IconButton>
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
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(initialStatedata);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, ticketId: null });
  const [mainTab, setMainTab] = useState(0);
  const [searchId, setSearchId] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredTickets = useMemo(() => {
    const term = searchId.trim().toLowerCase();
    return term ? tickets.filter(t => (t.ticket_id || '').toLowerCase().includes(term)) : tickets;
  }, [tickets, searchId]);

  const logStats = useMemo(() => {
    const resolved = tickets.filter(t => t.status === 'won' || t.status === 'lost');
    const winRate = resolved.length ? (resolved.filter(t => t.status === 'won').length / resolved.length * 100).toFixed(1) : 0;
    const netProfit = tickets.filter(t => t.status !== 'pending').reduce((s, t) => s + (t.net_profit || 0), 0);
    const totalStaked = tickets.reduce((s, t) => s + (t.stake || 0), 0);
    const withOdds = tickets.filter(t => t.odds > 0);
    const avgOdds = withOdds.length ? (withOdds.reduce((s, t) => s + t.odds, 0) / withOdds.length).toFixed(2) : 0;
    return { total: tickets.length, winRate, netProfit, totalStaked, avgOdds };
  }, [tickets]);

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const fetchTickets = () => {
    apiClient.fetchTickets()
      .then((tickets) => { setTickets(tickets) })
      .catch((error) => {
        console.error(error);
        showToast(t('bets.error_load'), 'error');
      });
  }

  useEffect(() => {
    fetchTickets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      fetchTickets();
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
      fetchTickets();
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
        match_datetime: ticketToEdit.match_datetime ? ticketToEdit.match_datetime.substring(0, 16) : '',
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
      width: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <TicketIdCell id={params.value} />,
    },
    {
      field: 'pick',
      headerName: 'Pick',
      width: 250,
      renderCell: (params) => (
        <Box title={params.value} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {params.value}
        </Box>
      ),
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
              sx={{ width: { xs: 140, sm: 200 } }}
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
      </Tabs>

      {mainTab === 0 && (
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
            {[
              { label: 'Total Tickets', display: logStats.total, color: '#1976d2' },
              { label: 'Avg Odds', display: logStats.avgOdds ? `${logStats.avgOdds}x` : '—', color: '#1976d2' },
              { label: 'Win Rate', display: `${logStats.winRate}%`, color: '#2e7d32' },
              { label: 'Net Profit', display: `$${Number(logStats.netProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: logStats.netProfit >= 0 ? '#2e7d32' : '#d32f2f' },
              { label: 'Total Staked', display: `$${Number(logStats.totalStaked).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: '#757575' },
            ].map(({ label, display, color }) => (
              <Box key={label} sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 2, ...(label === 'Total Staked' && { gridColumn: { xs: 'span 2', sm: 'auto' } }) }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{display}</Typography>
              </Box>
            ))}
          </Box>
          {isMobile ? (
            <Box>
              {filteredTickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <Typography>{tickets.length === 0 ? 'No tickets yet. Tap + to add your first bet.' : 'No tickets match that ID.'}</Typography>
                </Box>
              ) : (
                [...filteredTickets]
                  .sort((a, b) => new Date(b.match_datetime) - new Date(a.match_datetime))
                  .map(ticket => (
                    <TicketCard key={ticket.ticket_id} ticket={ticket} onEdit={handleEdit} onDelete={handleDelete} />
                  ))
              )}
            </Box>
          ) : (
            <Box sx={{ width: '100%', backgroundColor: 'white', borderRadius: 2, boxShadow: 2 }}>
              <DataGrid
                rows={filteredTickets}
                columns={columns}
                getRowId={(row) => row.ticket_id}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                  sorting: { sortModel: [{ field: 'match_datetime', sort: 'desc' }] },
                }}
                disableRowSelectionOnClick
                disableColumnMenu
                rowHeight={42}
                sx={{
                  '& .MuiDataGrid-cell': { alignItems: 'center', display: 'flex' },
                  '& .MuiDataGrid-columnHeader': { alignItems: 'center', display: 'flex' }
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {mainTab === 1 && <BetsAnalytics tickets={tickets} />}
      {mainTab === 2 && <BankrollView tickets={tickets} />}
      {mainTab === 3 && <BettingRules />}

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

import { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, IconButton, Snackbar, Stack, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, ContentCopy, Delete, Edit, RemoveRedEye } from '@mui/icons-material';
import TicketModal from "./../modals/TicketModal";
import BetsAnalytics from "./BetsAnalytics";

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

function TicketIdCell({ id }) {
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
  }, []);

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
    } catch (error) {
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
    } catch (error) {
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
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bets Log</Typography>
        {mainTab === 0 && (
          <Fab size="small" color="primary" aria-label="add" onClick={handleAdd}>
            <Add />
          </Fab>
        )}
      </Stack>

      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3 }}>
        <Tab label="Log" />
        <Tab label="Analytics" />
      </Tabs>

      {mainTab === 0 && (
        <Box sx={{ height: '100%', width: '100%', backgroundColor: 'white', borderRadius: 2, boxShadow: 2 }}>
          <DataGrid
            rows={tickets}
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

      {mainTab === 1 && <BetsAnalytics tickets={tickets} />}

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

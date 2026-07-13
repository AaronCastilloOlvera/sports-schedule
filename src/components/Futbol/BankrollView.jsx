import { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, Snackbar,
  Alert, Stack, TextField, Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { apiClient } from '../../api/api.js';

const initialTx = {
  type: 'deposit',
  amount: '',
  date: new Date().toISOString().substring(0, 10),
  notes: '',
};

function SummaryCard({ label, value, color }) {
  return (
    <Card sx={{ flex: 1, boxShadow: 2 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
      </CardContent>
    </Card>
  );
}

export default function BankrollView({ tickets }) {
  const [transactions, setTransactions] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [current, setCurrent] = useState(initialTx);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const fetchTransactions = () => {
    apiClient.fetchTransactions()
      .then(setTransactions)
      .catch(() => showToast('Error al cargar transacciones.', 'error'));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
  const betsNetProfit = (tickets || [])
    .filter(t => t.status === 'won' || t.status === 'lost' || t.status === 'push')
    .reduce((s, t) => s + (t.net_profit || 0), 0);
  const realBalance = totalDeposits - totalWithdrawals + betsNetProfit;

  const handleSubmit = async () => {
    try {
      if (editId) {
        await apiClient.updateTransaction(editId, current);
        showToast('Transacción actualizada.');
      } else {
        await apiClient.createTransaction(current);
        showToast('Transacción guardada.');
      }
      setOpenModal(false);
      setCurrent(initialTx);
      setEditId(null);
      fetchTransactions();
    } catch {
      showToast('Error al guardar la transacción.', 'error');
    }
  };

  const handleEdit = (row) => {
    setCurrent({
      type: row.type,
      amount: row.amount,
      date: row.date.substring(0, 10),
      notes: row.notes ?? '',
    });
    setEditId(row.id);
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.deleteTransaction(id);
      showToast('Transacción eliminada.');
      fetchTransactions();
    } catch {
      showToast('Error al eliminar la transacción.', 'error');
    }
  };

  const columns = [
    {
      field: 'type', headerName: 'Type', width: 120, align: 'center', headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value === 'deposit' ? 'Deposit' : 'Withdrawal'}
          color={params.value === 'deposit' ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 130, align: 'center', headerAlign: 'center',
      renderCell: (params) => {
        const isDeposit = params.row.type === 'deposit';
        return (
          <span style={{ fontWeight: 'bold', color: isDeposit ? '#2e7d32' : '#d32f2f' }}>
            {isDeposit ? '+' : '-'}${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      field: 'date', headerName: 'Date', width: 120, align: 'center', headerAlign: 'center',
      valueGetter: (value) => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    },
    { field: 'notes', headerName: 'Notes', flex: 1 },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      align: 'center', headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => handleEdit(params.row)}><Edit /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><Delete /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Summary cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <SummaryCard label="Total Deposited" value={totalDeposits} color="#2e7d32" />
        <SummaryCard label="Total Withdrawn" value={totalWithdrawals} color="#d32f2f" />
        <SummaryCard label="Bets P&L" value={betsNetProfit} color={betsNetProfit >= 0 ? '#2e7d32' : '#d32f2f'} />
        <SummaryCard label="Real Balance (Playdo.it)" value={realBalance} color={realBalance >= 0 ? '#1976d2' : '#d32f2f'} />
      </Stack>

      {/* Table */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Transactions</Typography>
        <Button variant="contained" startIcon={<Add />} size="small" onClick={() => { setCurrent(initialTx); setEditId(null); setOpenModal(true); }}>
          Add
        </Button>
      </Stack>

      <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2 }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } }, sorting: { sortModel: [{ field: 'date', sort: 'desc' }] } }}
          disableRowSelectionOnClick
          disableColumnMenu
          rowHeight={42}
          sx={{
            '& .MuiDataGrid-cell': { alignItems: 'center', display: 'flex' },
            '& .MuiDataGrid-columnHeader': { alignItems: 'center', display: 'flex' },
          }}
        />
      </Box>

      {/* Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editId ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Type" value={current.type} onChange={(e) => setCurrent(p => ({ ...p, type: e.target.value }))} fullWidth>
              <MenuItem value="deposit">Deposit</MenuItem>
              <MenuItem value="withdrawal">Withdrawal</MenuItem>
            </TextField>
            <TextField label="Amount (MXN)" type="number" value={current.amount} onChange={(e) => setCurrent(p => ({ ...p, amount: e.target.value }))} fullWidth />
            <TextField label="Date" type="date" value={current.date} onChange={(e) => setCurrent(p => ({ ...p, date: e.target.value }))} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Notes" value={current.notes} onChange={(e) => setCurrent(p => ({ ...p, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast(p => ({ ...p, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}

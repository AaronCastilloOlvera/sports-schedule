import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem,
  Snackbar, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { apiClient } from '../../api/api.js';

const getWeekStart = (dateStr) => {
  const d = new Date((dateStr ?? '').substring(0, 10) + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().substring(0, 10);
};
const fmtWeekLabel = (dateStr) =>
  new Date((dateStr ?? '').substring(0, 10) + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

const initialTx = {
  type: 'deposit',
  amount: '',
  date: new Date().toISOString().substring(0, 10),
  notes: '',
};

function TransactionCard({ row, onEdit, onDelete }) {
  const isDeposit = row.type === 'deposit';
  const borderColor = isDeposit ? '#2e7d32' : '#d32f2f';
  const amountColor = isDeposit ? '#2e7d32' : '#d32f2f';
  const amountFormatted = `${isDeposit ? '+' : '-'}$${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const dateFormatted = new Date(row.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <Card sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1, borderLeft: `4px solid ${borderColor}` }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Chip label={isDeposit ? 'Deposit' : 'Withdrawal'} color={isDeposit ? 'success' : 'error'} size="small" />
          <Typography variant="caption" color="text.secondary">{dateFormatted}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: amountColor, my: 0.5 }}>
          {amountFormatted}
        </Typography>
        {row.notes && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{row.notes}</Typography>
        )}
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(row.id)}><Delete fontSize="small" /></IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const weeklyWithdrawals = useMemo(() => {
    const byWeek = {};
    transactions.filter(t => t.type === 'withdrawal').forEach(t => {
      const week = getWeekStart(t.date);
      byWeek[week] = (byWeek[week] ?? 0) + t.amount;
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, total]) => ({ week: fmtWeekLabel(week), total: parseFloat(total.toFixed(2)) }));
  }, [transactions]);

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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <SummaryCard label="Total Deposited" value={totalDeposits} color="#2e7d32" />
        <SummaryCard label="Total Withdrawn" value={totalWithdrawals} color="#d32f2f" />
        <SummaryCard label="Bets P&L" value={betsNetProfit} color={betsNetProfit >= 0 ? '#2e7d32' : '#d32f2f'} />
        <SummaryCard label="Real Balance (Playdo.it)" value={realBalance} color={realBalance >= 0 ? '#1976d2' : '#d32f2f'} />
      </Box>

      {/* Goal */}
      {(() => {
        const GOAL = 200000;
        const progress = Math.min((totalWithdrawals / GOAL) * 100, 100);
        const remaining = GOAL - totalWithdrawals;
        const mxn = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return (
          <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Withdrawal Goal 🏆</Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {mxn(totalWithdrawals)} <Typography component="span" variant="body2" color="text.secondary">of {mxn(GOAL)}</Typography>
                </Typography>
              </Box>
              <Tooltip title={`${mxn(remaining)} remaining`} placement="top">
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {progress.toFixed(2)}%
                </Typography>
              </Tooltip>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 14,
                borderRadius: 7,
                bgcolor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 7,
                  background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {mxn(remaining)} left to reach the goal
            </Typography>
          </Box>
        );
      })()}

      {/* Weekly withdrawals chart */}
      {weeklyWithdrawals.length > 0 && (
        <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
            Withdrawals per Week
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyWithdrawals} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <RechartsTooltip formatter={(v) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Withdrawn']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {weeklyWithdrawals.map((_, i) => (
                  <Cell key={i} fill="#d32f2f" fillOpacity={0.75 + (i % 2) * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Table */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Transactions</Typography>
        <Button variant="contained" startIcon={<Add />} size="small" onClick={() => { setCurrent(initialTx); setEditId(null); setOpenModal(true); }}>
          Add
        </Button>
      </Stack>

      {isMobile ? (
        <Box>
          {transactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography>No transactions yet.</Typography>
            </Box>
          ) : (
            [...transactions]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(row => (
                <TransactionCard key={row.id} row={row} onEdit={handleEdit} onDelete={handleDelete} />
              ))
          )}
        </Box>
      ) : (
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
      )}

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

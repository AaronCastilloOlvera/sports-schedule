import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, LinearProgress, MenuItem,
  Snackbar, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
import PropTypes from 'prop-types';
import { apiClient } from '../../api/api.js';
import BankrollSkeleton from './BankrollSkeleton';

const FLOW_LABELS = { deposited: 'Deposited', withdrawn: 'Withdrawn', net: 'Net (real gain)' };

const usd = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const GOAL = 50000;
const NU_PURPLE = '#7b1fa2';

const initialTx = {
  type: 'deposit',
  amount: '',
  date: new Date().toISOString().substring(0, 10),
  notes: '',
};

function TransactionCard({ row, onEdit, onDelete }) {
  const isDeposit  = row.type === 'deposit';
  const isNuExpense = row.type === 'nu_expense';
  const borderColor = isDeposit ? '#d32f2f' : isNuExpense ? NU_PURPLE : '#2e7d32';
  const amountColor = borderColor;
  const sign = isDeposit ? '-' : '+';
  const amountFormatted = `${sign}$${Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const dateFormatted = new Date(row.date).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const chipLabel = isDeposit ? 'Deposit' : isNuExpense ? 'NU Expense' : 'Withdrawal';
  const chipSx = isNuExpense ? { bgcolor: NU_PURPLE, color: '#fff' } : {};

  return (
    <Card sx={{ mb: 1.5, borderRadius: 2, boxShadow: 1, borderLeft: `4px solid ${borderColor}` }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <Chip
            label={chipLabel}
            color={isDeposit ? 'error' : isNuExpense ? 'default' : 'success'}
            size="small"
            sx={chipSx}
          />
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

TransactionCard.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    amount: PropTypes.number,
    date: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

function StakeTooltip({ active, payload }) {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const bg = theme.palette.mode === 'dark' ? '#3d3d3d' : '#fff';
  const border = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0';
  return (
    <Box sx={{ bgcolor: bg, border: `1px solid ${border}`, borderRadius: 1, p: 1, boxShadow: 6 }}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{row.date}</Typography>
      <Typography sx={{ fontSize: 12 }}>{row.pct}% ({usd(row.stake)} de {usd(row.bankroll)})</Typography>
    </Box>
  );
}

StakeTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

function SummaryCard({ label, value, color, sx }) {
  return (
    <Card sx={{ flex: 1, boxShadow: 2, ...sx }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Typography>
      </CardContent>
    </Card>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  color: PropTypes.string,
};

export default function BankrollView() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tooltipStyle = {
    backgroundColor: theme.palette.mode === 'dark' ? '#3d3d3d' : '#fff',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#e0e0e0'}`,
    borderRadius: 8,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[6],
  };
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [current, setCurrent] = useState(initialTx);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const loadTransactions = (page = 0) =>
    apiClient.fetchTransactions(page, 10).then(res => {
      setTransactions(res.data);
      setTxTotal(res.total);
    });

  useEffect(() => {
    Promise.all([
      apiClient.fetchBankrollSummary().then(setSummary),
      apiClient.fetchBankrollChartData().then(setChartData),
      loadTransactions(0),
    ])
      .catch(() => showToast('Error al cargar datos.', 'error'))
      .finally(() => setLoadingInit(false));
  }, []);

  const refreshAll = (page = txPage) => {
    Promise.all([
      apiClient.fetchBankrollSummary().then(setSummary),
      apiClient.fetchBankrollChartData().then(setChartData),
      loadTransactions(page),
    ]).catch(() => showToast('Error al actualizar.', 'error'));
  };

  const totalDeposits    = summary?.total_deposits    ?? 0;
  const totalWithdrawals = summary?.total_withdrawals ?? 0;
  const betsNetProfit    = summary?.bets_net_profit   ?? 0;
  const totalStaked      = summary?.total_staked      ?? 0;
  const nuBalance        = summary?.nu_balance        ?? 0;
  const realBalance      = summary?.real_balance      ?? 0;
  const roi              = summary?.roi               ?? 0;
  const roiColor         = roi >= 0 ? '#2e7d32' : '#d32f2f';

  const balanceHistory        = chartData?.balance_history        ?? [];
  const cumulativeWithdrawals = chartData?.cumulative_withdrawals ?? [];
  const weeklyWithdrawals     = chartData?.weekly_withdrawals     ?? [];
  const monthlyFlow           = chartData?.monthly_flow           ?? [];
  const stakeVsBankroll       = chartData?.stake_vs_bankroll      ?? [];



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
      refreshAll(0);
      setTxPage(0);
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
      refreshAll(0);
      setTxPage(0);
    } catch {
      showToast('Error al eliminar la transacción.', 'error');
    }
  };

  const columns = [
    {
      field: 'type', headerName: 'Type', width: 130, align: 'center', headerAlign: 'center',
      renderCell: (params) => {
        if (params.value === 'nu_expense') {
          return <Chip label="NU Expense" size="small" sx={{ bgcolor: NU_PURPLE, color: '#fff' }} />;
        }
        return (
          <Chip
            label={params.value === 'deposit' ? 'Deposit' : 'Withdrawal'}
            color={params.value === 'deposit' ? 'error' : 'success'}
            size="small"
          />
        );
      },
    },
    {
      field: 'amount', headerName: 'Amount', width: 130, align: 'center', headerAlign: 'center',
      renderCell: (params) => {
        const isDeposit = params.row.type === 'deposit';
        const isNuExpense = params.row.type === 'nu_expense';
        const color = isDeposit ? '#d32f2f' : isNuExpense ? NU_PURPLE : '#2e7d32';
        return (
          <span style={{ fontWeight: 'bold', color }}>
            {isDeposit ? '-' : '+'}${Number(params.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

  if (loadingInit) {
    return <BankrollSkeleton isMobile={isMobile} />;
  }

  return (
    <Box>
      {/* Summary cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <SummaryCard label="Total Deposited" value={totalDeposits} color="#d32f2f" />
        <SummaryCard label="Total Withdrawn" value={totalWithdrawals} color="#2e7d32" />
        <SummaryCard label="Bets P&L" value={betsNetProfit} color={betsNetProfit >= 0 ? '#2e7d32' : '#d32f2f'} />
        <Tooltip title={`Net profit ${`$${Number(betsNetProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} ÷ Total staked ${`$${Number(totalStaked).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} × 100`} placement="bottom" arrow enterTouchDelay={0}>
          <Card sx={{ boxShadow: 2, cursor: 'default' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">ROI</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: roiColor }}>{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</Typography>
            </CardContent>
          </Card>
        </Tooltip>
        <SummaryCard label="Real Balance (Playdo.it)" value={realBalance} color={realBalance >= 0 ? '#1976d2' : '#d32f2f'} />
        <SummaryCard label="NU Balance" value={nuBalance} color={NU_PURPLE} />
      </Box>

      {/* NU Goal — full width */}
      {(() => {
        const progress = Math.min((nuBalance / GOAL) * 100, 100);
        const remaining = GOAL - nuBalance;
        const mxn = (v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        return (
          <Card sx={{ boxShadow: 2, mb: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">NU Goal 🏆</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {mxn(nuBalance)} <Typography component="span" variant="body2" color="text.secondary">of {mxn(GOAL)}</Typography>
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
                  '& .MuiLinearProgress-bar': { borderRadius: 7, background: 'linear-gradient(90deg, #1976d2, #42a5f5)' },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {mxn(remaining)} left to reach the goal
              </Typography>

            </CardContent>
          </Card>
        );
      })()}

      {/* Balance over time + Cumulative withdrawals — same row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        {balanceHistory.length > 1 && (
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
              Balance Over Time (Playdo.it)
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={balanceHistory} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976d2" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1976d2" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Balance']} />
                <Area type="monotone" dataKey="balance" stroke="#1976d2" strokeWidth={2} fill="url(#balanceGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
        {cumulativeWithdrawals.length > 1 && (
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
              Cumulative Withdrawals
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cumulativeWithdrawals} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="withdrawalsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2e7d32" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [usd(v), 'Withdrawn']} />
                <ReferenceLine y={GOAL} stroke="#757575" strokeDasharray="4 4" label={{ value: 'Goal', fontSize: 11, fill: '#757575', position: 'insideTopRight' }} />
                <Area type="linear" dataKey="total" stroke="#2e7d32" strokeWidth={2} fill="url(#withdrawalsGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>

      {/* Weekly withdrawals chart */}
      {weeklyWithdrawals.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
            Withdrawals per Week
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyWithdrawals} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Withdrawn']} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {weeklyWithdrawals.map((_, i) => (
                  <Cell key={i} fill="#2e7d32" fillOpacity={0.75 + (i % 2) * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Monthly deposits vs withdrawals vs net */}
      {monthlyFlow.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
            Deposits vs Withdrawals per Month
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyFlow} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
              <RechartsTooltip contentStyle={tooltipStyle} formatter={(v, name) => [usd(v), FLOW_LABELS[name] ?? name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(value) => FLOW_LABELS[value] ?? value} />
              <Bar dataKey="deposited" fill="#d32f2f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="net" fill="#1976d2" radius={[4, 4, 0, 0]}>
                {monthlyFlow.map((row, i) => (
                  <Cell key={i} fill={!row.hasDeposits ? '#2e7d32' : row.net >= 0 ? '#1976d2' : '#ed6c02'} />
                ))}
              </Bar>
              <Bar dataKey="withdrawn" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Stake sizing vs bankroll */}
      {stakeVsBankroll.length > 0 && (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2, p: 3, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 11 }}>
            Stake as % of Bankroll
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stakeVsBankroll} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="n" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <RechartsTooltip content={<StakeTooltip />} />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {stakeVsBankroll.map((row, i) => (
                  <Cell key={i} fill={row.pct > 10 ? '#d32f2f' : row.pct > 5 ? '#ed6c02' : '#1976d2'} />
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
            <>
              {transactions.map(row => (
                <TransactionCard key={row.id} row={row} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
              {txTotal > 10 && (
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                  <Button size="small" disabled={txPage === 0} onClick={() => { const p = txPage - 1; setTxPage(p); loadTransactions(p); }}>Prev</Button>
                  <Typography variant="caption" color="text.secondary">{txPage + 1} / {Math.ceil(txTotal / 10)}</Typography>
                  <Button size="small" disabled={(txPage + 1) * 10 >= txTotal} onClick={() => { const p = txPage + 1; setTxPage(p); loadTransactions(p); }}>Next</Button>
                </Stack>
              )}
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
          <DataGrid
            rows={transactions}
            columns={columns}
            getRowId={(row) => row.id}
            rowCount={txTotal}
            paginationMode="server"
            paginationModel={{ page: txPage, pageSize: 10 }}
            onPaginationModelChange={(model) => {
              setTxPage(model.page);
              loadTransactions(model.page);
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
              <MenuItem value="nu_expense">NU Expense</MenuItem>
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

BankrollView.propTypes = {};

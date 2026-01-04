import { useEffect, useState } from "react";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField,  Typography } from "@mui/material";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material';
import { BET_TYPES, SPORT_TYPES, STATUS, DEVICE_TYPES} from "../../utils/consts.jsx"; 

const initialStatedata = {
    ticket_id: '',
    bet_type: '',
    pick: '',
    sport: 'Soccer',
    league: '',
    match_name: '',
    match_datetime: new Date().toISOString(),
    odds: 0,
    stake: 0,
    payout: 0,
    net_profit: 0,
    status: 'pending',
    device_type: '',
    studied: false,
    comments: ''
  }

function Bets() {
  const [tickets, setTickets] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [file, setFile] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(initialStatedata);
  const [editId, setEditId] = useState(null);

  const fetchTickets = () => {
    apiClient.fetchBets()
      .then((tickets) => { setTickets(tickets) }) 
      .catch((error) => console.error(error));
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentTicket(prev => ({ ...prev, [name]: value }));
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
        handleUploadImage(editId, file);
        alert("Ticket actualizado correctamente");
      } else {
        await apiClient.createTicket(currentTicket);
        handleUploadImage(editId, file);
        alert("Ticket creado correctamente");
      }

      handleCloseModal();
      fetchTickets();
    } catch (error) {
      alert("Error al crear el ticket" + error);
    }
  };

  const handleDelete = async (ticket_id) => {
    if (window.confirm("Are you sure?")) {
    
      try {
        await apiClient.deleteTicket(ticket_id);
        alert("Ticket eliminado correctamente" + ticket_id);
        fetchTickets();
        setFile(null);
        setCurrentTicket(initialStatedata);
        setOpenModal(false);
      }
      catch (error) {
        alert("Error al eliminar el ticket" + error);
      }
    }
  }

  const handleEdit = async (ticket_id) => {
    const ticketToEdit = tickets.find(ticket => ticket.ticket_id === ticket_id);
    if (ticketToEdit) {
      setCurrentTicket({
      ...ticketToEdit,
        match_datetime: ticketToEdit.match_datetime ? ticketToEdit.match_datetime.substring(0, 16) : ''
      })
      setEditId(ticket_id);
      setOpenModal(true);
    }
  }

  const columns = [
    { field: 'ticket_id', headerName: 'ID', width: 80 },
    { field: 'match_name', headerName: 'Partido', width: 200 },
    { field: 'league', headerName: 'Liga', width: 130 },
    { 
      field: 'odds', 
      headerName: 'Cuota', 
      type: 'number', 
      width: 90,
      renderCell: (params) => <strong>{params.value}</strong> 
    },
    { 
      field: 'stake', 
      headerName: 'Stake', 
      type: 'number', 
      width: 100,
      valueFormatter: (value) => `$${value}` 
    },
    { 
      field: 'net_profit', 
      headerName: 'Ganancia', 
      type: 'number', 
      width: 110,
      renderCell: (params) => (
        <span style={{ color: params.value >= 0 ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
          {params.value >= 0 ? `+$${params.value}` : `-$${Math.abs(params.value)}`}
        </span>
      )
    },
    { 
      field: 'status', 
      headerName: 'Estado', 
      width: 100,
      renderCell: (params) => {
        const color = params.value === 'won' ? 'success' : params.value === 'lost' ? 'error' : 'warning';
        return <Chip label={params.value.toUpperCase()} color={color} size="small" />;
      }
    },
    { 
      field: 'match_datetime', 
      headerName: 'Fecha Evento', 
      width: 180,
      valueGetter: (value) => new Date(value).toLocaleString()
    },
    {
      field: 'actions',
      width: 100,
      headerName: 'Accions',
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="error" onClick={() => handleDelete(params.row.ticket_id)} size="small">
              <Delete /> 
            </IconButton>
            <IconButton color="error" onClick={() => handleEdit(params.row.ticket_id)} size="small">
              <Edit /> 
            </IconButton>
          </Box>    
        )
      }
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Historial de Apuestas</Typography>
        <Button 
          variant="contained"
          color="primary"  
          startIcon={<Add/>} 
          onClick={() => setOpenModal(true)}
        />
      </Stack>

      <Box sx={{ height: 500, width: '100%', backgroundColor: 'white', borderRadius: 2, boxShadow: 2 }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          getRowId={(row) => row.ticket_id}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </Box>
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Ticket</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
                <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>Ticket Details</Typography>
                <Stack spacing={2}>
                  <TextField label="Ticket ID" name="ticket_id"  value={currentTicket.ticket_id} fullWidth onChange={handleChange}/>
                  <Stack direction="row" spacing={2}>
                  <TextField select label="Bet Type" name="bet_type" value={currentTicket.bet_type} fullWidth  onChange={handleChange}>
                    {BET_TYPES.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>

                  <TextField select label="Sport" name="sport" value={currentTicket.sport} fullWidth onChange={handleChange}>
                    {SPORT_TYPES.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Stack>
            </Box>

            <hr style={{ border: '0.5px solid #eee' }} />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2}}> League and Match Details </Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField label="League" name="league" value={currentTicket.league} fullWidth onChange={handleChange} />
                  <TextField label="Match Datetime" name="match_datetime" type="datetime-local" 
                    value={currentTicket.match_datetime} fullWidth onChange={handleChange} 
                    InputLabelProps={{ shrink: true }} 
                  />
                </Stack>
                <TextField label="Match Name" name="match_name" value={currentTicket.match_name} placeholder="Chivas vs America"  fullWidth onChange={handleChange} />
                <TextField label="Pick" name="pick" value={currentTicket.pick} placeholder="Ej: Over 2.5, Chivas gana" fullWidth onChange={handleChange} />
              </Stack>
            </Box>

            <hr style={{ border: '0.5px solid #eee' }} />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Results</Typography>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <TextField label="Odds" name="odds" type="number" value={currentTicket.odds} fullWidth onChange={handleChange} />
                  <TextField label="Stake" name="stake" type="number" value={currentTicket.stake} fullWidth onChange={handleChange} />
                </Stack>

                <Stack direction="row" spacing={2}>
                  <TextField label="Payout" name="payout" type="number" value={currentTicket.payout} fullWidth onChange={handleChange} />
                  <TextField label="Net Profit" name="net_profit" type="number" value={currentTicket.net_profit} fullWidth onChange={handleChange} />
                </Stack>

                <TextField label="Status" name="status" select value={currentTicket.status} fullWidth onChange={handleChange}>
                  {STATUS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>Others</Typography>
              <Stack spacing={2}>
                <TextField label="Device Type" name="device_type" select value={currentTicket.device_type} fullWidth onChange={handleChange}>
                  { DEVICE_TYPES.map((d) => (
                    <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                  ))
                  }
                </TextField>
                <TextField label="Studied" name="studied" type="checkbox" value={currentTicket.studied} fullWidth onChange={handleChange}/>
                <TextField label="Comments" name="comments" multiline rows={4} value={currentTicket.comments} fullWidth onChange={handleChange}/>
                  
              </Stack>
            </Box>

            <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 'bold' }}> TICKET IMAGE </Typography>
              
             <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </Box>

            <Button variant="contained" onClick={handleSubmit} size="large" fullWidth sx={{ py: 1.5, fontWeight: 'bold' }}>
              Save Ticket
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Bets;

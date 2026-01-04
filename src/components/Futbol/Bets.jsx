import { useEffect, useState } from "react";
import { Box, Button, Chip, IconButton, Stack, Typography } from "@mui/material";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material';
import TicketModal from '../modals/ticketModal.jsx';

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
      <TicketModal 
        openModal={openModal} 
        setOpenModal={setOpenModal} 
        currentTicket={currentTicket} 
        handleChange={handleChange} 
        handleSubmit={handleSubmit} 
        setFile={setFile} 
      />
    </Box>
  );
}

export default Bets;

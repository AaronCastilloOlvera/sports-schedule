import { useEffect, useState } from "react";
import { Box, Chip, Fab, IconButton, Stack, Typography } from "@mui/material";
import { apiClient } from '../../api/api.js';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Delete, Edit, RemoveRedEye } from '@mui/icons-material';
import TicketModal from "./../modals/TicketModal";
import FutbolCharts from "./FutbolCharts";

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
    apiClient.fetchTickets()
      .then((tickets) => { setTickets(tickets) }) 
      .catch((error) => console.error(error));
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

  const handleAdd = () => {
    setCurrentTicket(initialStatedata);
    setEditId(null);
    setOpenModal(true);
  }

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
    { field: 'ticket_id', headerName: 'ID', width: 120},
    { field: 'pick', headerName: 'Pick', width: 250 },
    { 
      field: 'odds', 
      headerName: 'Odds', 
      type: 'number', 
      width: 90,
      renderCell: (params) => <strong>{params.formattedValue}</strong>,
      valueFormatter: (value) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value || 0)
    },
    { 
      field: 'stake', 
      headerName: 'Stake', 
      type: 'number', 
      width: 100,
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
      renderCell: (params) => {
        const value = params.value || 0;
        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Math.abs(value));

        return (
          <span style={{ color: value >= 0 ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
            {value >= 0 ? `+$${formatted}` : `-$${formatted}`}
          </span>
        )
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100,
      renderCell: (params) => {
        const color = params.value === 'won' ? 'success' : params.value === 'lost' ? 'error' : 'warning';
        return <Chip label={params.value.toUpperCase()} color={color} size="small" />;
      }
    },
    { 
      field: 'match_datetime', 
      headerName: 'Date Event', 
      width: 100,
      valueGetter: (value) => new Date(value).toLocaleDateString()
    },
    {
      field: 'actions',
      width: 150,
      headerName: 'Accions',
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton color="info" onClick={() => handleDelete(params.row.ticket_id)} size="small">
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Bets Log</Typography>
        <Fab size="small" color="primary" aria-label="add" onClick={handleAdd}>
          <Add />
        </Fab>
      </Stack>

      <Box sx={{ height: '100%', width: '100%', backgroundColor: 'white', borderRadius: 2, boxShadow: 2 }}>
        <DataGrid
          rows={tickets}
          columns={columns}
          getRowId={(row) => row.ticket_id}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          rowHeight={42}
          sx={{
            '& .MuiDataGrid-cell': {
              alignItems: 'center',
              display: 'flex'
            },
            '& .MuiDataGrid-columnHeader': {
              alignItems: 'center',
              display: 'flex'
            }
          }}
        />
      </Box>
      <TicketModal 
        openModal={openModal} 
        setOpenModal={setOpenModal} 
        currentTicket={currentTicket} 
        handleChange={handleChange} 
        handleSubmit={handleSubmit} 
        setFile={setFile}
        file={file}
      />
      <FutbolCharts />
    </Box>
  );
}

export default Bets;

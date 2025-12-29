import { useEffect, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { apiClient } from '../../api/api.js';
import PropTypes from 'prop-types';
import { DataGrid } from '@mui/x-data-grid';

function Bets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    let mounted = true;
    apiClient.fetchBets()
      .then((tickets) => {
        if (mounted) setTickets(tickets);
        console.log('Tickets fetched:', tickets);
      }) 
      .catch((error) => console.error(error));
    return () => { mounted = false; };
  }, []);

  const columns = [
    { field: 'ticket_id', headerName: 'ID', width: 105 },
    { field: 'match_name', headerName: 'Partido', width: 200 },
    { field: 'league', headerName: 'Liga', width: 130 },
    { field: 'pick', headerName: 'Selección', width: 180 },
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
    }
  ];

  const BetHistoryTable = ({ rows }) => {
    return (
      <Box sx={{ height: 400, width: '100%', p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Historial de Apuestas
        </Typography>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.ticket_id}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:hover': { color: 'primary.main' },
            backgroundColor: 'white',
            boxShadow: 2,
            borderRadius: 2,
          }}
        />
      </Box>
    );
  };

  BetHistoryTable.propTypes = {
      rows: PropTypes.array.isRequired,
    };
  
  return (
    <BetHistoryTable rows={tickets}></BetHistoryTable>
  );
}

export default Bets;

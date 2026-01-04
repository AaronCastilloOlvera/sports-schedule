import { useCallback, useEffect } from "react";
import { Box, Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { BET_TYPES, SPORT_TYPES, STATUS, DEVICE_TYPES} from "../../utils/consts.jsx"; 
import PropTypes from "prop-types";

function TicketModal({openModal, setOpenModal, currentTicket, handleChange, handleSubmit, setFile, file}) {

  const handlePaste = useCallback((event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        const imageFile = new File([blob], "pasted-image.png", { type: blob.type });
        setFile(imageFile);
        break; 
      }
    }
  }, [setFile]);

  useEffect(() => {
    if (openModal) {
      window.addEventListener('paste', handlePaste);
    }

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [openModal, handlePaste]);

  return (
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
              <FormControlLabel
                control={
                  <Checkbox
                    name="studied"
                    checked={currentTicket.studied}
                    onChange={handleChange}
                  />
                }
                label="Studied"
              />
              <TextField label="Comments" name="comments" multiline rows={4} value={currentTicket.comments} fullWidth onChange={handleChange}/>
                
            </Stack>
          </Box>

          <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 'bold' }}> TICKET IMAGE </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Paste image from clipboard or select a file.</Typography>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            {file && <Typography variant="body2" sx={{mt: 1}}>Selected file: {file.name}</Typography>}
          </Box>

          <Button variant="contained" onClick={handleSubmit} size="large" fullWidth sx={{ py: 1.5, fontWeight: 'bold' }}>
            Save Ticket
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

TicketModal.propTypes = {
  openModal: PropTypes.bool.isRequired,
  setOpenModal: PropTypes.func.isRequired,
  currentTicket: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  setFile: PropTypes.func.isRequired,
  file: PropTypes.object,
};

export default TicketModal;
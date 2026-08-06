import React, { useState } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Paper,
  IconButton,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { selectPozzo, deletePozzo, deleteEttaroBagnato } from '../store/appSlice';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NuovoPozzoModal from './NuovoPozzoModal';
import ConfirmDeleteButton from './ConfirmDeleteButton';
import wellImage from '../assets/well.png';


const ListArea: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pozzi, ettariBagnati, selectedPozzoId, selectedClienteId } = useSelector(
    (state: RootState) => state.app
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [pozzoToEdit, setPozzoToEdit] = useState<any>(null);

  // Show only pozzi for the currently selected client
  const clientePozzi = pozzi.filter((p) => p.id_cliente === selectedClienteId);

  const filteredPozzi = clientePozzi.filter(
    (p) =>
      p.comune.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.localita.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Cerca per comune o località..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Nuovo
        </Button>
      </Box>

      <Paper sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#f5f7f9' }}>
        <List sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filteredPozzi.map((pozzo) => {
            const pozzoEttari = ettariBagnati.filter(e => e.id_pozzo === pozzo.id);
            return (
              <Accordion
                key={pozzo.id}
                expanded={selectedPozzoId === pozzo.id}
                onChange={(_, expanded) => {
                  if (expanded) {
                    dispatch(selectPozzo(pozzo.id));
                  } else {
                    dispatch(selectPozzo(null));
                  }
                }}
                elevation={0}
                disableGutters
                sx={{
                  '&:before': { display: 'none' },
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <img
                        src={wellImage}
                        alt="Pozzo"
                        style={{
                          width: 24,
                          height: 24,
                          filter: selectedPozzoId === pozzo.id ? 'drop-shadow(0px 0px 2px rgba(0,0,0,0.5))' : 'grayscale(100%) opacity(0.6)'
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${pozzo.comune} - ${pozzo.localita}`}
                      secondary={`Ettari bagnati: ${pozzo.ettari_bagnati}`}
                      sx={{ flexGrow: 1 }}
                    />
                    <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <IconButton aria-label="edit" onClick={() => { setPozzoToEdit(pozzo); setModalOpen(true); }} sx={{ mr: 1 }} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <ConfirmDeleteButton
                        onConfirm={() => dispatch(deletePozzo(pozzo.id))}
                      />
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: '#ffffff', p: 2 }}>
                  {pozzoEttari.length > 0 ? (
                    <List dense disablePadding>
                      {pozzoEttari.map((ettaro) => (
                        <ListItem key={ettaro.id} sx={{ bgcolor: '#f5f7f9', mb: 1, p: 2, borderRadius: 1 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '50%',
                                bgcolor: ettaro.colore || '#ccc'
                              }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${ettaro.comune} - ${ettaro.localita}`}
                            secondary={`Fg: ${ettaro.foglio} Part: ${ettaro.particella} | Ettari: ${ettaro.ettari} | ${ettaro.tipologia}`}
                            slotProps={{
                              primary: { variant: 'body2', sx: { fontWeight: 'bold' } },
                              secondary: { variant: 'caption' }
                            }}
                          />
                          <Box sx={{ ml: 2 }}>
                            <ConfirmDeleteButton
                              onConfirm={() => dispatch(deleteEttaroBagnato(ettaro.id))}
                            />
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                      Nessun ettaro bagnato associato.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
          {filteredPozzi.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              {clientePozzi.length === 0
                ? 'Nessun pozzo per questo cliente. Creane uno!'
                : 'Nessun pozzo trovato.'}
            </Typography>
          )}
        </List>
      </Paper>

      {selectedClienteId !== null && (
        <NuovoPozzoModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setPozzoToEdit(null); }}
          idCliente={selectedClienteId}
          pozzoToEdit={pozzoToEdit}
        />
      )}
    </Box>
  );
};

export default ListArea;

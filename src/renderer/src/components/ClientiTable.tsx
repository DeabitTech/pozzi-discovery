import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Chip,
  Skeleton,
  Tooltip,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WaterIcon from '@mui/icons-material/Water';
import EditIcon from '@mui/icons-material/Edit';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { selectCliente, deleteCliente } from '../store/appSlice';

import ClienteModal from './ClienteModal';
import ConfirmDeleteButton from './ConfirmDeleteButton';


const ClientiTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clienti, pozzi, loading, formMetadata = [] } = useSelector((state: RootState) => state.app);
  const clientiMetadata = formMetadata.filter((m: any) => m.table_name === 'clienti');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteToEdit, setClienteToEdit] = useState<any>(null);

  const filteredClienti = clienti.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.ragione_sociale?.toLowerCase().includes(q) ||
      c.codice_fiscale?.toLowerCase().includes(q) ||
      c.legale_rappresentante?.toLowerCase().includes(q) ||
      c.partita_iva?.toLowerCase().includes(q)
    );
  });

  const getPozziCount = (clienteId: number) =>
    pozzi.filter((p) => p.id_cliente === clienteId).length;


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Clienti
        </Typography>
        <TextField
          size="small"
          placeholder="Cerca cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setModalOpen(true)}
        >
          Nuovo Cliente
        </Button>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{ flexGrow: 1, overflow: 'auto' }}
        elevation={2}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Ragione Sociale</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Legale Rappresentante</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Codice Fiscale</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Partita IVA</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Sede Legale</TableCell>
              {clientiMetadata.map((meta: any) => (
                <TableCell key={meta.column_name} sx={{ fontWeight: 700 }}>{meta.display_label || meta.column_name}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Pozzi</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && clienti.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 + clientiMetadata.length }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredClienti.map((cliente) => {
                  const count = getPozziCount(cliente.id);
                  return (
                    <TableRow
                      key={cliente.id}
                      hover
                      onClick={() => dispatch(selectCliente(cliente.id))}
                      sx={{
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        '&:hover td': { color: 'primary.main' },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{cliente.ragione_sociale}</Typography>
                      </TableCell>
                      <TableCell>{cliente.legale_rappresentante || '—'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {cliente.codice_fiscale || '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {cliente.partita_iva || '—'}
                      </TableCell>
                      <TableCell>{cliente.indirizzo_sede_legale || '—'}</TableCell>
                      {clientiMetadata.map((meta: any) => (
                        <TableCell key={meta.column_name}>
                          {cliente[meta.column_name] || '—'}
                        </TableCell>
                      ))}
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Tooltip title={`${count} pozzo/i associati`}>
                          <Chip
                            icon={<WaterIcon fontSize="small" />}
                            label={count}
                            size="small"
                            color={count > 0 ? 'primary' : 'default'}
                            variant={count > 0 ? 'filled' : 'outlined'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setClienteToEdit(cliente);
                              setModalOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <ConfirmDeleteButton 
                            onConfirm={() => dispatch(deleteCliente(cliente.id))} 
                          />
                          <ChevronRightIcon color="action" />
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

            {!loading && filteredClienti.length === 0 && (
              <TableRow>
                <TableCell colSpan={8 + clientiMetadata.length} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">
                    {searchTerm ? 'Nessun cliente trovato per questa ricerca.' : 'Nessun cliente presente. Creane uno con "Nuovo Cliente".'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ClienteModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setClienteToEdit(null); }} 
        clienteToEdit={clienteToEdit}
      />
    </Box>
  );
};

export default ClientiTable;

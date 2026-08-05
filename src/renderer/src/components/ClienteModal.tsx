import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createCliente, updateCliente, NewClientePayload } from '../store/appSlice';

interface ClienteModalProps {
  open: boolean;
  onClose: () => void;
  clienteToEdit?: any;
}

const emptyForm: NewClientePayload = {
  ragione_sociale: '',
  codice_fiscale: '',
  partita_iva: '',
  legale_rappresentante: '',
  indirizzo_sede_legale: '',
};

const ClienteModal: React.FC<ClienteModalProps> = ({ open, onClose, clienteToEdit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const formMetadata = useSelector((state: RootState) => state.app.formMetadata || []);
  const clientiMetadata = formMetadata.filter((m: any) => m.table_name === 'clienti');

  const [form, setForm] = useState<NewClientePayload>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (clienteToEdit) {
        setForm({
          ragione_sociale: clienteToEdit.ragione_sociale || '',
          codice_fiscale: clienteToEdit.codice_fiscale || '',
          partita_iva: clienteToEdit.partita_iva || '',
          legale_rappresentante: clienteToEdit.legale_rappresentante || '',
          indirizzo_sede_legale: clienteToEdit.indirizzo_sede_legale || '',
          ...clientiMetadata.reduce((acc: any, meta: any) => {
            acc[meta.column_name] = clienteToEdit[meta.column_name] || '';
            return acc;
          }, {})
        });
      } else {
        setForm({
          ...emptyForm,
          ...clientiMetadata.reduce((acc: any, meta: any) => {
            acc[meta.column_name] = '';
            return acc;
          }, {})
        });
      }
    }
  }, [open, clienteToEdit, formMetadata.length]);

  const handleChange = (field: keyof NewClientePayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.ragione_sociale.trim()) {
      setError('La ragione sociale è obbligatoria.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (clienteToEdit) {
        await dispatch(updateCliente({ id: clienteToEdit.id, data: form })).unwrap();
      } else {
        await dispatch(createCliente(form)).unwrap();
      }
      setForm(emptyForm);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(emptyForm);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {clienteToEdit ? <EditIcon color="primary" /> : <PersonAddIcon color="primary" />}
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          {clienteToEdit ? 'Modifica Cliente' : 'Nuovo Cliente'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              required
              label="Ragione Sociale"
              value={form.ragione_sociale}
              onChange={handleChange('ragione_sociale')}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Codice Fiscale"
              value={form.codice_fiscale}
              onChange={handleChange('codice_fiscale')}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Partita IVA"
              value={form.partita_iva}
              onChange={handleChange('partita_iva')}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Legale Rappresentante"
              value={form.legale_rappresentante}
              onChange={handleChange('legale_rappresentante')}
              disabled={loading}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Indirizzo Sede Legale"
              value={form.indirizzo_sede_legale}
              onChange={handleChange('indirizzo_sede_legale')}
              disabled={loading}
            />
          </Grid>
          {/* Campi Dinamici Cliente */}
          {clientiMetadata.map((meta: any) => (
            <Grid size={{ xs: 12, sm: 6 }} key={meta.column_name}>
              {meta.field_type === 'DATE' ? (
                <DatePicker
                  label={meta.display_label || meta.column_name}
                  value={form[meta.column_name] ? dayjs(form[meta.column_name]) : null}
                  onChange={(newValue) => {
                    setForm((prev) => ({
                      ...prev,
                      [meta.column_name]: newValue ? newValue.format('YYYY-MM-DD') : ''
                    }));
                  }}
                  disabled={loading}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              ) : (
                <TextField
                  fullWidth
                  label={meta.display_label || meta.column_name}
                  type={meta.field_type === 'NUMBER' ? 'number' : 'text'}
                  value={form[meta.column_name] || ''}
                  onChange={handleChange(meta.column_name as keyof NewClientePayload)}
                  disabled={loading}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Annulla
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (clienteToEdit ? <EditIcon /> : <PersonAddIcon />)}
        >
          {loading ? 'Salvataggio...' : (clienteToEdit ? 'Salva Modifiche' : 'Crea Cliente')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClienteModal;

import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Stack,
  IconButton,
  Autocomplete,
  createFilterOptions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import WaterIcon from '@mui/icons-material/Water';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import { createPozzo, updatePozzo, createEttaroBagnato, deleteEttariByPozzo, deletePozzo, Pozzo } from '../store/appSlice';

async function getWFSGeoJSON(lat: number, lon: number, particella: string): Promise<any> {
  try {
    const delta = 0.0005;
    const bbox = `${lat - delta},${lon - delta},${lat + delta},${lon + delta},urn:ogc:def:crs:EPSG::6706`;
    const WFS_URL = `https://wfs.cartografia.agenziaentrate.gov.it/inspire/wfs/owfs01.php?service=WFS&version=2.0.0&request=GetFeature&typeNames=CP:CadastralParcel&BBOX=${bbox}`;
    
    console.log("🔗 Chiamata WFS (click to open):", WFS_URL);
    const res = await window.api.fetchWFS(WFS_URL);
    if (!res.success || !res.data) {
      console.error("WFS Fetch failed:", res.error);
      return null;
    }
    const text = res.data;
    
    const members = text.split(/<wfs:member>/i);
    let targetMember = '';
    
    if (members.length > 1) {
      const cleanParticella = particella.trim();
      targetMember = members.find(m => m.includes(`<CP:LABEL>${cleanParticella}</CP:LABEL>`)) || members[1];
    } else {
      targetMember = text;
    }
    
    const posListMatch = targetMember.match(/<gml:posList[^>]*>(.*?)<\/gml:posList>/);
    if (posListMatch && posListMatch[1]) {
      const coords = posListMatch[1].trim().split(/\s+/).map(Number);
      const polygon: [number, number][] = [];
      for (let i = 0; i < coords.length; i += 2) {
        polygon.push([coords[i+1], coords[i]]);
      }
      return {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [polygon] },
        properties: {}
      };
    }
    return null;
  } catch (err) {
    console.error("WFS Fetch error:", err);
    return null;
  }
}

interface NuovoPozzoModalProps {
  open: boolean;
  onClose: () => void;
  idCliente: number;
  pozzoToEdit?: Pozzo;
}

interface PozzoForm {
  codice_derivazione: string;
  comune: string;
  localita: string;
  foglio: string;
  particella: string;
  ettari_bagnati: string;
  scadenza_concessione: string;
  coordinate: string;
  documento_pdf: string;
  consumo_mc: string;
  [key: string]: any;
}

interface EttaroBagnatoForm {
  comune: string;
  localita: string;
  foglio: string;
  particella: string;
  ettari: string;
  tipologia: string;
  proprieta: string;
  coordinate: string;
  poligono: string;
  colore: string;
  isNew?: boolean;
  _id?: string;
  error?: string;
  [key: string]: any;
}

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const filterComuniOptions = createFilterOptions<{nome: string, codiceCatastale: string}>({
  limit: 50,
});

const emptyForm: PozzoForm = {
  codice_derivazione: '',
  comune: '',
  localita: '',
  foglio: '',
  particella: '',
  ettari_bagnati: '',
  scadenza_concessione: '',
  coordinate: '',
  documento_pdf: '',
  consumo_mc: '',
};

const emptyEttaroForm: EttaroBagnatoForm = {
  comune: '',
  localita: '',
  foglio: '',
  particella: '',
  ettari: '',
  tipologia: '',
  proprieta: '',
  coordinate: '',
  poligono: '',
  colore: '',
  isNew: true,
  error: '',
};

const NuovoPozzoModal: React.FC<NuovoPozzoModalProps> = ({ open, onClose, idCliente, pozzoToEdit }) => {
  const dispatch = useDispatch<AppDispatch>();
  const ettariBagnatiInStore = useSelector((state: any) => state.app.ettariBagnati);
  const formMetadata = useSelector((state: any) => state.app.formMetadata || []);
  const pozziMetadata = formMetadata.filter((m: any) => m.table_name === 'pozzi_clienti');
  const ettariMetadata = formMetadata.filter((m: any) => m.table_name === 'ettari_bagnati');

  const [form, setForm] = useState<PozzoForm>(emptyForm);
  const [ettariForms, setEttariForms] = useState<EttaroBagnatoForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comuniList, setComuniList] = useState<{nome: string, codiceCatastale: string}[]>([]);

  useEffect(() => {
    const fetchComuni = async () => {
      try {
        const res = await window.api.getComuni();
        if (res.success && res.data) {
          setComuniList(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch comuni', err);
      }
    };
    fetchComuni();
  }, []);

  useEffect(() => {
    if (pozzoToEdit) {
      setForm({
        codice_derivazione: pozzoToEdit.codice_derivazione || '',
        comune: pozzoToEdit.comune || '',
        localita: pozzoToEdit.localita || '',
        foglio: pozzoToEdit.foglio || '',
        particella: pozzoToEdit.particella || '',
        ettari_bagnati: pozzoToEdit.ettari_bagnati ? pozzoToEdit.ettari_bagnati.toString().replace('.', ',') : '',
        scadenza_concessione: pozzoToEdit.scadenza_concessione || '',
        coordinate: pozzoToEdit.coordinate || '',
        documento_pdf: pozzoToEdit.documento_pdf || '',
        consumo_mc: pozzoToEdit.consumo_mc ? pozzoToEdit.consumo_mc.toString().replace('.', ',') : '',
        ...pozziMetadata.reduce((acc: any, meta: any) => {
          acc[meta.column_name] = pozzoToEdit[meta.column_name] || '';
          return acc;
        }, {})
      });
      // Load existing ettari
      const existingEttari = ettariBagnatiInStore.filter((e: any) => e.id_pozzo === pozzoToEdit.id);
      const mappedForms: EttaroBagnatoForm[] = existingEttari.map((e: any) => ({
        comune: e.comune || '',
        localita: e.localita || '',
        foglio: e.foglio || '',
        particella: e.particella || '',
        ettari: e.ettari ? e.ettari.toString().replace('.', ',') : '',
        tipologia: e.tipologia || '',
        proprieta: e.proprieta || '',
        coordinate: e.coordinate || '',
        poligono: e.poligono || '',
        colore: e.colore || getRandomColor(),
        isNew: false,
        _id: crypto.randomUUID(),
        ...ettariMetadata.reduce((acc: any, meta: any) => {
          acc[meta.column_name] = e[meta.column_name] || '';
          return acc;
        }, {})
      }));
      setEttariForms(mappedForms);
    } else {
      setForm({
        ...emptyForm,
        ...pozziMetadata.reduce((acc: any, meta: any) => {
          acc[meta.column_name] = '';
          return acc;
        }, {})
      });
      setEttariForms([]);
    }
  }, [pozzoToEdit, open, formMetadata.length]);

  const handleChange = (field: keyof PozzoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleEttaroChange = (index: number, field: keyof EttaroBagnatoForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setEttariForms((prev) => {
      const newForms = [...prev];
      newForms[index] = { ...newForms[index], [field]: e.target.value };
      return newForms;
    });
  };

  const handleFetchCoordinate = async () => {
    setLoading(true);
    setError(null);
    try {
      const selectedComune = comuniList.find(c => c.nome === form.comune);
      const codiceCatastale = selectedComune ? selectedComune.codiceCatastale : form.comune;
      
      const res = await window.api.fetchCoordinates(codiceCatastale, form.foglio, form.particella);
      if (res.success && res.data) {
        const data = res.data;
        setForm(prev => ({ ...prev, coordinate: `[${data[0]}, ${data[1]}]` }));
      } else {
        setError(res.error || "Coordinate non trovate per questi dati catastali.");
      }
    } catch (err: any) {
      setError(err.message || "Errore durante la ricerca delle coordinate.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchEttaroCoordinate = async (index: number) => {
    setLoading(true);
    handleEttaroChange(index, 'error')({ target: { value: '' } } as any);
    try {
      const ettaroForm = ettariForms[index];
      const selectedComune = comuniList.find(c => c.nome === ettaroForm.comune);
      const codiceCatastale = selectedComune ? selectedComune.codiceCatastale : ettaroForm.comune;
      
      const res = await window.api.fetchCoordinates(codiceCatastale, ettaroForm.foglio, ettaroForm.particella);
      if (res.success && res.data) {
        const [lat, lon] = res.data;
        // Salva le coordinate pulite nel form
        handleEttaroChange(index, 'coordinate')({ target: { value: `[${lat}, ${lon}]` } } as any);
        
        // Cerca il GeoJSON dal WFS specificando la particella per evitare collisioni col BBOX
        const geojson = await getWFSGeoJSON(lat, lon, ettaroForm.particella);
        if (geojson) {
           handleEttaroChange(index, 'poligono')({ target: { value: JSON.stringify(geojson) } } as any);
        } else {
          handleEttaroChange(index, 'error')({ target: { value: "Poligono WFS non trovato per questi dati catastali." } } as any);
        }
      } else {
        handleEttaroChange(index, 'error')({ target: { value: res.error || "Coordinate non trovate per questi dati catastali." } } as any);
      }
    } catch (err: any) {
      handleEttaroChange(index, 'error')({ target: { value: err.message || "Errore durante la ricerca delle coordinate dell'ettaro." } } as any);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEttaro = () => {
    setEttariForms((prev) => [{ 
      ...emptyEttaroForm, 
      colore: getRandomColor(), 
      _id: crypto.randomUUID(),
      ...ettariMetadata.reduce((acc: any, meta: any) => {
        acc[meta.column_name] = '';
        return acc;
      }, {})
    }, ...prev]);
  };

  const handleRemoveEttaro = (index: number) => {
    setEttariForms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.comune.trim()) return setError('Il comune è obbligatorio.');
    if (!form.localita.trim()) return setError('La località è obbligatoria.');
    if (!form.foglio.trim()) return setError('Il foglio è obbligatorio.');
    if (!form.particella.trim()) return setError('La particella è obbligatoria.');
    if (!form.ettari_bagnati.toString().trim()) return setError('Gli ettari bagnati sono obbligatori.');
    if (!form.scadenza_concessione.trim()) return setError('La scadenza concessione è obbligatoria.');
    if (!form.coordinate.trim()) return setError('Le coordinate sono obbligatorie.');

    for (const meta of pozziMetadata) {
      const val = form[meta.column_name];
      if (val === undefined || val === null || val.toString().trim() === '') {
        return setError(`Il campo ${meta.display_label || meta.column_name} è obbligatorio.`);
      }
    }

    if (form.coordinate.trim()) {
      try {
        const parsed = JSON.parse(form.coordinate);
        if (!Array.isArray(parsed) || parsed.length !== 2) {
          setError('Le coordinate devono essere nel formato [latitudine, longitudine], es: [41.88, 15.92]');
          return;
        }
      } catch {
        setError('Formato coordinate non valido. Usa JSON: [latitudine, longitudine], es: [41.88, 15.92]');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      if (!form.comune) {
        throw new Error('Comune è obbligatorio.');
      }

      let finalPdfPath = form.documento_pdf;
      if (finalPdfPath && !finalPdfPath.includes('pdfs')) {
        const res = await window.api.savePdf(finalPdfPath);
        if (res && res.success && res.data) {
          finalPdfPath = res.data;
        } else {
          throw new Error(res.error || 'Errore durante il salvataggio del PDF.');
        }
      }

      let pozzoId = pozzoToEdit?.id;

      if (pozzoToEdit) {
        await dispatch(
          updatePozzo({
            id: pozzoToEdit.id,
            data: {
              ...form,
              documento_pdf: finalPdfPath,
              ettari_bagnati: parseFloat(form.ettari_bagnati.toString().replace(',', '.')) || 0,
              consumo_mc: parseFloat(form.consumo_mc.toString().replace(',', '.')) || 0,
              id_cliente: idCliente,
            }
          })
        ).unwrap();
        // Delete all existing ettari for this pozzo so we can recreate them with any edits
        await dispatch(deleteEttariByPozzo(pozzoToEdit.id)).unwrap();
      } else {
        const result = await dispatch(
          createPozzo({
            ...form,
            documento_pdf: finalPdfPath,
            ettari_bagnati: parseFloat(form.ettari_bagnati.toString().replace(',', '.')) || 0,
            consumo_mc: parseFloat(form.consumo_mc.toString().replace(',', '.')) || 0,
            id_cliente: idCliente,
          })
        ).unwrap();
        pozzoId = result.lastInsertRowid;
      }

      // Check if ettaro forms have some data, then save them
      if (pozzoId) {
        try {
          for (const ettaroForm of ettariForms) {
            if (ettaroForm.comune.trim() || ettaroForm.particella.trim() || ettaroForm.foglio.trim()) {
              const { isNew, _id, error: ettaroError, ...cleanEttaroForm } = ettaroForm;
              await dispatch(
                createEttaroBagnato({
                  ...cleanEttaroForm,
                  ettari: parseFloat(ettaroForm.ettari.toString().replace(',', '.')) || 0,
                  id_pozzo: pozzoId,
                })
              ).unwrap();
            }
          }
        } catch (err) {
          if (!pozzoToEdit) {
            await dispatch(deletePozzo(pozzoId)).unwrap();
          }
          throw err;
        }
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(emptyForm);
    setEttariForms([]);
    setError(null);
    onClose();
  };

  const totaleEttari = 
    (parseFloat(form.ettari_bagnati?.toString().replace(',', '.')) || 0) + 
    ettariForms.reduce((sum, ef) => sum + (parseFloat(ef.ettari?.toString().replace(',', '.')) || 0), 0);

  const canoneFisso = Math.max(20, totaleEttari * 1);
  const canoneVariabile = (parseFloat(form.consumo_mc?.toString().replace(',', '.')) || 0) * 0.002;
  const canoneTotale = canoneFisso + canoneVariabile;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WaterIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
          {pozzoToEdit ? 'Modifica Pozzo' : 'Nuovo Pozzo'}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Codice Derivazione"
                value={form.codice_derivazione}
                onChange={handleChange('codice_derivazione')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={comuniList}
                filterOptions={filterComuniOptions as any}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.nome} (${option.codiceCatastale})`}
                value={comuniList.find(c => c.nome === form.comune) || form.comune}
                onChange={(_event, newValue) => {
                  if (typeof newValue === 'string') {
                    setForm(prev => ({ ...prev, comune: newValue }));
                  } else if (newValue && newValue.nome) {
                    setForm(prev => ({ ...prev, comune: newValue.nome }));
                    console.log(`Comune selezionato: ${newValue.nome}, Codice Catastale: ${newValue.codiceCatastale}`);
                  } else {
                    setForm(prev => ({ ...prev, comune: '' }));
                  }
                }}
                onInputChange={(_event, newInputValue) => {
                  setForm(prev => ({ ...prev, comune: newInputValue }));
                }}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Comune"
                    fullWidth
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Località"
                value={form.localita}
                onChange={handleChange('localita')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Foglio"
                value={form.foglio}
                onChange={handleChange('foglio')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Particella"
                value={form.particella}
                onChange={handleChange('particella')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Ettari Bagnati"
                type="text"
                value={form.ettari_bagnati}
                onChange={(e) => {
                  let val = e.target.value.replace(/\./g, ',');
                  val = val.replace(/[^0-9,]/g, '');
                  const parts = val.split(',');
                  if (parts.length > 2) {
                    val = parts[0] + ',' + parts.slice(1).join('');
                  }
                  setForm((prev) => ({ ...prev, ettari_bagnati: val }));
                }}
                disabled={loading}
                slotProps={{
                  htmlInput: { step: '0.01', min: '0' },
                  input: {
                    endAdornment: <InputAdornment position="end">ha</InputAdornment>,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Scadenza Concessione"
                format="DD/MM/YYYY"
                value={form.scadenza_concessione ? dayjs(form.scadenza_concessione) : null}
                onChange={(newValue) => {
                  setForm((prev) => ({
                    ...prev,
                    scadenza_concessione: newValue ? newValue.format('YYYY-MM-DD') : ''
                  }));
                }}
                disabled={loading}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Documento PDF</Typography>
                {form.documento_pdf ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                      <PictureAsPdfIcon color="error" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {form.documento_pdf.split('/').pop()?.split('\\').pop()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Apri PDF">
                        <IconButton size="small" onClick={() => window.api.openPdf(form.documento_pdf)}><OpenInNewIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Rimuovi">
                        <IconButton size="small" color="error" onClick={() => setForm(p => ({...p, documento_pdf: ''}))}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<FileUploadIcon />}
                    size="small"
                    disabled={loading}
                    fullWidth
                    onClick={async () => {
                      const path = await window.api.selectPdf();
                      if (path) {
                        setForm(p => ({...p, documento_pdf: path}));
                      }
                    }}
                  >
                    Allega PDF
                  </Button>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Consumo Contatore (mc)"
                type="text"
                value={form.consumo_mc}
                onChange={(e) => {
                  let val = e.target.value.replace(/\./g, ',');
                  val = val.replace(/[^0-9,]/g, '');
                  const parts = val.split(',');
                  if (parts.length > 2) {
                    val = parts[0] + ',' + parts.slice(1).join('');
                  }
                  setForm((prev) => ({ ...prev, consumo_mc: val }));
                }}
                disabled={loading}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">mc</InputAdornment>,
                  },
                }}
              />
            </Grid>
            {/* Campi Dinamici Pozzo */}
            {pozziMetadata.map((meta: any) => (
              <Grid size={{ xs: 12, sm: 6 }} key={meta.column_name}>
                {meta.field_type === 'DATE' ? (
                  <DatePicker
                    label={meta.display_label || meta.column_name}
                    format="DD/MM/YYYY"
                    value={form[meta.column_name] ? dayjs(form[meta.column_name]) : null}
                    onChange={(newValue) => {
                      setForm((prev) => ({
                        ...prev,
                        [meta.column_name]: newValue ? newValue.format('YYYY-MM-DD') : ''
                      }));
                    }}
                    disabled={loading}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    required
                    label={meta.display_label || meta.column_name}
                    type={meta.field_type === 'NUMBER' ? 'number' : 'text'}
                    value={form[meta.column_name] || ''}
                    onChange={handleChange(meta.column_name as keyof PozzoForm)}
                    disabled={loading}
                  />
                )}
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  required
                  label="Coordinate"
                  placeholder="[41.88, 15.92]"
                  value={form.coordinate}
                  onChange={handleChange('coordinate')}
                  disabled={loading}
                  helperText="Formato JSON: [latitudine, longitudine]"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Inserisci le coordinate come array JSON: [latitudine, longitudine]. Es: [41.88, 15.92]">
                            <InfoOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleFetchCoordinate}
                  disabled={loading || !form.comune || !form.foglio || !form.particella}
                  sx={{ mb: '23px', minWidth: '100px' }}
                >
                  Trova
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* RIEPILOGO COSTI */}
        <Box sx={{ px: 3, pb: 1 }}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
              Riepilogo Canone Annuo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Canone Fisso (Ettari)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>€ {canoneFisso.toFixed(2).replace('.', ',')}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Canone Variabile (Consumo)</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>€ {canoneVariabile.toFixed(3).replace('.', ',')}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="body2" color="text.secondary">Totale da Pagare</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>€ {canoneTotale.toFixed(2).replace('.', ',')}</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Box sx={{ px: 3, pb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Ettari Bagnati Associati
            </Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={handleAddEttaro} variant="outlined">
              Aggiungi Ettaro
            </Button>
          </Box>

          <Stack spacing={2}>
            {ettariForms.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Nessun ettaro bagnato associato. Clicca su "Aggiungi Ettaro" per inserirne uno.
              </Typography>
            )}
            {ettariForms.map((ettaroForm, index) => (
              <Accordion
                key={ettaroForm._id || index}
                elevation={0}
                defaultExpanded={ettaroForm.isNew}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 1, gap: 1.5 }}>
                    {ettaroForm.colore && (
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: ettaroForm.colore, flexShrink: 0 }} />
                    )}
                    <Typography sx={{ fontWeight: 600, color: 'primary.main', flexGrow: 1 }}>
                      {[ettaroForm.tipologia, ettaroForm.localita, ettaroForm.proprieta].filter(Boolean).join(' - ') || `Nuovo Ettaro #${index + 1}`}
                    </Typography>
                    <IconButton component="span" size="small" color="error" onClick={(e) => { e.stopPropagation(); handleRemoveEttaro(index); }}>
                      <DeleteOutlinedIcon />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={comuniList}
                        filterOptions={filterComuniOptions as any}
                        getOptionLabel={(option) => typeof option === 'string' ? option : `${option.nome} (${option.codiceCatastale})`}
                        value={comuniList.find(c => c.nome === ettaroForm.comune) || ettaroForm.comune}
                        onChange={(_event, newValue) => {
                          if (typeof newValue === 'string') {
                            handleEttaroChange(index, 'comune')({ target: { value: newValue } } as any);
                          } else if (newValue && newValue.nome) {
                            handleEttaroChange(index, 'comune')({ target: { value: newValue.nome } } as any);
                            console.log(`Comune selezionato (Ettaro): ${newValue.nome}, Codice Catastale: ${newValue.codiceCatastale}`);
                          } else {
                            handleEttaroChange(index, 'comune')({ target: { value: '' } } as any);
                          }
                        }}
                        onInputChange={(_event, newInputValue) => {
                          handleEttaroChange(index, 'comune')({ target: { value: newInputValue } } as any);
                        }}
                        disabled={loading}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Comune"
                            fullWidth
                            size="small"
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Località"
                        value={ettaroForm.localita}
                        onChange={handleEttaroChange(index, 'localita')}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Foglio"
                        value={ettaroForm.foglio}
                        onChange={handleEttaroChange(index, 'foglio')}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Particella"
                        value={ettaroForm.particella}
                        onChange={handleEttaroChange(index, 'particella')}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Ettari"
                        type="text"
                        value={ettaroForm.ettari}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\./g, ',');
                          val = val.replace(/[^0-9,]/g, '');
                          const parts = val.split(',');
                          if (parts.length > 2) {
                            val = parts[0] + ',' + parts.slice(1).join('');
                          }
                          handleEttaroChange(index, 'ettari')({ target: { value: val } } as any);
                        }}
                        disabled={loading}
                        slotProps={{
                          htmlInput: { step: '0.01', min: '0' },
                          input: {
                            endAdornment: <InputAdornment position="end">ha</InputAdornment>,
                          },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Tipologia"
                        value={ettaroForm.tipologia}
                        onChange={handleEttaroChange(index, 'tipologia')}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Proprietà"
                        value={ettaroForm.proprieta}
                        onChange={handleEttaroChange(index, 'proprieta')}
                        disabled={loading}
                      />
                    </Grid>
                    {/* Campi Dinamici Ettaro */}
                    {ettariMetadata.map((meta: any) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={meta.column_name}>
                        {meta.field_type === 'DATE' ? (
                          <DatePicker
                            label={meta.display_label || meta.column_name}
                            value={ettaroForm[meta.column_name] ? dayjs(ettaroForm[meta.column_name]) : null}
                            onChange={(newValue) => {
                              handleEttaroChange(index, meta.column_name as keyof EttaroBagnatoForm)({
                                target: { value: newValue ? newValue.format('YYYY-MM-DD') : '' }
                              } as any);
                            }}
                            disabled={loading}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label={meta.display_label || meta.column_name}
                            type={meta.field_type === 'NUMBER' ? 'number' : 'text'}
                            value={ettaroForm[meta.column_name] || ''}
                            onChange={handleEttaroChange(index, meta.column_name as keyof EttaroBagnatoForm)}
                            disabled={loading}
                          />
                        )}
                      </Grid>
                    ))}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Coordinate"
                          value={ettaroForm.coordinate}
                          onChange={handleEttaroChange(index, 'coordinate')}
                          disabled={loading}
                        />
                        <Button 
                          variant="outlined" 
                          onClick={() => handleFetchEttaroCoordinate(index)}
                          disabled={loading || !ettaroForm.comune || !ettaroForm.foglio || !ettaroForm.particella}
                          sx={{ minWidth: '100px' }}
                        >
                          Trova
                        </Button>
                      </Box>
                      {ettaroForm.error && (
                        <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, display: 'block', fontWeight: 500 }}>
                          ❌ {ettaroForm.error}
                        </Typography>
                      )}
                      {ettaroForm.poligono && (
                        <Typography variant="caption" sx={{ color: 'success.main', mt: 0.5, display: 'block', fontWeight: 500 }}>
                          ✅ Poligono ottenuto con successo! Disegnabile in mappa.
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Annulla
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <WaterIcon />}
        >
          {loading ? 'Salvataggio...' : pozzoToEdit ? 'Salva Modifiche' : 'Crea Pozzo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NuovoPozzoModal;


import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import TableChartIcon from '@mui/icons-material/TableChart';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import StorageIcon from '@mui/icons-material/Storage';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchFormMetadata } from '../store/appSlice';

const ADMIN_PASSWORD = 'admin123';

const SQL_TYPES = ['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC', 'BOOLEAN', 'DATE', 'DATETIME'];

interface ColumnDef {
  name: string;
  type: string;
  notNull: boolean;
  unique: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Login screen
// ─────────────────────────────────────────────────────────────────────────────
const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 480,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
        }}
      >
        <Stack spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockIcon sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
            Area Amministratore
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Inserisci la password per accedere alla gestione del database
          </Typography>
        </Stack>

        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(false)}>
              Password errata. Riprova.
            </Alert>
          )}
          <TextField
            fullWidth
            label="Password"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd((v) => !v)} edge="end">
                      {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleLogin}
            startIcon={<LockOpenIcon />}
            sx={{
              py: 1.5,
              fontWeight: 700,
            }}
          >
            Accedi
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Create Table Panel
// ─────────────────────────────────────────────────────────────────────────────
const CreateTablePanel: React.FC = () => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<ColumnDef[]>([
    { name: '', type: 'TEXT', notNull: false, unique: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addColumn = () =>
    setColumns((prev) => [...prev, { name: '', type: 'TEXT', notNull: false, unique: false }]);

  const removeColumn = (i: number) =>
    setColumns((prev) => prev.filter((_, idx) => idx !== i));

  const updateColumn = (i: number, field: keyof ColumnDef, value: any) =>
    setColumns((prev) => prev.map((col, idx) => (idx === i ? { ...col, [field]: value } : col)));

  const handleCreate = async () => {
    setSuccess(null);
    setError(null);
    const tname = tableName.trim();
    if (!tname) return setError('Inserisci il nome della tabella.');
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tname))
      return setError('Nome tabella non valido. Usa solo lettere, numeri e underscore.');

    const cols = columns.filter((c) => c.name.trim());
    if (cols.length === 0) return setError('Aggiungi almeno una colonna.');
    for (const c of cols) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(c.name.trim()))
        return setError(`Nome colonna non valido: "${c.name}"`);
    }

    const colDefs = [
      'id INTEGER PRIMARY KEY AUTOINCREMENT',
      ...cols.map(
        (c) =>
          `${c.name.trim()} ${c.type}${c.notNull ? ' NOT NULL' : ''}${c.unique ? ' UNIQUE' : ''}`
      ),
    ].join(', ');

    const sql = `CREATE TABLE IF NOT EXISTS ${tname} (${colDefs})`;

    setLoading(true);
    try {
      const res = await window.api.dbQuery(sql);
      if (res.success) {
        setSuccess(`Tabella "${tname}" creata con successo.`);
        setTableName('');
        setColumns([{ name: '', type: 'TEXT', notNull: false, unique: false }]);
      } else {
        setError(res.error || 'Errore sconosciuto.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
          }}
        >
          <TableChartIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Crea Nuova Tabella
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <TextField
          fullWidth
          label="Nome Tabella"
          placeholder="es. documenti, storico_lavori"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />

        <Box>
          <Stack direction="row" sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              COLONNE
            </Typography>
            <Tooltip title="Aggiungi colonna">
              <IconButton size="small" color="primary" onClick={addColumn}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Fixed id column hint */}
          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 1,
              mb: 1,
              borderRadius: 2,
              bgcolor: 'action.hover',
              borderStyle: 'dashed',
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Chip label="AUTO" size="small" color="primary" variant="outlined" />
              <Typography variant="body2" color="text.secondary">
                <strong>id</strong> — INTEGER PRIMARY KEY AUTOINCREMENT
              </Typography>
            </Stack>
          </Paper>

          <Stack spacing={1.5}>
            {columns.map((col, i) => (
              <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Nome colonna"
                      placeholder="es. nome, valore"
                      value={col.name}
                      onChange={(e) => updateColumn(i, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={col.type}
                        label="Tipo"
                        onChange={(e) => updateColumn(i, 'type', e.target.value)}
                      >
                        {SQL_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 'auto' }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="NOT NULL">
                        <Chip
                          label="NOT NULL"
                          size="small"
                          clickable
                          color={col.notNull ? 'warning' : 'default'}
                          variant={col.notNull ? 'filled' : 'outlined'}
                          onClick={() => updateColumn(i, 'notNull', !col.notNull)}
                        />
                      </Tooltip>
                      <Tooltip title="UNIQUE">
                        <Chip
                          label="UNIQUE"
                          size="small"
                          clickable
                          color={col.unique ? 'info' : 'default'}
                          variant={col.unique ? 'filled' : 'outlined'}
                          onClick={() => updateColumn(i, 'unique', !col.unique)}
                        />
                      </Tooltip>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 'auto' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeColumn(i)}
                      disabled={columns.length === 1}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            {success}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <TableChartIcon />}
          disabled={loading}
          onClick={handleCreate}
          sx={{
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            fontWeight: 700,
            px: 3,
            '&:hover': { background: 'linear-gradient(135deg, #0ea472, #048756)' },
          }}
        >
          {loading ? 'Creazione...' : 'Crea Tabella'}
        </Button>
      </Stack>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Add Column Panel
// ─────────────────────────────────────────────────────────────────────────────
const AddColumnPanel: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [existingColumns, setExistingColumns] = useState<any[]>([]);
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState('TEXT');
  const [notNull, setNotNull] = useState(false);
  const [unique, setUnique] = useState(false);
  const [defaultVal, setDefaultVal] = useState('');
  const [displayLabel, setDisplayLabel] = useState('');
  const [fieldType, setFieldType] = useState('TEXT');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const fetchTables = async () => {
    try {
      const res = await window.api.dbQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      if (res.success && Array.isArray(res.data)) {
        setTables(res.data.map((r: any) => r.name));
      }
    } catch { }
  };

  useEffect(() => {
    fetchTables();
  }, [success]);

  useEffect(() => {
    if (selectedTable) {
      window.api.dbQuery(`SELECT * FROM pragma_table_info('${selectedTable}')`)
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            setExistingColumns(res.data);
          }
        })
        .catch(() => setExistingColumns([]));
    } else {
      setExistingColumns([]);
    }
  }, [selectedTable, success]);

  const handleAdd = async () => {
    setSuccess(null);
    setError(null);
    if (!selectedTable) return setError('Seleziona una tabella.');
    if (!colName.trim()) return setError('Inserisci il nome della colonna.');
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(colName.trim()))
      return setError('Nome colonna non valido. Usa solo lettere, numeri e underscore.');

    let colDef = `${colName.trim()} ${colType}`;
    if (notNull) colDef += ' NOT NULL';
    if (unique) colDef += ' UNIQUE';
    if (defaultVal.trim()) colDef += ` DEFAULT ${defaultVal.trim()}`;

    const sql = `ALTER TABLE ${selectedTable} ADD COLUMN ${colDef}`;

    setLoading(true);
    try {
      const res = await window.api.dbQuery(sql);
      if (res.success) {
        // Inserisci metadata form
        await window.api.dbQuery(
          `INSERT INTO form_fields_metadata (table_name, column_name, display_label, field_type) VALUES (?, ?, ?, ?)`,
          [selectedTable, colName.trim(), displayLabel.trim() || colName.trim(), fieldType]
        );
        dispatch(fetchFormMetadata());

        setSuccess(
          `Colonna "${colName.trim()}" aggiunta alla tabella "${selectedTable}" con successo.`
        );
        setColName('');
        setColType('TEXT');
        setNotNull(false);
        setUnique(false);
        setDefaultVal('');
        setDisplayLabel('');
        setFieldType('TEXT');
      } else {
        setError(res.error || 'Errore sconosciuto.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
          }}
        >
          <PlaylistAddIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Aggiungi Colonna a Tabella Esistente
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Tabella</InputLabel>
          <Select
            value={selectedTable}
            label="Tabella"
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            {tables.length === 0 ? (
              <MenuItem disabled>Nessuna tabella trovata</MenuItem>
            ) : (
              tables.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {existingColumns.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderStyle: 'dashed' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
              COLONNE ESISTENTI IN {selectedTable.toUpperCase()}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {existingColumns.map((col) => (
                <Tooltip key={col.name} title={`Tipo: ${col.type}`}>
                  <Chip label={col.name} size="small" variant="filled" color="default" sx={{ fontWeight: 500 }} />
                </Tooltip>
              ))}
            </Box>
          </Paper>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nome Colonna"
              placeholder="es. telefono, note"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo SQL</InputLabel>
              <Select
                value={colType}
                label="Tipo SQL"
                onChange={(e) => {
                  const newColType = e.target.value;
                  setColType(newColType);
                  // Auto-update fieldType based on SQL type
                  if (['INTEGER', 'REAL', 'NUMERIC'].includes(newColType)) {
                    setFieldType('NUMBER');
                  } else if (['DATE', 'DATETIME'].includes(newColType)) {
                    setFieldType('DATE');
                  } else {
                    setFieldType('TEXT');
                  }
                }}
              >
                {SQL_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Valore di default (opzionale)"
              placeholder="es. 0, 'N/A', NULL"
              value={defaultVal}
              onChange={(e) => setDefaultVal(e.target.value)}
              helperText="Lascia vuoto per nessun default"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Nome mostrato nel Form (Label)"
              placeholder="es. Telefono Custode"
              value={displayLabel}
              onChange={(e) => setDisplayLabel(e.target.value)}
              helperText="Come apparirà questo campo nei modali"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo Input Form</InputLabel>
              <Select
                value={fieldType}
                label="Tipo Input Form"
                onChange={(e) => setFieldType(e.target.value)}
              >
                {['TEXT', 'BLOB', 'BOOLEAN'].includes(colType) && (
                  <MenuItem value="TEXT">Testo Semplice</MenuItem>
                )}
                {['INTEGER', 'REAL', 'NUMERIC'].includes(colType) && (
                  <MenuItem value="NUMBER">Numero</MenuItem>
                )}
                {['DATE', 'DATETIME', 'TEXT'].includes(colType) && (
                  <MenuItem value="DATE">Data</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Vincoli
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="NOT NULL"
                  size="small"
                  clickable
                  color={notNull ? 'warning' : 'default'}
                  variant={notNull ? 'filled' : 'outlined'}
                  onClick={() => setNotNull((v) => !v)}
                />
                <Chip
                  label="UNIQUE"
                  size="small"
                  clickable
                  color={unique ? 'info' : 'default'}
                  variant={unique ? 'filled' : 'outlined'}
                  onClick={() => setUnique((v) => !v)}
                />
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* SQL Preview */}
        {selectedTable && colName.trim() && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'grey.900',
              fontFamily: 'monospace',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              ANTEPRIMA SQL
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#a5f3fc', fontFamily: 'monospace', wordBreak: 'break-all' }}
            >
              ALTER TABLE <span style={{ color: '#fde68a' }}>{selectedTable}</span> ADD COLUMN{' '}
              <span style={{ color: '#86efac' }}>{colName.trim()}</span>{' '}
              <span style={{ color: '#c4b5fd' }}>{colType}</span>
              {notNull && <span style={{ color: '#fca5a5' }}> NOT NULL</span>}
              {unique && <span style={{ color: '#fca5a5' }}> UNIQUE</span>}
              {defaultVal.trim() && (
                <span style={{ color: '#fdba74' }}> DEFAULT {defaultVal.trim()}</span>
              )}
            </Typography>
          </Paper>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            {success}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PlaylistAddIcon />}
          disabled={loading}
          onClick={handleAdd}
          sx={{
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            fontWeight: 700,
            px: 3,
            '&:hover': { background: 'linear-gradient(135deg, #5558e8, #7c4fe0)' },
          }}
        >
          {loading ? 'Aggiunta...' : 'Aggiungi Colonna'}
        </Button>
      </Stack>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Raw SQL Panel (advanced)
// ─────────────────────────────────────────────────────────────────────────────
const RawSqlPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await window.api.dbQuery(query);
      if (res.success) setResult(res.data);
      else setError(res.error || 'Errore sconosciuto');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="warning">
        Attenzione: questa sezione esegue SQL arbitrario. Usare con cautela.
      </Alert>
      <TextField
        fullWidth
        multiline
        rows={5}
        label="Query SQL"
        placeholder="SELECT * FROM clienti;"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{ fontFamily: 'monospace' }}
      />
      <Button
        variant="contained"
        color="secondary"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CodeIcon />}
        disabled={loading || !query.trim()}
        onClick={handleRun}
        sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
      >
        {loading ? 'Esecuzione...' : 'Esegui Query'}
      </Button>

      {error && <Alert severity="error">{error}</Alert>}
      {result !== null && (
        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.900', overflow: 'auto', maxHeight: 300 }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            RISULTATO
          </Typography>
          <pre style={{ margin: 0, color: '#a5f3fc', fontSize: 12 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Paper>
      )}
    </Stack>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Export Panel
// ─────────────────────────────────────────────────────────────────────────────
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    alert('Nessun dato da esportare');
    return;
  }
  const keys = Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map(row => keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return '""';
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ExportPanel: React.FC = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      const res = await window.api.dbQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      if (res.success && Array.isArray(res.data)) {
        setTables(res.data.map((r: any) => r.name));
      }
    } catch { }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleExport = async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.dbQuery(`SELECT * FROM ${selectedTable}`);
      if (res.success && Array.isArray(res.data)) {
        exportToCSV(res.data, `${selectedTable}_export.csv`);
      } else {
        setError(res.error || 'Errore durante il recupero dei dati.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex',
          }}
        >
          <DownloadIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Esporta Dati Tabella
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel>Tabella da Esportare</InputLabel>
          <Select
            value={selectedTable}
            label="Tabella da Esportare"
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            {tables.length === 0 ? (
              <MenuItem disabled>Nessuna tabella trovata</MenuItem>
            ) : (
              tables.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
          disabled={loading || !selectedTable}
          onClick={handleExport}
          sx={{
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            fontWeight: 700,
            px: 3,
            '&:hover': { background: 'linear-gradient(135deg, #0369a1, #075985)' },
          }}
        >
          {loading ? 'Esportazione...' : 'Esporta in CSV'}
        </Button>
      </Stack>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Import Panel
// ─────────────────────────────────────────────────────────────────────────────

/** Parses a CSV string (with RFC-4180 quoting) into headers + row objects. */
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current); current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

// ─────────────────────────────────────────────────────────────────────────────
// Import Panel — Simple mode + Guided relational mode
// ─────────────────────────────────────────────────────────────────────────────

type StepData = {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  result: { success: number; errors: number } | null;
  idMap: Record<string, number>; // oldId (string) → newId (number)
};

const emptyStep = (): StepData => ({
  headers: [], rows: [], fileName: '', result: null, idMap: {},
});

// ── Simple import (unchanged) ────────────────────────────────────────────────
const SimpleImportPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number; updated?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTables = async () => {
    try {
      const res = await window.api.dbQuery(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      if (res.success && Array.isArray(res.data)) setTables(res.data.map((r: any) => r.name));
    } catch { }
  };
  useEffect(() => { fetchTables(); }, [importResult]);

  const resetFile = () => { setHeaders([]); setParsedRows([]); setFileName(''); setImportResult(null); setError(null); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetFile();
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const { headers, rows } = parseCSV(evt.target?.result as string);
      if (!headers.length) { setError('CSV non valido o vuoto.'); return; }
      setHeaders(headers); setParsedRows(rows);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!selectedTable || !parsedRows.length) return;
    setLoading(true); setImportResult(null); setError(null);
    const cols = headers.filter(h => h !== 'id');
    let ok = 0, ko = 0, updated = 0;
    for (const row of parsedRows) {
      const vals = cols.map(h => { const v = row[h]; return v === '' || v === undefined ? null : v; });
      try {
        if (selectedTable === 'form_fields_metadata') {
          const checkRes = await window.api.dbQuery(
            `SELECT id FROM form_fields_metadata WHERE table_name = ? AND column_name = ?`,
            [row['table_name'], row['column_name']]
          );
          if (checkRes.success && checkRes.data && checkRes.data.length > 0) {
            // Update existing
            await window.api.dbQuery(
              `UPDATE form_fields_metadata SET display_label = ?, field_type = ? WHERE table_name = ? AND column_name = ?`,
              [row['display_label'], row['field_type'], row['table_name'], row['column_name']]
            );
            updated++;
            continue;
          }
        }

        const res = await window.api.dbQuery(
          `INSERT INTO ${selectedTable} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`, vals
        );
        if (res.success) ok++; else ko++;
      } catch { ko++; }
    }
    setImportResult({ success: ok, errors: ko, updated }); setLoading(false); resetFile();

    if (selectedTable === 'form_fields_metadata') {
      try {
        await window.api.syncSchema();
        dispatch(fetchFormMetadata());
      } catch (err) {
        console.error('Errore durante la sincronizzazione dello schema', err);
      }
    }
  };

  return (
    <Stack spacing={3}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Per tabelle senza dipendenze (es. <strong>form_fields_metadata</strong>, tabelle custom).
        La colonna <strong>id</strong> viene sempre ignorata.
      </Alert>

      <FormControl fullWidth>
        <InputLabel>Tabella di Destinazione</InputLabel>
        <Select value={selectedTable} label="Tabella di Destinazione"
          onChange={(e) => { setSelectedTable(e.target.value); resetFile(); }}>
          {tables.length === 0
            ? <MenuItem disabled>Nessuna tabella trovata</MenuItem>
            : tables.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
      </FormControl>

      <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

      <Button variant="outlined" startIcon={<UploadIcon />}
        onClick={() => fileInputRef.current?.click()} disabled={!selectedTable}
        sx={{ alignSelf: 'flex-start', fontWeight: 600 }}>
        {fileName ? `📄 ${fileName}` : 'Seleziona file CSV…'}
      </Button>

      {parsedRows.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', borderStyle: 'dashed' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
            ANTEPRIMA — {parsedRows.length} righe trovate
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {headers.map(h => (
              <Chip key={h} label={h} size="small"
                color={h === 'id' ? 'default' : 'primary'}
                variant={h === 'id' ? 'outlined' : 'filled'}
                sx={{ opacity: h === 'id' ? 0.4 : 1 }} />
            ))}
          </Box>
        </Paper>
      )}

      {importResult && (
        <Alert severity={importResult.errors === 0 ? 'success' : importResult.success === 0 ? 'error' : 'warning'}
          icon={<CheckCircleIcon />}>
          Import completato: <strong>{importResult.success} righe importate</strong>
          {importResult.errors > 0 && `, ${importResult.errors} con errore`}.
        </Alert>
      )}
      {(importResult?.updated ?? 0) > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <strong>Nota:</strong> {importResult!.updated} camp{importResult!.updated! > 1 ? 'i' : 'o'} con nome tecnico già esistente {importResult!.updated! > 1 ? 'sono stati aggiornati' : 'è stato aggiornato'} invece di essere duplicat{importResult!.updated! > 1 ? 'i' : 'o'}.
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      <Button variant="contained" size="large"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
        disabled={loading || !parsedRows.length || !selectedTable}
        onClick={handleImport}
        sx={{
          alignSelf: 'flex-start', background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          fontWeight: 700, px: 3, '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' }
        }}>
        {loading ? 'Importazione in corso…' : parsedRows.length > 0 ? `Importa ${parsedRows.length} righe` : 'Importa'}
      </Button>
    </Stack>
  );
};

// ── Guided import (relational) ───────────────────────────────────────────────
const GUIDED_STEPS = [
  { label: 'Clienti', table: 'clienti', fkCol: null, fkMap: null },
  { label: 'Pozzi', table: 'pozzi_clienti', fkCol: 'id_cliente', fkMap: 0 }, // idMap from step 0
  { label: 'Ettari Bagnati', table: 'ettari_bagnati', fkCol: 'id_pozzo', fkMap: 1 }, // idMap from step 1
] as const;

const GuidedImportPanel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [steps, setSteps] = useState<StepData[]>([emptyStep(), emptyStep(), emptyStep()]);
  const [loading, setLoading] = useState(false);
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const updateStep = (i: number, patch: Partial<StepData>) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const handleFileChange = (stepIdx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStep(stepIdx, { headers: [], rows: [], fileName: '', result: null, idMap: {} });
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const { headers, rows } = parseCSV(evt.target?.result as string);
      if (!headers.length) return;
      updateStep(stepIdx, { headers, rows, fileName: file.name });
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleImportStep = async (stepIdx: number) => {
    const step = steps[stepIdx];
    const cfg = GUIDED_STEPS[stepIdx];
    if (!step.rows.length) return;
    setLoading(true);

    // Build the column list (skip 'id', and skip the FK col — we'll remap it)
    const skipCols = new Set(['id']);
    const cols = step.headers.filter(h => !skipCols.has(h));

    let ok = 0, ko = 0;
    const newIdMap: Record<string, number> = {};

    for (const row of step.rows) {
      const oldId = row['id']; // original id from CSV

      // Remap FK if needed
      const remappedRow = { ...row };
      if (cfg.fkCol !== null && cfg.fkMap !== null) {
        const parentMap = steps[cfg.fkMap].idMap;
        const oldFk = row[cfg.fkCol];
        const newFk = parentMap[oldFk];
        if (newFk !== undefined) {
          remappedRow[cfg.fkCol] = String(newFk);
        }
        // if mapping missing, keep original (best-effort)
      }

      const vals = cols.map(h => {
        const v = remappedRow[h];
        return v === '' || v === undefined ? null : v;
      });

      try {
        const res = await window.api.dbQuery(
          `INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          vals
        );
        if (res.success) {
          ok++;
          // lastInsertRowid is returned by better-sqlite3 stmt.run()
          const newId = res.data?.lastInsertRowid;
          if (oldId !== undefined && newId !== undefined) {
            newIdMap[oldId] = Number(newId);
          }
        } else {
          ko++;
        }
      } catch { ko++; }
    }

    updateStep(stepIdx, { result: { success: ok, errors: ko }, idMap: newIdMap, rows: [], headers: [], fileName: '' });
    setLoading(false);
    if (stepIdx < GUIDED_STEPS.length - 1) setActiveStep(stepIdx + 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSteps([emptyStep(), emptyStep(), emptyStep()]);
  };

  const allDone = steps.every(s => s.result !== null);
  const totalOk = steps.reduce((acc, s) => acc + (s.result?.success ?? 0), 0);
  const totalKo = steps.reduce((acc, s) => acc + (s.result?.errors ?? 0), 0);

  return (
    <Stack spacing={3}>
      <Alert severity="info" sx={{ borderRadius: 2, '& code': { backgroundColor: 'rgba(0,0,0,0.12)', color: 'inherit', px: 0.6, py: 0.2, borderRadius: 1, fontFamily: 'monospace', fontWeight: 600 } }}>
        Importa in sequenza: <strong>Clienti → Pozzi → Ettari Bagnati</strong>.
        Le chiavi di relazione (<code>id_cliente</code>, <code>id_pozzo</code>) vengono rimappate automaticamente
        dai vecchi ID del CSV ai nuovi ID generati dal database.
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical">
        {GUIDED_STEPS.map((cfg, stepIdx) => {
          const stepData = steps[stepIdx];
          const isCompleted = stepData.result !== null;
          const isActive = activeStep === stepIdx;

          return (
            <Step key={cfg.table} completed={isCompleted}>
              <StepLabel
                onClick={() => !loading && setActiveStep(stepIdx)}
                sx={{ cursor: !loading ? 'pointer' : 'default' }}
                optional={
                  isCompleted && stepData.result
                    ? <Typography variant="caption" color={stepData.result.errors === 0 ? 'success.main' : 'warning.main'}>
                      {stepData.result.success} importati{stepData.result.errors > 0 ? `, ${stepData.result.errors} errori` : ''}
                    </Typography>
                    : undefined
                }
              >
                <Typography sx={{ fontWeight: isActive ? 700 : 400 }}>{cfg.label}</Typography>
              </StepLabel>

              <StepContent>
                <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
                  {cfg.fkCol && (
                    <Alert severity={steps[stepIdx - 1]?.result ? 'success' : 'warning'} sx={{ py: 0.5 }}>
                      {steps[stepIdx - 1]?.result
                        ? `✓ Mappa ${cfg.fkCol}: ${Object.keys(steps[(cfg.fkMap as number)].idMap).length} ID pronti`
                        : `Completa prima il passo precedente per rimappare ${cfg.fkCol}`}
                    </Alert>
                  )}

                  <input
                    ref={fileRefs[stepIdx]}
                    type="file" accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange(stepIdx)}
                  />

                  <Button variant="outlined" startIcon={<UploadIcon />} size="small"
                    onClick={() => fileRefs[stepIdx].current?.click()}
                    sx={{ alignSelf: 'flex-start', fontWeight: 600 }}>
                    {stepData.fileName ? `📄 ${stepData.fileName}` : `Seleziona ${cfg.label}.csv…`}
                  </Button>

                  {stepData.rows.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', borderStyle: 'dashed' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 700 }}>
                        {stepData.rows.length} righe trovate — Colonne:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {stepData.headers.map(h => {
                          const isId = h === 'id';
                          const isFk = h === cfg.fkCol;
                          return (
                            <Chip key={h} label={h} size="small"
                              color={isId ? 'default' : isFk ? 'warning' : 'primary'}
                              variant={isId ? 'outlined' : 'filled'}
                              sx={{ opacity: isId ? 0.4 : 1 }}
                              title={isFk ? 'Questa colonna FK verrà rimappata automaticamente' : undefined}
                            />
                          );
                        })}
                      </Box>
                      {cfg.fkCol && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          🔀 La colonna <strong>{cfg.fkCol}</strong> (arancione) verrà rimappata ai nuovi ID
                        </Typography>
                      )}
                    </Paper>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" size="small"
                      startIcon={loading && isActive ? <CircularProgress size={14} color="inherit" /> : <UploadIcon />}
                      disabled={loading || !stepData.rows.length}
                      onClick={() => handleImportStep(stepIdx)}
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)', fontWeight: 700,
                        '&:hover': { background: 'linear-gradient(135deg, #d97706, #b45309)' }
                      }}>
                      {loading && isActive
                        ? 'Importazione…'
                        : stepIdx < GUIDED_STEPS.length - 1
                          ? `Importa e avanza →`
                          : 'Importa'}
                    </Button>
                    {stepIdx > 0 && (
                      <Button size="small" variant="text" color="inherit"
                        onClick={() => setActiveStep(stepIdx - 1)} disabled={loading}>
                        ← Indietro
                      </Button>
                    )}
                  </Box>
                </Stack>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {allDone && (
        <Alert severity={totalKo === 0 ? 'success' : 'warning'} icon={<CheckCircleIcon />}
          action={<Button color="inherit" size="small" onClick={handleReset}>Ricomincia</Button>}>
          <strong>Import completato!</strong> {totalOk} righe importate in totale
          {totalKo > 0 && `, ${totalKo} con errore`}.
        </Alert>
      )}
    </Stack>
  );
};

// ── ImportPanel wrapper (mode switcher) ──────────────────────────────────────
const ImportPanel: React.FC = () => {
  const [mode, setMode] = useState<'simple' | 'guided'>('guided');

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex' }}>
          <UploadIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Importa Dati da CSV</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, v) => { if (v) setMode(v); }}
          size="small"
        >
          <ToggleButton value="guided">Guidato (relazionale)</ToggleButton>
          <ToggleButton value="simple">Semplice</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {mode === 'guided' ? <GuidedImportPanel /> : <SimpleImportPanel />}
    </Box>
  );
};


// ── Danger Zone Panel ────────────────────────────────────────────────────────
const DangerZonePanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'data' | 'schema' | null; title: string; content: string }>({ open: false, type: null, title: '', content: '' });

  const openDataConfirm = () => {
    setConfirmModal({
      open: true,
      type: 'data',
      title: 'Attenzione: Operazione Irreversibile',
      content: "Questa operazione eliminerà TUTTI i record di clienti, pozzi e ettari bagnati dal database. I dati saranno irrecuperabili. Ti consigliamo vivamente di effettuare prima un export/backup dei dati. Sei assolutamente sicuro di voler brasare tutti i dati?"
    });
  };

  const openSchemaConfirm = () => {
    setConfirmModal({
      open: true,
      type: 'schema',
      title: 'Attenzione: Operazione Irreversibile',
      content: "Verranno rimosse fisicamente tutte le colonne aggiuntive dal database e tutti i dati in esse contenuti andranno persi. Ti consigliamo vivamente di effettuare un backup prima di procedere. Sei sicuro di voler eliminare tutte le colonne dinamiche?"
    });
  };

  const executeConfirm = async () => {
    const type = confirmModal.type;
    setConfirmModal({ ...confirmModal, open: false });
    
    if (type === 'data') {
      await executeWipeData();
    } else if (type === 'schema') {
      await executeWipeSchema();
    }
  };

  const executeWipeData = async () => {
    setLoading(true); setMsg(null);
    try {
      await window.api.dbQuery('DELETE FROM ettari_bagnati');
      await window.api.dbQuery('DELETE FROM pozzi_clienti');
      await window.api.dbQuery('DELETE FROM clienti');
      await window.api.dbQuery("DELETE FROM sqlite_sequence WHERE name IN ('clienti', 'pozzi_clienti', 'ettari_bagnati')");
      
      setMsg({ type: 'success', text: 'Tutti i dati sono stati eliminati con successo.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: `Errore durante l'eliminazione dei dati: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const executeWipeSchema = async () => {
    setLoading(true); setMsg(null);
    try {
      const res = await window.api.dbQuery('SELECT * FROM form_fields_metadata');
      if (res.success && res.data) {
        for (const row of res.data) {
          try {
            await window.api.dbQuery(`ALTER TABLE ${row.table_name} DROP COLUMN ${row.column_name}`);
          } catch (dropErr: any) {
            console.warn(`Errore drop colonna ${row.column_name}:`, dropErr);
          }
        }
      }
      
      await window.api.dbQuery('DELETE FROM form_fields_metadata');
      await window.api.dbQuery("DELETE FROM sqlite_sequence WHERE name='form_fields_metadata'");
      
      dispatch(fetchFormMetadata());
      setMsg({ type: 'success', text: 'Tutte le colonne dinamiche sono state rimosse con successo.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: `Errore durante l'eliminazione delle colonne: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex' }}>
          <WarningAmberIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>Zona Pericolosa</Typography>
      </Stack>

      {msg && (
        <Alert severity={msg.type} sx={{ mb: 3 }}>
          {msg.text}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button 
          variant="contained" 
          color="error"
          onClick={openDataConfirm}
          disabled={loading}
          sx={{ fontWeight: 700, flex: 1, py: 1.5 }}
        >
          {loading ? 'Attendere...' : 'Brasa Tutti i Dati DB'}
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          onClick={openSchemaConfirm}
          disabled={loading}
          sx={{ fontWeight: 700, flex: 1, py: 1.5, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
        >
          {loading ? 'Attendere...' : 'Rimuovi Tutte le Colonne Dinamiche'}
        </Button>
      </Stack>

      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ ...confirmModal, open: false })}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon /> {confirmModal.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontWeight: 500, color: 'text.primary', mt: 1 }}>
            {confirmModal.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmModal({ ...confirmModal, open: false })} variant="outlined" color="inherit">
            Annulla
          </Button>
          <Button onClick={executeConfirm} variant="contained" color="error">
            Sì, Procedi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


// ─────────────────────────────────────────────────────────────────────────────
// Main AdminArea
// ─────────────────────────────────────────────────────────────────────────────
const AdminArea: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 3 }}>
      {/* Header */}
      <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
          }}
        >
          <StorageIcon sx={{ color: 'white', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Gestione Schema Database
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Crea tabelle, aggiungi colonne ed esegui query SQL
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<LockIcon />}
          color="inherit"
          onClick={() => setAuthenticated(false)}
          sx={{ opacity: 0.6 }}
        >
          Esci
        </Button>
      </Stack>

      <Stack spacing={3}>
        {/* Create Table */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <CreateTablePanel />
        </Paper>

        <Divider />

        {/* Add Column */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <AddColumnPanel />
        </Paper>

        <Divider />

        {/* Export Data */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <ExportPanel />
        </Paper>

        <Divider />

        {/* Import Data */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <ImportPanel />
        </Paper>

        <Divider />

        {/* Danger Zone */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'error.main'
          }}
        >
          <DangerZonePanel />
        </Paper>

        <Divider />

        {/* Advanced: Raw SQL */}
        <Accordion
          elevation={0}
          sx={{
            borderRadius: '12px !important',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CodeIcon fontSize="small" color="action" />
              <Typography sx={{ fontWeight: 600 }}>Avanzato — Esecuzione SQL Diretta</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <RawSqlPanel />
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Box>
  );
};

export default AdminArea;

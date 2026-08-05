import React, { useState, useEffect } from 'react';
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
    } catch {}
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
    } catch {}
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

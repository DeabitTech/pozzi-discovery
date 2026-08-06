import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Parse date string
const parseDate = (dateStr: string) => {
  if (!dateStr) return null;
  let d = dayjs(dateStr, ['YYYY-MM-DD', 'MM/DD/YYYY', 'MM-DD-YYYY', 'DD/MM/YYYY'], true);
  if (!d.isValid()) {
    d = dayjs(dateStr); // fallback to standard parsing
  }
  return d.isValid() ? d : null;
};

// Define Column type
type BoardColumn = 'scadute' | '90gg' | '6mesi' | 'regolari';

interface KanbanItem {
  id: number;
  clienteNome: string;
  comune: string;
  localita: string;
  scadenza_str: string;
  parsedDate: dayjs.Dayjs | null;
  column: BoardColumn;
  color: string;
}

const getColumnAndColor = (date: dayjs.Dayjs | null): { column: BoardColumn; color: string } => {
  if (!date) return { column: 'regolari', color: '#9e9e9e' }; // fallback per date assenti

  const now = dayjs();
  const daysDiff = date.diff(now, 'day');

  if (daysDiff < 0) {
    return { column: 'scadute', color: '#f44336' }; // Rosso
  } else if (daysDiff <= 90) {
    return { column: '90gg', color: '#ff9800' }; // Arancione
  } else if (daysDiff <= 180) {
    return { column: '6mesi', color: '#ffc107' }; // Giallo
  } else {
    return { column: 'regolari', color: '#4caf50' }; // Verde
  }
};

const ScadenzeBoard: React.FC = () => {
  const { clienti, pozzi } = useSelector((state: RootState) => state.app);
  const [searchTerm, setSearchTerm] = useState('');

  const boardData = useMemo(() => {
    return pozzi.map(pozzo => {
      const cliente = clienti.find(c => c.id === pozzo.id_cliente);
      const parsedDate = parseDate(pozzo.scadenza_concessione);
      const { column, color } = getColumnAndColor(parsedDate);

      return {
        id: pozzo.id,
        clienteNome: cliente ? cliente.ragione_sociale : 'Cliente sconosciuto',
        comune: pozzo.comune || '',
        localita: pozzo.localita || '',
        scadenza_str: pozzo.scadenza_concessione ? (parsedDate ? parsedDate.format('MM/DD/YYYY') : pozzo.scadenza_concessione) : 'N/A',
        parsedDate,
        column,
        color,
      } as KanbanItem;
    });
  }, [pozzi, clienti]);

  const filteredData = boardData.filter((row) => {
    const q = searchTerm.toLowerCase();
    return (
      row.clienteNome.toLowerCase().includes(q) ||
      row.comune?.toLowerCase().includes(q) ||
      row.localita?.toLowerCase().includes(q)
    );
  });

  // Raggruppa i dati nelle 4 colonne e ordina per data (le più imminenti in alto)
  const columnsData: Record<BoardColumn, KanbanItem[]> = {
    scadute: filteredData.filter(d => d.column === 'scadute').sort((a, b) => (a.parsedDate?.valueOf() || 0) - (b.parsedDate?.valueOf() || 0)),
    '90gg': filteredData.filter(d => d.column === '90gg').sort((a, b) => (a.parsedDate?.valueOf() || 0) - (b.parsedDate?.valueOf() || 0)),
    '6mesi': filteredData.filter(d => d.column === '6mesi').sort((a, b) => (a.parsedDate?.valueOf() || 0) - (b.parsedDate?.valueOf() || 0)),
    regolari: filteredData.filter(d => d.column === 'regolari').sort((a, b) => (a.parsedDate?.valueOf() || 0) - (b.parsedDate?.valueOf() || 0)),
  };

  const columnsConfig = [
    { id: 'regolari', label: 'Regolari', color: '#e8f5e9', titleColor: '#2e7d32' },
    { id: '6mesi', label: 'Entro 6 mesi', color: '#fff8e1', titleColor: '#ed6c02' },
    { id: '90gg', label: 'Entro 90 giorni', color: '#fff3e0', titleColor: '#ed6c02' },
    { id: 'scadute', label: 'Scadute', color: '#ffebee', titleColor: '#d32f2f' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header toolbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Scadenze Concessioni (Board)
        </Typography>
        <TextField
          size="small"
          placeholder="Cerca cliente, comune..."
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
      </Box>

      {/* Kanban Board Area */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        pb: 1 // space for scrollbar
      }}>
        {columnsConfig.map(col => (
          <Paper
            key={col.id}
            elevation={0}
            sx={{
              minWidth: 320,
              width: 350,
              backgroundColor: col.color,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Column Header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Typography sx={{ fontWeight: 700, color: col.titleColor }}>
                {col.label}
              </Typography>
              <Chip
                label={columnsData[col.id as BoardColumn].length}
                size="small"
                sx={{ fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.08)' }}
              />
            </Box>

            {/* Column Content */}
            <Box sx={{ p: 1.5, overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {columnsData[col.id as BoardColumn].map(item => (
                <Card
                  key={item.id}
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    borderLeft: `5px solid ${item.color}`,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    padding: 2,
                    paddingBottom: 12,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    }
                  }}

                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <BusinessIcon fontSize="small" color="action" sx={{ opacity: 0.7 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {item.clienteNome}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2, opacity: 0.7 }}>
                    <LocationOnIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                      {item.comune} {item.localita ? `(${item.localita})` : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                    <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                      Scadenza concessione:
                    </Typography>
                    <Chip
                      label={item.scadenza_str}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}40`
                      }}
                    />
                  </Box>
                </Card>
              ))}

              {columnsData[col.id as BoardColumn].length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic', opacity: 0.7 }}>
                  Nessuna concessione in questa fascia
                </Typography>
              )}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ScadenzeBoard;

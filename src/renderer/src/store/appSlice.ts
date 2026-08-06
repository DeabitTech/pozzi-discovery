import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Pozzo {
  id: number;
  codice_derivazione?: string;
  comune: string;
  localita: string;
  foglio: string;
  particella: string;
  ettari_bagnati: number;
  scadenza_concessione: string;
  coordinate: string;
  documento_pdf?: string;
  consumo_mc?: number;
  id_cliente: number;
}

export interface EttaroBagnato {
  id: number;
  comune: string;
  localita: string;
  foglio: string;
  particella: string;
  ettari: number;
  tipologia: string;
  proprieta: string;
  coordinate?: string;
  poligono?: string;
  colore?: string;
  id_pozzo: number;
}

export interface Cliente {
  id: number;
  ragione_sociale: string;
  codice_fiscale: string;
  partita_iva: string;
  legale_rappresentante: string;
  indirizzo_sede_legale: string;
}

export interface AppState {
  pozzi: Pozzo[];
  clienti: Cliente[];
  ettariBagnati: EttaroBagnato[];
  formMetadata: FormFieldMetadata[];
  loading: boolean;
  error: string | null;
  selectedPozzoId: number | null;
  selectedClienteId: number | null;
}

const initialState: AppState = {
  pozzi: [],
  clienti: [],
  ettariBagnati: [],
  formMetadata: [],
  loading: false,
  error: null,
  selectedPozzoId: null,
  selectedClienteId: null,
};

export const fetchPozzi = createAsyncThunk('app/fetchPozzi', async () => {
  const result = await window.api.dbQuery('SELECT * FROM pozzi_clienti');
  if (result.success) return result.data;
  throw new Error(result.error);
});

export const fetchClienti = createAsyncThunk('app/fetchClienti', async () => {
  const result = await window.api.dbQuery('SELECT * FROM clienti');
  if (result.success) return result.data;
  throw new Error(result.error);
});

export const fetchEttariBagnati = createAsyncThunk('app/fetchEttariBagnati', async () => {
  const result = await window.api.dbQuery('SELECT * FROM ettari_bagnati');
  if (result.success) return result.data;
  throw new Error(result.error);
});

export interface FormFieldMetadata {
  id: number;
  table_name: string;
  column_name: string;
  display_label: string;
  field_type: string;
}

export const fetchFormMetadata = createAsyncThunk('app/fetchFormMetadata', async () => {
  try {
    const result = await window.api.dbQuery('SELECT * FROM form_fields_metadata');
    if (result.success) return result.data;
  } catch(e) {}
  return [];
});

export interface NewClientePayload {
  [key: string]: any;
}

export interface NewPozzoPayload {
  [key: string]: any;
}

export const createCliente = createAsyncThunk(
  'app/createCliente',
  async (payload: NewClientePayload, { dispatch }) => {
    const keys = Object.keys(payload);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => payload[k]);

    const result = await window.api.dbQuery(
      `INSERT INTO clienti (${columns}) VALUES (${placeholders})`,
      values
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchClienti());
    return result.data;
  }
);

export const updateCliente = createAsyncThunk(
  'app/updateCliente',
  async (payload: { id: number; data: NewClientePayload }, { dispatch }) => {
    const keys = Object.keys(payload.data);
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => payload.data[k]);

    const result = await window.api.dbQuery(
      `UPDATE clienti SET ${setClause} WHERE id = ?`,
      [...values, payload.id]
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchClienti());
    return result.data;
  }
);

export const deleteCliente = createAsyncThunk(
  'app/deleteCliente',
  async (id: number, { dispatch }) => {
    // Delete associated pozzi and ettari as well or let foreign keys handle it if ON DELETE CASCADE is set
    // Currently, foreign keys in our DB schema do NOT have ON DELETE CASCADE explicitly set for clienti.
    // So we should delete children first to avoid constraint errors.
    const pozziRes = await window.api.dbQuery(`SELECT id FROM pozzi_clienti WHERE id_cliente = ?`, [id]);
    if (pozziRes.success && Array.isArray(pozziRes.data)) {
      for (const p of pozziRes.data) {
        await window.api.dbQuery(`DELETE FROM ettari_bagnati WHERE id_pozzo = ?`, [p.id]);
      }
    }
    await window.api.dbQuery(`DELETE FROM pozzi_clienti WHERE id_cliente = ?`, [id]);
    const result = await window.api.dbQuery('DELETE FROM clienti WHERE id = ?', [id]);
    if (!result.success) throw new Error(result.error);
    dispatch(fetchClienti());
    dispatch(fetchPozzi());
    dispatch(fetchEttariBagnati());
    return id;
  }
);

export const createPozzo = createAsyncThunk(
  'app/createPozzo',
  async (payload: NewPozzoPayload, { dispatch }) => {
    const keys = Object.keys(payload);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => payload[k]);

    const result = await window.api.dbQuery(
      `INSERT INTO pozzi_clienti (${columns}) VALUES (${placeholders})`,
      values
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchPozzi());
    return result.data;
  }
);

export const updatePozzo = createAsyncThunk(
  'app/updatePozzo',
  async (payload: { id: number; data: NewPozzoPayload }, { dispatch }) => {
    const keys = Object.keys(payload.data);
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => payload.data[k]);

    const result = await window.api.dbQuery(
      `UPDATE pozzi_clienti SET ${setClause} WHERE id = ?`,
      [...values, payload.id]
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchPozzi());
    return result.data;
  }
);

export const deletePozzo = createAsyncThunk(
  'app/deletePozzo',
  async (id: number, { dispatch }) => {
    // Prima eliminiamo gli ettari bagnati associati al pozzo
    await window.api.dbQuery(`DELETE FROM ettari_bagnati WHERE id_pozzo = ?`, [id]);
    
    // Poi eliminiamo il pozzo
    const result = await window.api.dbQuery(
      `DELETE FROM pozzi_clienti WHERE id = ?`,
      [id]
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchPozzi());
    return id;
  }
);

export interface NewEttaroBagnatoPayload {
  [key: string]: any;
}

export const createEttaroBagnato = createAsyncThunk(
  'app/createEttaroBagnato',
  async (payload: NewEttaroBagnatoPayload, { dispatch }) => {
    const keys = Object.keys(payload);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map((k) => payload[k]);

    const result = await window.api.dbQuery(
      `INSERT INTO ettari_bagnati (${columns}) VALUES (${placeholders})`,
      values
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchEttariBagnati());
    return result.data;
  }
);

export const deleteEttariByPozzo = createAsyncThunk(
  'app/deleteEttariByPozzo',
  async (idPozzo: number, { dispatch }) => {
    const result = await window.api.dbQuery(
      `DELETE FROM ettari_bagnati WHERE id_pozzo = ?`,
      [idPozzo]
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchEttariBagnati());
    return idPozzo;
  }
);

export const deleteEttaroBagnato = createAsyncThunk(
  'app/deleteEttaroBagnato',
  async (id: number, { dispatch }) => {
    const result = await window.api.dbQuery(
      `DELETE FROM ettari_bagnati WHERE id = ?`,
      [id]
    );
    if (!result.success) throw new Error(result.error);
    dispatch(fetchEttariBagnati());
    return id;
  }
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    selectPozzo: (state, action: PayloadAction<number | null>) => {
      state.selectedPozzoId = action.payload;
    },
    selectCliente: (state, action: PayloadAction<number | null>) => {
      state.selectedClienteId = action.payload;
      // Deselect any pozzo when switching client
      state.selectedPozzoId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPozzi.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPozzi.fulfilled, (state, action) => {
        state.loading = false;
        state.pozzi = action.payload;
      })
      .addCase(fetchPozzi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching pozzi';
      })
      .addCase(fetchClienti.fulfilled, (state, action) => {
        state.clienti = action.payload;
      })
      .addCase(fetchEttariBagnati.fulfilled, (state, action) => {
        state.ettariBagnati = action.payload;
      })
      .addCase(fetchFormMetadata.fulfilled, (state, action) => {
        state.formMetadata = action.payload;
      });
  },
});

export const { selectPozzo, selectCliente } = appSlice.actions;
export default appSlice.reducer;

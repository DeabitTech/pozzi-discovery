import type { Database as SQLiteDatabase } from 'better-sqlite3';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

// Define the path for the SQLite database.
// In development, store it in the project root.
// In production (portable mode), store it next to the executable.
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const prodDir = process.env.PORTABLE_EXECUTABLE_DIR || app.getPath('userData');
const dbPath = isDev 
  ? path.join(__dirname, '../../database.sqlite')
  : path.join(prodDir, 'database.sqlite');

const db: SQLiteDatabase = new Database(dbPath, { verbose: isDev ? console.log : undefined });
db.pragma('journal_mode = WAL');

export function initDB() {
  // Check if tables exist, create them if they don't.
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clienti'").get();
  
  if (!tableExists) {
    db.exec(`
      CREATE TABLE clienti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ragione_sociale TEXT,
        codice_fiscale TEXT,
        partita_iva TEXT,
        legale_rappresentante TEXT,
        indirizzo_sede_legale TEXT
      );

      CREATE TABLE pozzi_clienti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codice_derivazione TEXT,
        comune TEXT,
        localita TEXT,
        foglio TEXT,
        particella TEXT,
        ettari_bagnati REAL,
        scadenza_concessione TEXT,
        coordinate TEXT,
        documento_pdf TEXT,
        consumo_mc REAL,
        id_cliente INTEGER,
        FOREIGN KEY (id_cliente) REFERENCES clienti(id)
      );

      CREATE TABLE ettari_bagnati (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        comune TEXT,
        localita TEXT,
        foglio TEXT,
        particella TEXT,
        ettari REAL,
        tipologia TEXT,
        proprieta TEXT,
        coordinate TEXT,
        poligono TEXT,
        colore TEXT,
        id_pozzo INTEGER,
        FOREIGN KEY (id_pozzo) REFERENCES pozzi_clienti(id)
      );

      CREATE TABLE form_fields_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT,
        column_name TEXT,
        display_label TEXT,
        field_type TEXT
      );
    `);
  } else {
    // Aggiunta dinamica della tabella form_fields_metadata se non esiste
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS form_fields_metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT,
          column_name TEXT,
          display_label TEXT,
          field_type TEXT
        );
      `);
    } catch(e) {}

    // Aggiunta dinamica della colonna coordinate e poligono agli ettari_bagnati per retrocompatibilità
    try {
      db.exec(`ALTER TABLE ettari_bagnati ADD COLUMN coordinate TEXT;`);
      console.log('Colonna coordinate aggiunta a ettari_bagnati.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table ettari_bagnati per coordinate:', e);
      }
    }
    
    try {
      db.exec(`ALTER TABLE ettari_bagnati ADD COLUMN poligono TEXT;`);
      console.log('Colonna poligono aggiunta a ettari_bagnati.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table ettari_bagnati per poligono:', e);
      }
    }
    
    try {
      db.exec(`ALTER TABLE ettari_bagnati ADD COLUMN colore TEXT;`);
      console.log('Colonna colore aggiunta a ettari_bagnati.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table ettari_bagnati per colore:', e);
      }
    }

    try {
      db.exec(`ALTER TABLE pozzi_clienti ADD COLUMN documento_pdf TEXT;`);
      console.log('Colonna documento_pdf aggiunta a pozzi_clienti.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table pozzi_clienti per documento_pdf:', e);
      }
    }
    try {
      db.exec(`ALTER TABLE pozzi_clienti ADD COLUMN consumo_mc REAL;`);
      console.log('Colonna consumo_mc aggiunta a pozzi_clienti.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table pozzi_clienti per consumo_mc:', e);
      }
    }
    
    try {
      db.exec(`ALTER TABLE pozzi_clienti ADD COLUMN codice_derivazione TEXT;`);
      console.log('Colonna codice_derivazione aggiunta a pozzi_clienti.');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        console.error('Errore durante alter table pozzi_clienti per codice_derivazione:', e);
      }
    }
  }
}

// Function to handle dynamic table alterations (Admin Area)
export function runQuery(query: string, params: any[] = []) {
    const stmt = db.prepare(query);
    if (query.trim().toUpperCase().startsWith('SELECT')) {
        return stmt.all(...params);
    } else {
        return stmt.run(...params);
    }
}

export default db;

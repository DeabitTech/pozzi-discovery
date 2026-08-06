import duckdb from 'duckdb';

const db = new duckdb.Database(':memory:');

// Helper to run queries that return data
function queryDB(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (params.length > 0) {
      db.all(query, ...params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    } else {
      db.all(query, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }
  });
}

let duckdbReady = false;

// Initialize httpfs
export async function initDuckDB() {
  if (duckdbReady) return;
  try {
    // Try loading the cached extension first — fast path (no network)
    try {
      await queryDB("LOAD httpfs;");
    } catch {
      // Extension not cached yet: download it once
      await queryDB("INSTALL httpfs;");
      await queryDB("LOAD httpfs;");
    }
    duckdbReady = true;
    console.log("DuckDB httpfs extension loaded successfully.");
  } catch (err) {
    console.error("Failed to initialize DuckDB httpfs extension:", err);
  }
}

const BASE_URL = 'https://raw.githubusercontent.com/ondata/dati_catastali/main/S_0000_ITALIA/anagrafica';

export async function getCoordinateCatastali(comune: string, foglio: string, particella: string): Promise<[number, number] | null> {
  try {
    // 1. Find regional file
    const indexQuery = `
      SELECT file 
      FROM '${BASE_URL}/index.parquet' 
      WHERE comune LIKE ?
    `;
    const indexResult = await queryDB(indexQuery, [comune.toUpperCase()]);
    
    if (!indexResult || indexResult.length === 0) {
      throw new Error(`Comune ${comune} non trovato in index.parquet`);
    }
    
    const regionFile = indexResult[0].file;
    
    // Format foglio to ensure it has leading zeros if it's numeric
    let formattedFoglio = foglio;
    if (!isNaN(Number(foglio))) {
      formattedFoglio = foglio.padStart(4, '0');
    }
    
    // 2. Query for coordinates
    const coordsQuery = `
      SELECT x, y 
      FROM '${BASE_URL}/${regionFile}' 
      WHERE comune LIKE ? 
        AND foglio LIKE ? 
        AND particella LIKE ?
    `;
    console.log(`Eseguendo query DuckDB per coordinate:`, coordsQuery);
    console.log(`Parametri:`, [comune.toUpperCase(), formattedFoglio, particella]);
    const coordsResult = await queryDB(coordsQuery, [comune.toUpperCase(), formattedFoglio, particella]);
    console.log(`Risultato coordinate da DuckDB:`, coordsResult);
    
    if (!coordsResult || coordsResult.length === 0) {
      throw new Error(`Particella non trovata per Comune ${comune}, Foglio ${formattedFoglio}, Particella ${particella}`);
    }
    
    // 3. Parse coordinates (x and y are multiplied by 1000000 in the parquet)
    const x = Number(coordsResult[0].x) / 1000000;
    const y = Number(coordsResult[0].y) / 1000000;
    
    // Return as [lat, lon] (y is Lat, x is Lon)
    return [y, x];
  } catch (error) {
    console.error("Error in getCoordinateCatastali:", error);
    throw error;
  }
}

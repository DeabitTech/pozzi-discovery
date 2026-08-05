const duckdb = require('duckdb');
const db = new duckdb.Database(':memory:');

db.all("INSTALL httpfs; LOAD httpfs;", (err) => {
  if (err) return console.error(err);
  
  db.all("SELECT * FROM 'https://raw.githubusercontent.com/ondata/dati_catastali/main/S_0000_ITALIA/anagrafica/19_Sicilia.parquet' WHERE comune LIKE 'M011' AND foglio LIKE '0002' AND particella LIKE '2'", (err, res) => {
    if (err) return console.error(err);
    console.log("DuckDB Result:", res);
    
    if (res && res.length > 0) {
      const x = res[0].x / 1000000;
      const y = res[0].y / 1000000;
      console.log("Coordinates:", x, y);
      
      const delta = 0.0001;
      const bbox = `${y - delta},${x - delta},${y + delta},${x + delta},urn:ogc:def:crs:EPSG::6706`;
      const url = `https://wfs.cartografia.agenziaentrate.gov.it/inspire/wfs/owfs01.php?service=WFS&version=2.0.0&request=GetFeature&typeNames=CP.CadastralParcel&outputFormat=geojson&srsName=EPSG:4326&BBOX=${bbox}`;
      console.log("WFS URL:", url);
      
      fetch(url).then(r => r.json()).then(data => {
        console.log("WFS GeoJSON Features length:", data.features ? data.features.length : 0);
        if (data.features && data.features.length > 0) {
            console.log("Found feature properties:", data.features[0].properties);
        }
      }).catch(console.error);
    }
  });
});

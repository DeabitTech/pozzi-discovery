import React, { useEffect, useState, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { selectPozzo } from '../store/appSlice';
import { Box } from '@mui/material';
import wellImage from '../assets/well.png';

const GARGANO_CENTER: [number, number] = [15.92, 41.88]; // [lng, lat] per maplibre
const DEFAULT_ZOOM = 9;


const MAP_STYLE: any = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri'
    }
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster',
      source: 'satellite',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const MapArea: React.FC = () => {
  const dispatch = useDispatch();
  const pozzi = useSelector((state: RootState) => state.app.pozzi);
  const ettariBagnati = useSelector((state: RootState) => state.app.ettariBagnati);
  const selectedClienteId = useSelector((state: RootState) => state.app.selectedClienteId);
  const mapRef = useRef<MapRef>(null);
  
  const [ettariGeoJSON, setEttariGeoJSON] = useState<any>({ type: "FeatureCollection", features: [] });

  const clientePozzi = pozzi.filter((p) => p.id_cliente === selectedClienteId);
  const clienteEttari = ettariBagnati.filter((e) => clientePozzi.some(p => p.id === e.id_pozzo));

  // Carica i layer vettoriali WFS quando cambia il cliente
  useEffect(() => {
    const loadEttari = () => {
      const features: any[] = [];
      for (const ettaro of clienteEttari) {
        if (ettaro.poligono) {
          try {
            const geojson = JSON.parse(ettaro.poligono);
            if (geojson && geojson.type === 'Feature') {
              geojson.properties = { ...ettaro };
              features.push(geojson);
            }
          } catch (e) {
            console.error("Errore parsing geojson per ettaro:", ettaro.id, e);
          }
        }
      }
      setEttariGeoJSON({ type: "FeatureCollection", features });
    };
    
    if (clienteEttari.length > 0) {
      loadEttari();
    } else {
      setEttariGeoJSON({ type: "FeatureCollection", features: [] });
    }
  }, [clienteEttari.length, selectedClienteId]); // Dipendenze base

  return (
    <Box sx={{ height: '100%', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: GARGANO_CENTER[0],
          latitude: GARGANO_CENTER[1],
          zoom: DEFAULT_ZOOM
        }}
        mapStyle={MAP_STYLE}
        interactive={true}
      >
        <NavigationControl position="top-right" />
        
        {/* Pozzi Markers */}
        {clientePozzi.map((pozzo) => {
          if (!pozzo.coordinate) return null;
          try {
            const coords = JSON.parse(pozzo.coordinate);
            if (Array.isArray(coords) && coords.length === 2) {
              return (
                <Marker
                  key={pozzo.id}
                  longitude={coords[1]} // lng
                  latitude={coords[0]}  // lat
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    dispatch(selectPozzo(pozzo.id));
                    
                    const ettariDiQuestoPozzo = clienteEttari.filter(ettaro => ettaro.id_pozzo === pozzo.id);
                    const features: any[] = [];
                    ettariDiQuestoPozzo.forEach(ettaro => {
                      if (ettaro.poligono) {
                        try { features.push(JSON.parse(ettaro.poligono)); } catch(err){}
                      }
                    });
                    
                    if (features.length > 0 && mapRef.current) {
                      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
                      features.forEach(f => {
                        if (f.geometry && f.geometry.coordinates && f.geometry.coordinates[0]) {
                          f.geometry.coordinates[0].forEach((coord: number[]) => {
                            if (coord[0] < minLng) minLng = coord[0];
                            if (coord[1] < minLat) minLat = coord[1];
                            if (coord[0] > maxLng) maxLng = coord[0];
                            if (coord[1] > maxLat) maxLat = coord[1];
                          });
                        }
                      });
                      if (minLng !== Infinity) {
                        mapRef.current.fitBounds(
                          [[minLng, minLat], [maxLng, maxLat]],
                          { padding: 50, duration: 1000 }
                        );
                      }
                    } else if (mapRef.current) {
                      mapRef.current.flyTo({ center: [coords[1], coords[0]], zoom: 15, duration: 1000 });
                    }
                  }}
                >
                  <Box sx={{
                    backgroundColor: 'white',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 3
                  }}>
                    <img src={wellImage} alt="Pozzo" style={{ width: 26, height: 26 }} />
                  </Box>
                </Marker>
              );
            }
          } catch (e) {
            // ignore
          }
          return null;
        })}

        {/* Ettari Bagnati Polygons */}
        <Source id="ettari-source" type="geojson" data={ettariGeoJSON}>
          <Layer
            id="ettari-fill"
            type="fill"
            source="ettari-source"
            paint={{
              'fill-color': ['coalesce', ['get', 'colore'], '#088'],
              'fill-opacity': 0.4
            }}
          />
          <Layer
            id="ettari-line"
            type="line"
            source="ettari-source"
            paint={{
              'line-color': ['coalesce', ['get', 'colore'], '#088'],
              'line-width': 2
            }}
          />
          <Layer
            id="ettari-label"
            type="symbol"
            source="ettari-source"
            minzoom={13}
            layout={{
              'text-field': ['get', 'particella'],
              'text-font': ['Open Sans Bold'],
              'text-size': 14,
              'text-anchor': 'center'
            }}
            paint={{
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 2
            }}
          />
        </Source>
      </Map>
    </Box>
  );
};

export default MapArea;

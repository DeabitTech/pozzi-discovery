import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from './store';
import { fetchPozzi, fetchClienti, fetchEttariBagnati, fetchFormMetadata, selectCliente } from './store/appSlice';
import MapArea from './components/MapArea';
import ListArea from './components/ListArea';
import AdminArea from './components/AdminArea';
import ClientiTable from './components/ClientiTable';
import SplashScreen from './components/SplashScreen';
import logo from './assets/logo-black.jpg';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedClienteId, clienti } = useSelector((state: RootState) => state.app);
  const [view, setView] = React.useState<'dashboard' | 'admin'>('dashboard');
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    dispatch(fetchPozzi());
    dispatch(fetchClienti());
    dispatch(fetchEttariBagnati());
    dispatch(fetchFormMetadata());
  }, [dispatch]);

  const selectedCliente = clienti.find((c) => c.id === selectedClienteId);

  const handleBackToClienti = () => {
    dispatch(selectCliente(null));
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Box
        sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}
      >
        <AppBar position="static" elevation={0}>
          <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
            <img src={logo} alt="Logo" style={{ height: 48, borderRadius: 6 }} />
            <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                component="span"
                variant="h6"
                sx={{ 
                  fontWeight: selectedCliente ? 400 : 700,
                  opacity: selectedCliente ? 0.75 : 1,
                  cursor: selectedCliente ? 'pointer' : 'default'
                }}
                onClick={selectedCliente ? handleBackToClienti : undefined}
              >
                Clienti
              </Typography>
              {view === 'dashboard' && selectedCliente && (
                <>
                  <Typography
                    component="span"
                    variant="h6"
                    sx={{ opacity: 0.75, fontWeight: 400 }}
                  >
                    /
                  </Typography>
                  <Typography
                    component="span"
                    variant="h6"
                    sx={{ fontWeight: 700 }}
                  >
                    {selectedCliente.ragione_sociale}
                  </Typography>
                </>
              )}
            </Typography>
          </Box>

          <Button
            color="inherit"
            onClick={() => setView('dashboard')}
            sx={{
              fontWeight: view === 'dashboard' ? 700 : 400,
              borderBottom: view === 'dashboard' ? '2px solid white' : 'none',
              borderRadius: 0,
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            onClick={() => setView('admin')}
            sx={{
              fontWeight: view === 'admin' ? 700 : 400,
              borderBottom: view === 'admin' ? '2px solid white' : 'none',
              borderRadius: 0,
            }}
          >
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden', height: 0 }}>
        {view === 'admin' ? (
          <Box sx={{ height: '100%', overflow: 'auto' }}>
            <AdminArea />
          </Box>
        ) : selectedClienteId === null ? (
          /* HOME: full-screen client table */
          <ClientiTable />
        ) : (
          /* DETAIL: map + well list for selected client */
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ height: '100%', minHeight: 0 }}>
              <MapArea />
            </Grid>
            <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ height: '100%', minHeight: 0 }}>
              <ListArea />
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
    </>
  );
};

export default App;

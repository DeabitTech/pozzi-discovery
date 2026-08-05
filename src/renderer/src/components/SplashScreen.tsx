import React, { useEffect, useState } from 'react';
import { Box, Fade, useTheme } from '@mui/material';
import logo from '../assets/logo-black.jpg';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const theme = useTheme();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show splash for 2 seconds, then fade out
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Wait for fade transition before unmounting
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Fade in={show} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: theme.palette.primary.main,
          zIndex: 9999,
        }}
      >
        <img 
          src={logo} 
          alt="Pozzi Discovery" 
          style={{ 
            height: 120, 
            borderRadius: 16,
            boxShadow: '0px 8px 24px rgba(0,0,0,0.1)'
          }} 
        />
      </Box>
    </Fade>
  );
};

export default SplashScreen;

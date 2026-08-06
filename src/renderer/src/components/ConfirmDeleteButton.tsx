import React, { useState } from 'react';
import { Button, ClickAwayListener, Box, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
}

const ConfirmDeleteButton: React.FC<ConfirmDeleteButtonProps> = ({ onConfirm }) => {
  const [confirming, setConfirming] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setConfirming(false)}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', overflow: 'hidden' }}>
        <Button
          component="div"
          color="error"
          variant={confirming ? "contained" : "text"}
          onClick={handleClick}
          sx={{
            minWidth: confirming ? 180 : 32,
            width: confirming ? 180 : 32,
            height: 32,
            p: confirming ? '0 12px' : 0,
            borderRadius: 16,
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            justifyContent: confirming ? 'flex-start' : 'center',
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: confirming ? 1 : 0 }} />
          {confirming && (
            <Typography variant="caption" noWrap sx={{ fontWeight: 600, textTransform: 'none' }}>
              Clicca per confermare
            </Typography>
          )}
        </Button>
      </Box>
    </ClickAwayListener>
  );
};

export default ConfirmDeleteButton;

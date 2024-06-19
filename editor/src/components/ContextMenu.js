import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';


const ContextMenu = ({contextMenu, setContextMenu, setDialogOpen}) => {

  const handleClose = () => {
    setContextMenu(null);
  };

  const newClicked = () => {
    handleClose();
    setDialogOpen(true);
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? {top: contextMenu.mouseY, left: contextMenu.mouseX}
          : undefined
      }
    >
      <MenuItem onClick={newClicked}>New</MenuItem>
    </Menu>
  );
}

export default ContextMenu;
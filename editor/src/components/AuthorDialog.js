import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import {putData} from "../model/backend";


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const AuthorDialog = ({authorDialogOpen, setAuthorDialogOpen, authorName, setAuthorName}) => {

    const handleClose = () => {
        setAuthorDialogOpen(false);
    };

    const onConfirm = () => {
        if (authorName.length > 0)
            setAuthorDialogOpen(false);
    };

    return (
        <div>
            <Dialog
                open={authorDialogOpen}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
            >
                <DialogTitle>{"Author name?"}</DialogTitle>
                <DialogContent sx={{width: '300px'}}>
                    <TextField
                        value={authorName}
                        onChange={(event) => {
                            console.log('newAuthorName', event.target.value)
                            setAuthorName(event.target.value);
                        }}
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Name"
                        type="name"
                        fullWidth
                        variant="standard"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default AuthorDialog;
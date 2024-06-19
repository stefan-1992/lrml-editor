import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const NewDialog = ({dialogOpen, setDialogOpen, data, setExpanded, putAndGetData}) => {

    const [file, setFile] = React.useState('');
    const [number, setNumber] = React.useState('');

    const handleClose = () => {
        setDialogOpen(false);
    };

    const onAddNew = () => {
        setDialogOpen(false);
        setExpanded(null)
        // const highest_id = Math.max(...data.map((item) => item.id));
        const current = {text: '', lrml: '', number: number, file: file, paraphrase: '', comment: ''};
        // const current = {id: highest_id + 1, text: '', lrml: '', number: number, file: file, created: new Date().toISOString(), updated: new Date().toISOString()};
        // setCurrentData(current)
        console.log('newClicked', current)
        putAndGetData(current);
        // putData(current).then((id) => {
        //     // console.log('Data updated', data.length)
        //     setSnackbarOpen(true);
        //     setCurrentData({...current, id: id})
        //     getData().then((data) => {
        //         console.log('Data updated', data)
        //         setData(data);
        //     });
        //     // setData(data);
        // });
    };

    return (
        <div>
            <Dialog
                open={dialogOpen}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
            >
                <DialogTitle>{"Translate new clause?"}</DialogTitle>
                <DialogContent sx={{width: '300px'}}>
                    <Autocomplete
                        inputValue={file}
                        onInputChange={(event, newValue) => {
                            console.log('newFileValue', newValue)
                            setFile(newValue);
                        }}
                        sx={{padding: '10px'}}
                        id="new-clause-file"
                        freeSolo={true}
                        options={Array.from(new Set(data.map((item) => item.file)))}
                        renderInput={(params) => <TextField {...params} label="File" />}
                    />
                    <Autocomplete
                        inputValue={number}
                        onInputChange={(event, newValue) => {
                            setNumber(newValue);
                        }}
                        sx={{padding: '10px'}}
                        id="new-clause-number"
                        freeSolo={true}
                        options={Array.from(new Set(data.map((item) => item.number)))}
                        renderInput={(params) => <TextField {...params} label="Number" />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={onAddNew}>Add</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default NewDialog;
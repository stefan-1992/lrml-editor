import {getData, putData} from "../model/backend";


export const putAndGetData = async (current, setSnackbarOpen, setCurrentData, setData) => {
    putData(current).then((id) => {
        console.log('Data updated', id)
        setSnackbarOpen(true);
        if (id > -1){
            setCurrentData({...current, id: id})
            getData().then((data) => {
                console.log('Data updated', data)
                setData(data);
            });
        }
        // setData(data);
    });
}
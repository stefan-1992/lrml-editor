const HEADERS = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
}

// const BASE_URL = 'http://127.0.0.1:5000'
const BASE_URL = '/api'

export const search = async (text, id, semantic_search_threshold) => {

    const body = new URLSearchParams({
        search_text: text,
        current_id: id,
        semantic_search: 'true',
        topn: 10,
        semantic_search_threshold: semantic_search_threshold ?? 0.5
    })
    return fetch(BASE_URL + '/search', {
        method: 'POST',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    }).then(function (json_data) {
        console.log('SEARCH RESULTS', json_data);
        return json_data;
    });
}

export const change_lrml = async (text, task) => {
    const body = new URLSearchParams({
        lrml: text,
        task: task
    })
    return fetch(BASE_URL + '/change_lrml', {
        method: 'POST',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
}

export const search_dict = async (text, dictionaries) => {
    const body = new URLSearchParams({
        search_text: text,
        dictionaries: dictionaries,
        semantic_search: 'false',
        semantic_search_threshold: 0.2,
        topn: 30
    })
    return fetch(BASE_URL + '/search_dict', {
        method: 'POST',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
}

export const getData = async () => {
    return fetch(BASE_URL + '/data', {
        method: 'GET',
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
};

export const getDicts = async () => {
    return fetch(BASE_URL + '/dict', {
        method: 'GET',
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    })
};


export const putData = async (data) => {
    putAnalytics('Save', data.lrml.replace(/(\n\s*)/gm, ""));
    // if paraphrase is not in data, add an empty string
    if (!data.paraphrase) {
        data.paraphrase = '';
    }
    // if comment is not in data, add an empty string
    if (!data.comment) {
        data.comment = '';
    }
    const body = new URLSearchParams({...data, lrml: data.lrml.replace(/(\n\s*)/gm, ""), author: global.authorName});
    // const body = new URLSearchParams({...data, lrml: data.lrml.replace(/(\n\s*)/gm, ""), updated: new Date().toISOString()});
    return fetch(BASE_URL + '/data', {
        method: 'PUT',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
}

export const putDictEntry = async (dict_name, value, reference) => {
    putAnalytics('Add to dict: ' + dict_name, value);
    const body = new URLSearchParams({
        name: dict_name,
        value: value,
        reference: reference,
        author: global.authorName
    });
    return fetch(BASE_URL + '/dict', {
        method: 'PUT',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
}

export const putAnalytics = async (func, value) => {
    const body = new URLSearchParams({
        func: func,
        value: value?.replace(/(\n\s*)/gm, "") ?? '',
        file: global.currentData.file,
        number: global.currentData.number,
        author: global.authorName,
        date: new Date().toISOString()
    });
    return fetch(BASE_URL + '/analytics', {
        method: 'PUT',
        body: body,
        headers: HEADERS
    }).then(function (response) {
        return response.json();
    });
}

export const predict = async (text, lrml, num_beams, abortSignal) => {
    const new_lrml = lrml.replace(/\n\s*/g, '')
    console.log("Sending request to remote model:", text, new_lrml);

    const body = new URLSearchParams({
        text: text,
        lrml: new_lrml,
        num_beams: num_beams
    });
    return fetch(BASE_URL + '/predict', {
        method: "POST",
        body: body,
        headers: HEADERS,
        signal: abortSignal
    }).then((res) => {
        // console.log("Received response from remote model", res);
        return res.json();
    });
}
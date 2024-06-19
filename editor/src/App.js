import React, {useEffect, useState} from "react";

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import AuthorDialog from "./components/AuthorDialog";
import ClauseEditor from "./components/ClauseEditor";
import CommentEditor from "./components/CommentEditor";
import DataViewer from "./components/DataViewer";
import ListViewer from "./components/ListViewer";
import LrmlEditor from "./components/LrmlEditor";
import ParaphraseEditor from "./components/ParaphraseEditor";
import ReferenceEditor from "./components/ReferenceEditor";
import SimpleSnackbar from "./components/SimpleSnackbar";
import {putAndGetData} from "./controller/controller";
import {updateDictionary} from "./extensions/dictionary";
import {getData, putData, search, search_dict} from "./model/backend";
import "./styles.css";

global.currentData = {};
global.authorName = ''

export default function App() {

  const showAuthorName = false

  const [initialData, setInitialData] = useState([]);
  const [data, setData] = useState([]);
  const [dicts, setDicts] = useState({});
  const [currentData, setCurrentData] = useState({});
  const [references, setReferences] = useState('');
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [authorDialogOpen, setAuthorDialogOpen] = React.useState(false);
  const [authorName, setAuthorName] = React.useState('');
  const [searchInput, setSearchInput] = useState('');


  const globalPutAndGetData = (data) => putAndGetData(data, setSnackbarOpen, setCurrentData, setInitialData)

  useEffect(() => {
    updateDictionary();
    global.authorName = window.localStorage.getItem('authorName') || '';
    if (!global.authorName && showAuthorName) {
      setAuthorDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    global.authorName = authorName;
    window.localStorage.setItem('authorName', authorName);
  }, [authorName]);


  useEffect(() => {
    if (Object.keys(currentData).length > 0) {
      // Second call caused by LRML Formatter
      console.debug('currentData changed', currentData, global.currentData);
      if (global.currentData.id != currentData.id) {
        if (global.currentData.file) {
          // find data where id is equal to global.currentData.id
          const original = data.find((d) => d.id == global.currentData.id);
          console.debug('compare with original', original)
          // regex lrml to remove new lines and all spaces after

          if (original && (global.currentData.text != original.text || global.currentData.lrml.replace(/(\n\s*)/gm, "") != original.lrml
            || global.currentData.paraphrase != original.paraphrase || global.currentData.comment != original.comment)) {
            console.debug('Update data')
            putData(global.currentData).then((id) => {
              console.log('Data updated', id)
              setSnackbarOpen(true);
              getData().then((data) => {
                console.log('setInitialData', data)
                setInitialData(data);
              });
            });
          }
        }
        searchForText(currentData.text, currentData.id)
      }
      global.currentData = {...currentData};
      window.localStorage.setItem('currentData', JSON.stringify(currentData));
    }
  }, [currentData]);


  const searchForText = async (text, id, semantic_search_threshold) => {

    search(text, id, semantic_search_threshold).then((results) => {
      const new_text = results.map((result) => {return '//' + result.file + '    ' + result.number + '\n// ' + result.text + '\n' + result.lrml}).join('\n\n');
      setReferences(new_text);
    });

    const dictionaries = ['buvo', 'lovo', 'fuvo', 'ifc', 'ifc_props', 'uniclass', 'omniclass']
    const new_views = {};
    search_dict(text, String(dictionaries)).then((results) => {
      console.log('Search dict results', results)
      for (var key in results) {
        if (results[key].length > 0) {
          new_views[key] = (<div key={key} className="dict-view">
            <ListViewer className={"list-view"} header={key} data={results[key]}></ListViewer>
          </div>)
        }
      }
      setDicts({...new_views});
    });
  }


  useEffect(() => {
    // Filter data whenever searchInput changes
    const filteredData = initialData.filter(item => {
      // Assuming you're searching by a 'name' field, adjust the condition as needed
      // return item.comment.toLowerCase().includes(searchInput.toLowerCase());
      return item.lrml.toLowerCase().includes(searchInput.toLowerCase());
    });
    console.log('Filtered!', searchInput, filteredData.length, initialData)
    setData(filteredData);
  }, [searchInput, initialData]); // Re-run the effect when searchInput or original data changes

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  return (
    <div className="app-container root">
      <div className="toolbar component" style={{overflow: 'hidden'}}>
        <div className="header-box">Translation Viewer</div>
        <label>
          {data.length} out of {initialData.length}
        </label>
        <input
          type="text"
          placeholder="Search..."
          value={searchInput}
          onChange={handleSearchChange}
          style={{
            marginBottom: '10px',
            width: '100%'
          }} // Add styling as needed
        />
        <DataViewer className="data" data={data} setInitialData={setInitialData} currentData={currentData} setCurrentData={setCurrentData} putAndGetData={globalPutAndGetData} />
      </div>
      <div className="content">
        <div className="stack leftstack">
          <div className="overflow topstack">
            <div className="header-box">LegalRuleML Representation</div>
            <div className="overflow">
              <LrmlEditor currentData={currentData} setCurrentData={setCurrentData} searchForText={searchForText} putAndGetData={globalPutAndGetData}></LrmlEditor>
            </div>
          </div>
          <div className="bottomstack">
            <div className="header-box">Similar translations</div>
            <div className="overflow">
              <ReferenceEditor references={references} />
            </div>
          </div>
        </div>
        <div className="stack rightstack">
          <div className="clausestack clause">
            <div className="header-box">Clause in Natural Language</div>
            <div className="overflow">
              <ClauseEditor currentData={currentData} setCurrentData={setCurrentData} searchForText={searchForText} putAndGetData={globalPutAndGetData}></ClauseEditor>
            </div>
          </div>
          <div className="clausestack paraphrase">
            <div className="header-box">Paraphrase</div>
            <div className="overflow">
              <ParaphraseEditor currentData={currentData} setCurrentData={setCurrentData} searchForText={searchForText} putAndGetData={globalPutAndGetData}></ParaphraseEditor>
            </div>
          </div>
          <div className="clausestack comment">
            <div className="header-box">Comments</div>
            <div className="overflow">
              <CommentEditor currentData={currentData} setCurrentData={setCurrentData} putAndGetData={globalPutAndGetData}></CommentEditor>
            </div>
          </div>
          <div className="component clausestack bottomstack">
            <div className="header-box">Related Dictionary Terms</div>
            <div className="alldict">
              {Object.values(dicts)}
            </div>
          </div>
        </div>
      </div>

      <AuthorDialog
        authorDialogOpen={authorDialogOpen}
        setAuthorDialogOpen={setAuthorDialogOpen}
        authorName={authorName}
        setAuthorName={setAuthorName}
      />
      <SimpleSnackbar snackbarOpen={snackbarOpen} setSnackbarOpen={setSnackbarOpen} />
    </div >

  );
}
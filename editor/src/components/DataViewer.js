import React, {useState, useEffect, memo} from "react";

import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import ContextMenu from "./ContextMenu";
import NewDialog from "./NewDialog";
import {getData} from "../model/backend";


const DataViewer = ({data, setInitialData, currentData, setCurrentData, putAndGetData}) => {

  const [expanded, setExpanded] = useState(null);
  const [contextMenu, setContextMenu] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleContextMenu = (event) => {
    console.log('handleContextMenu', event)
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
        // Other native context menus might behave different.
        // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
        null,
    );
  };

  const dataToTree = (data) => {
    const unique_items = Array.from(new Set(data.map((item) => item.file)));
    const result = {};
    const classNames = {};
    for (const item of unique_items) {
      result[item] = [];
      classNames[item] = '';
    }
    // Fill in clauses Items -> Number
    data.forEach((element) => {
      // colour blue if element has no paraphrase
      // const className = ((element.paraphrase?.includes('either')) && element.lrml?.includes(' or(')) | !element.lrml?.includes(' or(') ? "tree-item" : "tree-item no-para";
      // if className is not set yet, set it, if no-paraphrase is already set, keep it
      // classNames[element.file] = classNames[element.file] === 'tree-item no-para-parent' ? 'tree-item no-para-parent' : ((element.paraphrase?.includes('either')) && element.lrml?.includes(' or(')) | !element.lrml?.includes(' or(') ? "tree-item" : "tree-item no-para-parent";
      const className = "tree-item"
      result[element.file].push(<TreeItem className={className} nodeId={element.id.toString()} key={element.id.toString()} label={element.number} data={element} />);
    });
    return unique_items.sort().map((item) => {
      return <TreeItem className={classNames[item]} nodeId={item} key={item} label={item} >
        {result[item].sort((a, b) => a.props.label.localeCompare(b.props.label))}
      </TreeItem>
    });
  }

  useEffect(() => {
    getData().then(function (data) {
      var persistedCurrentData = JSON.parse(window.localStorage.getItem('currentData'))
      console.log('Data', data?.length)
      let cur_data;
      if (persistedCurrentData && Object.keys(persistedCurrentData).length > 0) {
        persistedCurrentData = {...persistedCurrentData, id: parseInt(persistedCurrentData.id)}
        const existing_data = data.find((item) => item.id === persistedCurrentData.id)
        console.log('Restore?', existing_data, persistedCurrentData, existing_data?.updated >= persistedCurrentData?.updated)
        if (existing_data && existing_data?.updated >= persistedCurrentData.updated) {
          // Data on server is newer -> Just switch to it.
          cur_data = existing_data;
        } else {
          // Data on server is older -> Use local data.
          cur_data = persistedCurrentData;
        }
        // Data doesn't exist on server -> Add to data array
        if (!existing_data) {
          // TODO: Decide if adding to data or throwing away
          cur_data = data[0];
          console.log('Data does not exist on server')
        }
      } else {
        cur_data = data[0];
      }
      setInitialData(data);
      setCurrentData(cur_data);
    });
  }, []);


  const onItemSelected = async (event, id) => {
    if (id >= 0) {
      console.log('onItemSelected', [id], data);
      setCurrentData(data.find((d) => d.id == id));
    } else if (expanded == null) {
      console.log('onItemSelected', [id]);
      if (currentData.file != id) {
        setExpanded([currentData.file, id]);
      } else {
        setExpanded([]);
      }
    } else {
      if (expanded.includes(id)) setExpanded(expanded.filter((i) => i != id))
      else setExpanded([...expanded, id])
    }
  }

  const getDataIndex = () => {
    const index = data.findIndex((d) => d.id == currentData.id);
    console.log('Index in data ' + index + ' for ' + currentData.id + ' in ' + data.length + ' items')
    console.log('Data', data[index])
    if (index < 0) {
      return '';
    }
    return index.toString();
  }

  return <TreeView
    onContextMenu={handleContextMenu}
    onNodeSelect={onItemSelected}
    expanded={expanded ? [...expanded] : [currentData.file ?? '']}
    selected={currentData.id?.toString() ?? ''}
    // selected={data?.findIndex((d) => d.id == currentData.id)?.toString() ?? ''}
    // selected={data?.findIndex((d) => d.id == currentData.id)?.toString() ?? ''}
    // selected={getDataIndex()}
    // data.findIndex((d) => d.id == currentData.id);
    aria-label="file system navigator"
    defaultCollapseIcon={< ExpandMoreIcon />}
    defaultExpandIcon={< ChevronRightIcon />}
    sx={{height: '100%', width: '99%', flexGrow: 1, overflowY: 'auto'}}
  >
    {dataToTree(data)}
    <NewDialog
      dialogOpen={dialogOpen}
      setDialogOpen={setDialogOpen}
      data={data}
      setExpanded={setExpanded}
      putAndGetData={putAndGetData}
    />
    <ContextMenu
      contextMenu={contextMenu}
      setContextMenu={setContextMenu}
      setDialogOpen={setDialogOpen} />
  </TreeView>
};

export default memo(DataViewer, (prevProps, nextProps) => {
  return prevProps.currentData.id === nextProps.currentData.id && prevProps.data === nextProps.data;
});

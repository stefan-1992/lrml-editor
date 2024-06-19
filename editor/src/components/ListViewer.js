import {Tooltip} from "@mui/material";

const title_mapping = {buvo: 'Concept', fuvo: 'Function', lovo: 'Relation', ifc: 'IFC', ifc_props: 'IFC Property', uniclass: 'Uniclass', omniclass: 'OmniClass'}

function ListItem(props) {
    // console.log('ListItem', props.value, props, props.id);
    return <li>
        <Tooltip id="button-report" title={props.value.Description} >
            <div>
                {props.value.Key.replaceAll('-', '_')}
            </div>
        </Tooltip>
    </li>;
}

function ListViewer(props) {
    const data = props.data;
    const header = props.header;

    const listItems = data.map((item, id) =>
        <ListItem key={id} value={item} />
    );
    return (
        <ul className="list">
            <li><h4 className="list-header">{title_mapping[header]}</h4></li>
            {listItems}
        </ul>
    );
}

export default ListViewer;
import React, {memo} from "react";

import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {searchKeymap} from "@codemirror/search";
import {dropCursor, EditorView, keymap, lineNumbers} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import "../styles.css";
import {paperlight} from "../themes/paperlight";


const CommentEditor = ({currentData, setCurrentData, putAndGetData}) => {

    const onChange = React.useCallback(async (value) => {
        console.debug('clause maybe changed', value);

        if (currentData.comment != value) {
            console.debug('clause changed', value);
            setCurrentData({...currentData, comment: value});
        }
    });


    // The component will only be re-rendered if the name prop changes
    return <CodeMirror
        value={currentData.comment}
        height="100%"
        theme={paperlight}
        extensions={[lineNumbers(), history(),
        dropCursor(), EditorView.lineWrapping,
        keymap.of([
            {key: "Ctrl-s", mac: "Cmd-s", run: () => putAndGetData(global.currentData)},
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap
        ])
        ]
        }
        basicSetup={false}
        onChange={onChange}
    />;
}

export default memo(CommentEditor, (prevProps, nextProps) => {
    return prevProps.currentData === nextProps.currentData;
});
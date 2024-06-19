import React, {memo} from "react";

import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {searchKeymap} from "@codemirror/search";
import {dropCursor, EditorView, keymap, lineNumbers} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import "../styles.css";
import {paperlight} from "../themes/paperlight";


const ParaphraseEditor = ({currentData, setCurrentData, searchForText, putAndGetData}) => {
    var counter = 0;

    const onChange = React.useCallback(async (value) => {
        console.debug('clause maybe changed', value);

        if (currentData.paraphrase != value) {
            console.debug('clause changed', value);
            setCurrentData({...currentData, paraphrase: value});
        }
    });

    const onUpdate = React.useCallback(async (viewUpdate) => {
        const from = viewUpdate.state.selection.ranges[0].from;
        const to = viewUpdate.state.selection.ranges[0].to;

        // Wait until nothing new was selected for 1 second
        if (viewUpdate.selectionSet & to - from > 1) {
            const selectedText = viewUpdate.state.sliceDoc(from, to)
            counter += 1;
            await new Promise((res) => setTimeout(res, 1000));
            counter -= 1;
            if (counter == 0) {
                console.debug('Selected', selectedText);
                searchForText(selectedText, global.currentData.id);
                putAnalytics('Search Text', selectedText)
            }
        }
    }, []);


    // The component will only be re-rendered if the name prop changes
    return <CodeMirror
        value={currentData.paraphrase}
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
        onUpdate={onUpdate}
    />;
}

export default memo(ParaphraseEditor, (prevProps, nextProps) => {
    return prevProps.currentData === nextProps.currentData;
});
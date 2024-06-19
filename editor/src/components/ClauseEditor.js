import React, {memo} from "react";

import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {searchKeymap} from "@codemirror/search";
import {dropCursor, EditorView, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import {putAnalytics} from "../model/backend";
import "../styles.css";
import {paperlight} from "../themes/paperlight";


const ClauseEditor = ({currentData, setCurrentData, searchForText, putAndGetData}) => {
    var counter = 0;

    const onChange = React.useCallback(async (value) => {
        console.debug('clause maybe changed', value);

        if (currentData.text != value) {
            console.debug('clause changed', value);
            // Length much greater -> Copied from somewhere
            if ((value.length - currentData.text.length) > 20)
                setCurrentData({...currentData, text: value.replace(/(\n)/gm, " ")});
            else
                setCurrentData({...currentData, text: value});
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

    const onCreateEditor = React.useCallback((value, state) => {
        const els = document.getElementsByClassName("cm-content")
        els[0].setAttribute("data-enable-grammarly", false)
        els[1].setAttribute("data-enable-grammarly", false)
        els[2].setAttribute("data-enable-grammarly", false)
    }, []);


    // The component will only be re-rendered if the name prop changes
    return <CodeMirror
        value={currentData.text}
        height="100%"
        theme={paperlight}
        extensions={[lineNumbers(), highlightActiveLineGutter(),
        highlightSpecialChars(), history(),
        dropCursor(), EditorView.lineWrapping,
        keymap.of([
            {key: "Ctrl-s", mac: "Cmd-s", run: () => putAndGetData(global.currentData)},
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap
        ])
        ]
        }
        onCreateEditor={onCreateEditor}
        basicSetup={false}
        onChange={onChange}
        onUpdate={onUpdate}
    />;
}

export default memo(ClauseEditor, (prevProps, nextProps) => {
    return prevProps.currentData === nextProps.currentData;
});
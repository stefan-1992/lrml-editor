import React, {memo} from "react";

import {autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, completionStatus, closeCompletion, startCompletion} from "@codemirror/autocomplete";
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands";
import {bracketMatching, foldGutter, foldKeymap, indentOnInput} from "@codemirror/language";
import {lintKeymap, lintGutter} from "@codemirror/lint";
import {searchKeymap} from "@codemirror/search";
import {dropCursor, EditorView, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import autoFormatPlugin from "../extensions/format.ts";
import {dictLinter} from "../extensions/dictlinter.ts";
import {syntaxLinter} from "../extensions/syntaxlinter.ts";
import {slrml} from "../extensions/slrml.ts";
import "../styles.css";
import {change_lrml, putAnalytics} from "../model/backend";
import {paperlight} from "../themes/paperlight";
import {format} from "../extensions/format.ts";


const LrmlEditor = ({currentData, setCurrentData, searchForText, putAndGetData}) => {
    var counter = 0;

    const onChange = React.useCallback(async (value) => {
        if (currentData.lrml != value) {
            console.debug('lrml changed', value);
            setCurrentData({...currentData, lrml: value});
        }
    });

    const onUpdate = React.useCallback(async (viewUpdate) => {
        const startStatus = completionStatus(viewUpdate.startState);
        const endStatus = completionStatus(viewUpdate.state);
        if (startStatus === "active" && endStatus === null) {
            putAnalytics('autocompletion', viewUpdate.changes.inserted?.slice(-1)[0]?.text[0])
        }

        if (viewUpdate.docChanged) {
            if (viewUpdate.changes.inserted?.slice(-1)[0]?.text[0] === '()') {
                closeCompletion(viewUpdate.view);
            }
        }

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
                searchForText(selectedText, global.currentData.id, 0.3);
                putAnalytics('Search LRML', selectedText)
            }
        }
    }, []);


    const swapTree = ({state, dispatch}) => {
        console.log('Swap tree', state, state.sliceDoc(state.selection.ranges[0].from, state.selection.ranges[0].to));
        const lrmlExpression = state.sliceDoc(state.selection.ranges[0].from, state.selection.ranges[0].to)
        change_lrml(lrmlExpression, 'swap').then((newLrmlExpression) => {
            dispatch(state.update(state.replaceSelection(newLrmlExpression), {scrollIntoView: true, userEvent: "input"}));
        });
        return true;
    };

    const formatLrml = ({state, dispatch}) => {
        const changeSet = format(state);
        dispatch({changes: changeSet});
        return true;
    };


    // The component will only be re-rendered if the name prop changes
    return <CodeMirror
        value={currentData.lrml}
        height="100%"
        theme={paperlight}
        extensions={[slrml(),
        lineNumbers(), highlightActiveLineGutter(),
        highlightSpecialChars(), history(), foldGutter(),
        dropCursor(), closeBrackets(),
        indentOnInput(), bracketMatching(),
        autocompletion(), EditorView.lineWrapping,
        autoFormatPlugin(), dictLinter, syntaxLinter,// lintGutter(),
        keymap.of([
            {key: "Ctrl-s", mac: "Cmd-s", run: () => putAndGetData(global.currentData)},
            {key: "Ctrl-Enter", run: startCompletion},
            {key: "Ctrl-Shift-l", mac: "Cmd-Shift-l", run: swapTree},
            {key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: formatLrml},
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap
        ])
        ]
        }
        onUpdate={onUpdate}
        onChange={onChange}
        basicSetup={false}
    />;
}

export default memo(LrmlEditor, (prevProps, nextProps) => {
    return prevProps.currentData === nextProps.currentData;
});
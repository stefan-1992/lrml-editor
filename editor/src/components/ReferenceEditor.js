import React, {memo} from "react";

import {EditorView, lineNumbers} from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import autoFormatPlugin from "../extensions/format.ts";
import {slrml} from "../extensions/slrml.ts";
import "../styles.css";
import {paperlight} from "../themes/paperlight";


const ReferenceEditor = ({references}) => {

    // The component will only be re-rendered if the name prop changes
    return <CodeMirror
        value={references}
        height="100%"
        // overflow="auto"
        theme={paperlight}
        readOnly={true}
        extensions={[slrml(),
        autoFormatPlugin(),
        lineNumbers(),
        EditorView.lineWrapping]}
        basicSetup={false}
    />
}

export default memo(ReferenceEditor);
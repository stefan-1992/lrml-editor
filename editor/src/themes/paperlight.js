import {createTheme} from "@uiw/codemirror-themes";
import {tags as t} from "@lezer/highlight";

export const paperlight = createTheme({
    theme: "light",
    settings: {
        // background: "#FFFFFF"
        background: "#E0E0E0",
        foreground: "#424242",
        caret: "#000000",
        selection: "#BDBDBD",
        selectionMatch: "#036dd6",
        lineHighlight: "#322",
        gutterBackground: "#424242",
        gutterForeground: "#8a9199",
        line: "#000000",
    },
    styles: [
        {tag: t.keyword, color: "#B71C1C"},
        {tag: t.comment, color: "#404040"},
        {tag: t.variableName, color: "#00695C"},
        {tag: t.number, color: "#404040"},
        {tag: t.paren, color: "#000000"},
        {tag: t.propertyName, color: "#8E24AA"},
        {tag: t.punctuation, color: "#000000"},
        {tag: t.name, color: "#ffcb6b"},
        {tag: t.heading1, color: "#0D47A1"},
    ]
});

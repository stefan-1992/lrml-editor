import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

export const monokai = createTheme({
  theme: "light",
  settings: {
    background: "#2e2e2e",
    foreground: "#aabaff",
    caret: "#5d00ff",
    selection: "#174832",
    selectionMatch: "#036dd6",
    lineHighlight: "#322",
    gutterBackground: "#fff",
    gutterForeground: "#8a9199"
  },
  styles: [
    { tag: t.keyword, color: "#a6e22e" },
    { tag: t.comment, color: "#16AFF4" },
    { tag: t.variableName, color: "#66d9ef" },
    { tag: t.paren, color: "#fff" },
    { tag: t.name, color: "#fa0aa6" },
    { tag: t.heading, color: "#fa0aa6" },
    { tag: t.heading1, color: "#fd971f" },
    { tag: t.heading2, color: "#ff2f4e" },
    { tag: t.heading3, color: "#ae81ff" },
    { tag: t.heading4, color: "#ff2f4e" }
  ]
});

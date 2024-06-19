import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

export const palenight = createTheme({
  theme: "light",
  settings: {
    background: "#463a54",
    foreground: "#aabaff",
    caret: "#5d00ff",
    selection: "#174832",
    selectionMatch: "#036dd6",
    lineHighlight: "#322",
    gutterBackground: "#fff",
    gutterForeground: "#8a9199"
  },
  styles: [
    { tag: t.keyword, color: "#f07178" },
    { tag: t.comment, color: "#16AFF4" },
    { tag: t.variableName, color: "#c3e88d" },
    { tag: t.paren, color: "#fff" },
    { tag: t.name, color: "#ffcb6b" },
    { tag: t.heading, color: "#ffcb6b" },
    { tag: t.heading1, color: "#82aaff" },
    { tag: t.heading2, color: "#c792ea" },
    { tag: t.heading3, color: "#89ddff" },
    { tag: t.heading4, color: "#c792ea" }
  ]
});

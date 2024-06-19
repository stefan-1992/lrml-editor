import {getIndentUnit, indentString, syntaxTree} from "@codemirror/language";
import {ChangeSpec, EditorState, StateEffect, StateField, Text} from "@codemirror/state";
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import "./grammar.terms.js";

type SyntaxNode = ReturnType<typeof syntaxTree>["topNode"]


function newlineAndIndent2(state, from, node, is_end) {
  var expression = getIntentationLevel(node)

  if (is_end) {
    expression--;
  }
  let indent = expression * getIndentUnit(state)

  let insert = ["", indentString(state, indent)]

  return {from: from, to: from, insert: Text.of(insert)}
}

export function getIntentationLevel(node) {
  var expression = 0;
  while (node.parent != null) {
    node = node.parent;
    if (node.name === 'UnaryExpression' || node.name === 'TernaryExpression' || node.name === 'LoopExpression') {
      expression++;
    }
  }
  return expression
}


// Recursive tree exploration
function formatSyntaxNode2(
  state: EditorState,
  node: SyntaxNode,
) {
  let changes: ChangeSpec[] = [];

  let cursor = node.cursor()

  do {
    if ((cursor.name === "BinaryExpression" && cursor.node.parent?.name !== "BinaryExpression" && cursor.node.parent?.name !== "UnaryExpression")
      || (cursor.name === "UnaryExpression" && cursor.from !== 0) || (cursor.name === "TernaryExpression" && cursor.node.lastChild?.name?.includes("Expression"))
      || (cursor.name === "LoopExpression")) {
      if (state.doc.slice(cursor.from - 2, cursor.from).text[0].trim() === '') continue;
      changes.push(newlineAndIndent2(state, cursor.from, cursor.node, false));
      if (cursor.node.nextSibling === null) {
        changes.push(newlineAndIndent2(state, cursor.to, cursor.node, true));
      }
    }
  } while (cursor.next())
  return changes;
}

export function format(state: EditorState): ChangeSpec {

  return formatSyntaxNode2(state, syntaxTree(state).topNode);
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const autoFormatPlugin = (updated) => ViewPlugin.fromClass(
  class {

    async update(update: ViewUpdate) {
      if (update.docChanged && (update.changes.inserted.map((x) => x.length).reduce((a, b) => a + b, 0)) > 50) {
        console.log('Formatting!', update)
        const changeSet = format(update.state);
        await delay(50);
        update.view.dispatch({changes: changeSet});
      }
    }
  }
);

export default autoFormatPlugin;

import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"


export const syntaxLinter = linter(view => {
  const diagnostics: Diagnostic[] = [];
  const MESSAGES = {
    'Data': 'Wrong syntax for data. Entities: "activityType", Values: "1.3", Values with unit: "1.3 m2", References: "nzbc_e2" or ""nzbc_e2_1.1.1"" or quoted text: ""Quoted text.""',
    'Atom': 'Wrong syntax for atom. E.g. "building" or "building.space" are allowed.',
  }

  syntaxTree(view.state).cursor().iterate(node => {
    // console.log('syntaxlinter', node.name, node?.node?.parent?.name, node?.node?.prevSibling?.name, node?.node?.prevSibling?.from, node?.node?.prevSibling?.to, node.from, node.to, view.state.sliceDoc(node.from, node.to), node)

    if (node.name == '⚠') {
      // console.log('syntaxlinter', node.name, node?.node?.parent?.name, node?.node?.prevSibling?.name, node?.node?.prevSibling?.from, node?.node?.prevSibling?.to, node.from, node.to, view.state.sliceDoc(node.from, node.to), node)

      // console.log('ADDED ERROR')
      if (node.to == 0 && node.from == 0) {
        console.log('NO ERROR')
      }
      else if ((node.to - node.from) > 1) {
        console.log('Data ERROR')
        const messages =
          diagnostics.push({
            from: node.from,
            to: node.to,
            severity: "error",
            message: MESSAGES[node.node.prevSibling?.name ?? ''] ?? 'Data error.',
          });
      } else if (view.state.sliceDoc(node.from - 1, node.to) == '()') {
        console.log('Empty brackets ERROR')
        diagnostics.push({
          from: (node.node.prevSibling?.to ?? node.from),
          to: node.to,
          severity: "error",
          message: "Empty brackets.",
        });
      } else if (view.state.sliceDoc(node.from, node.to) == ')' || view.state.sliceDoc(node.from, node.to) == '(') {
        console.log('Unmatched brackets ERROR')
        diagnostics.push({
          from: (node.node.prevSibling?.to ?? node.from),
          to: node.to,
          severity: "error",
          message: "Unmatched bracket.",
        });
      } else if (view.state.sliceDoc((node.node.prevSibling?.to ?? node.from), node.to).includes(',') || node?.node?.prevSibling == undefined) {
        console.log('Unknown ERROR')
        // Possibly no diagnostic in this case
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: "error",
          message: "Syntax error.",
        });
      } else if (node?.node?.prevSibling?.name != 'Function') {
        console.log('Missing comma ERROR')
        diagnostics.push({
          from: (node.node.prevSibling?.to ?? node.from),
          to: (node.node.prevSibling?.to ?? node.from),
          severity: "error",
          message: "Syntax error.",
          actions: [{
            name: 'Insert comma.',
            apply(view, from, to) {
              view.dispatch({changes: {from: from, to: from, insert: ','}})
            }
          }]
        });
      }
    }
  });

  return diagnostics;
});

import {
  CompletionContext,
  CompletionResult
} from "@codemirror/autocomplete";
import {
  defaultHighlightStyle, delimitedIndent, foldInside, foldNodeProp, getIndentation, HighlightStyle, indentNodeProp, LanguageSupport, LRLanguage, syntaxHighlighting, indentString
} from "@codemirror/language";
import {styleTags, tags as t} from "@lezer/highlight";
import {predict, putAnalytics} from "../model/backend.js";
import {
  functionDictionaryCompletion, keywordDictionaryCompletion, variableDictionaryCompletion, propertyDictionaryCompletion
} from "./dictionary.js";
import {parser as baseParser} from "./grammar.js";


const parser = baseParser.configure({
  props: [
    styleTags({
      Function: t.keyword,
      Variable: t.variableName,
      ParenOpen: t.paren,
      ParenClose: t.paren,
      Comma: t.punctuation,
      Dot: t.punctuation,
      RuleIndicator: t.heading1,
      Logic: t.heading1,
      Deontics: t.heading1,
      Loop: t.heading1,
      Not: t.heading1,
      Property: t.propertyName,
      Data: t.number,
    }),
    indentNodeProp.add({
      "UnaryExpression": delimitedIndent({closing: ")"}),
      "BinaryExpression": delimitedIndent({closing: ")"}),
      "TernaryExpression": delimitedIndent({closing: ")"}),
      "LoopExpression": delimitedIndent({closing: ")"}),
    }),
    foldNodeProp.add({
      "TernaryExpression": foldInside
    }),
  ]
});

const language = LRLanguage.define({
  parser: parser,
  languageData: {
    commentTokens: {line: "//"},
    // indentOnInput: /^\s*\}$/
  }
});

const slrmlHightlightStyle = HighlightStyle.define([
  {tag: t.keyword, color: "#f07178"},
  {tag: t.comment, color: "#16A004", fontStyle: "italic"},
  {tag: t.variableName, color: "#c3e88d"},
  {tag: t.name, color: "#ffcb6b"},
  {tag: t.heading, color: "#82aaff"},
  {tag: t.heading1, color: "#c792ea"},
  {tag: t.heading2, color: "#89ddff"},
  {tag: t.heading3, color: "#9cc4ff"},
  {tag: t.heading4, color: "#FFF"},
  {tag: t.punctuation, color: "#FFF"}
]);


/**
 * fetch requests to HTTP servers can't happen on the client side when connected to an HTTPS website
 * @param ctx
 */
async function ModelCompletion(
  ctx: CompletionContext,
  num_beams: number = 5,
): Promise<CompletionResult | null> {
  console.log("Starting model completion", ctx);

  // Currently typed LRML for a partial prediction, only fetch before the cursor
  const pos = ctx.pos;
  var lrml: string = ctx.state.sliceDoc(0, pos);

  // Ugly workaround for cases where an expression is recognised - i.e. if, and, or, not, etc.
  // Find all non-whitespace character
  const regex = /[\s\(\),]/gm;
  // Find the index of the last non-whitespace character
  var matches = lrml.match(/,|\(|\)|\.| |\n/g);
  const lastMatch = matches?.pop();
  const lastNonWhitespaceIndex = lrml.lastIndexOf(lastMatch ?? '') + 1;

  // // Abort controller will allow CodeMirror to cancel web requests to the model
  const abortController = new AbortController();

  const tok = ctx.tokenBefore(["Variable", "Data", "Property", "Function"]);
  let token = tok ? tok.text : lrml.slice(lastNonWhitespaceIndex);
  console.log('token:', tok, token)
  // Allow the user to enter linebreaks after brackets open
  if (lrml.trim()[-1] === '(') return null;
  // if (token == null && pos > 2) return null;


  // Tell CodeMirror how to abort completions
  ctx.addEventListener("abort", () => {
    console.debug("Aborted model completion request");
    abortController.abort();
  });


  if (!ctx.explicit) {
    // If the user hasn't pressed the keybind for autocompletions, then we want to wait for them to stop typing before we
    // send a request to the server, to avoid spamming the server
    await new Promise((res) => setTimeout(res, 200));
    if (ctx.aborted) return null;
  }

  // Create a web request, that uses the above abort method
  return predict(
    global.currentData.text,
    lrml,
    num_beams,
    abortController.signal
  )
    .then(
      (options): CompletionResult => {
        console.log("Processing result from remote model:", options);

        putAnalytics('Show model completions', global.currentData.text + '---' + (token ?? '') + '---' + options.join(';;;'))

        // Detect whether the model result should replace or append
        if (token) {
          // console.log('replace', tok, options.map(str => ({label: str, type: "variable", boost: -1})))
          if (tok?.type?.name === 'Property') {
            options = options.map(str => (str.split('.').slice(-1)[0]))
            console.log('Split property.', options)
          }
          // Replace
          return {
            from: tok?.from ?? lastNonWhitespaceIndex,
            to: tok?.to ?? pos,
            validFor: /[\w_.-]*$/,
            // filter: false,
            options: options.map(str => ({label: str, type: "variable", boost: -1}))
          };
        } else {

          const indent = indentString(ctx.state, getIndentation(ctx.state, pos) ?? 0)
          if (lrml.trim().endsWith(')')) {
            options = options.map(str => (', \n' + indent + str))
          }
          // else if (lrml.trim().endsWith('),')) {
          // options = options.map(str => ('\n' + indent + str))
          // }

          // Append
          return {
            from: pos,
            options: options.map(str => ({label: str, type: "variable", boost: -1}))
          };
        }
      }
    )
    .catch((err) => {
      console.error("Error in model completion: " + err);
      return null;
    });
}


export function slrml(): LanguageSupport {
  return new LanguageSupport(language, [
    language.data.of({
      autocomplete: (ctx) => ModelCompletion(ctx, 1)
    }),
    language.data.of({
      autocomplete: ModelCompletion
    }),
    language.data.of({
      autocomplete: functionDictionaryCompletion
    }),
    language.data.of({
      autocomplete: variableDictionaryCompletion
    }),
    language.data.of({
      autocomplete: keywordDictionaryCompletion
    }),
    language.data.of({
      autocomplete: propertyDictionaryCompletion
    }),
    syntaxHighlighting(defaultHighlightStyle)
  ]);
}
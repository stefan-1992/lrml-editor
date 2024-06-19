
import {ifIn} from "@codemirror/autocomplete";
import {getDicts} from '../model/backend'

/**
Given a a fixed array of options, return an autocompleter that completes them.
*/
function completeFromListByName(name) {
  let [validFor, match] = [/[\w_-]*$/, /[\w_-]+$/];
  return (context) => {
    let options = lookupDictionary[name];
    let token = context.matchBefore(match);
    const result = token || context.explicit ? {from: token ? token.from : context.pos, options, validFor} : null;
    return result;
  };
}

export const updateDictionary = async () => {
  getDicts().then(function (json_data) {
    // if dictionary is empty return
    if (json_data === undefined || json_data["lovo"] === undefined || json_data["fuvo"] === undefined || json_data["buvo"] === undefined) {
      return;
    }

    console.log('Dictionaries loaded')
    // For Linter
    operatorDictionary.length = 0;
    operatorDictionary.push(...json_data["lovo"].map((item) => item.Key));
    functionDictionary.length = 0;
    functionDictionary.push(...json_data["fuvo"].map((item) => item.Key));
    variableDictionary.length = 0;
    variableDictionary.push(...json_data["buvo"].map((item) => item.Key));

    lookupDictionary['fun'] = functionDictionary.concat(operatorDictionary).map(o => typeof o == "string" ? {label: o} : o);
    lookupDictionary['var'] = variableDictionary.map(o => typeof o == "string" ? {label: o} : o);
    lookupDictionary['prop'] = variableDictionary.map(o => typeof o == "string" ? {label: o} : o);
    lookupDictionary['keyword'] = keywordDictionary.map(o => typeof o == "string" ? {label: o} : o);

    return json_data;
  });
}

const lookupDictionary = {}

export const operatorDictionary = [];
export const functionDictionary = [];
export const variableDictionary = [];
export const keywordDictionary = [
  "if",
  "then",
  "and",
  "or",
  "not",
  "loop",
  "obligation",
  "permission",
  "prohibition"
];


export const functionDictionaryCompletion = ifIn(
  ["Function", "Variable"],
  completeFromListByName('fun')
);
export const variableDictionaryCompletion = ifIn(
  ["Variable", "Data"],
  completeFromListByName('var')
);
export const propertyDictionaryCompletion = ifIn(
  ["Property"],
  completeFromListByName('prop')
);
export const keywordDictionaryCompletion = ifIn(
  ["RuleIndicator", "Logic", "Not", "Loop", "Deontics", "BinaryExpression", "UnaryExpression", "TernaryExpression"],
  completeFromListByName('keyword')
);

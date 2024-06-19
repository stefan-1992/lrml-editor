import React from "react";
import {syntaxTree} from "@codemirror/language"
import {linter, Diagnostic} from "@codemirror/lint"
import {functionDictionary, operatorDictionary, variableDictionary} from "./dictionary"
import {putDictEntry} from "../model/backend";
import {updateDictionary} from "./dictionary";

export const dictLinter = linter(view => {

  const name_map = {
    'Function': 'fuvo',
    'Relation': 'lovo',
    'Variable': 'buvo',
    'Property': 'buvo',
  }

  const dictionaries = {
    'Function': functionDictionary.concat(operatorDictionary),
    'Variable': variableDictionary.concat(['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9']),
    'Property': variableDictionary,
    // 'Data': variableDictionary,
  }

  const getActions = (node, dictionary) => {
    if (dictionary == 'Function') {
      return [getAction(node, 'Relation'), getAction(node, 'Function')]
    } else {
      return [getAction(node, dictionary)]
    }
  }

  const getAction = (node, dictionary) => {
    return {
      name: 'Add "' + view.state.sliceDoc(node.from, node.to) + '" as ' + dictionary + ' (' + name_map[dictionary] + ')',
      apply(view, from, to) {
        const value = view.state.sliceDoc(from, to)
        // TODO: We use currently a new line in the end for updates
        // Local update for Linter
        if (dictionary == 'Function') operatorDictionary.push(value)
        else variableDictionary.push(value)
        view.dispatch({changes: {from: view.state.doc.length, to: view.state.doc.length, insert: '\n'}})

        // Backend
        putDictEntry(name_map[dictionary], value, global.currentData.file)
          .then(data => {
            // Global update for autocompletion
            updateDictionary()
            console.log('Dict updated', data)
          })
      }
    }
  }

  console.log('dictLinter')
  let diagnostics: Diagnostic[] = []
  syntaxTree(view.state).cursor().iterate(node => {
    // Check if the dictionaries were loaded
    if (variableDictionary) {
      for (const k in dictionaries) {
        if (node.name == k && !dictionaries[k].some(x => x == view.state.sliceDoc(node.from, node.to))) {
          if (node.from >= node.to) {
            console.log('Empty ' + k + ' warning')
            diagnostics.push({
              from: node.from,
              to: node.from < node.to ? node.to : node.from,
              severity: "warning",
              message: k + " empty",
            });
          } else {
            diagnostics.push({
              from: node.from,
              to: node.from < node.to ? node.to : node.from + 1,
              severity: "warning",
              message: k + " not in dictionary",
              actions: getActions(node, k)
            });
          }

        }
      }
    }
  })
  return diagnostics
});

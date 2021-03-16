import * as Atom from "atom"
import {CodeAction, CodeActionProvider} from "atom-ide-base"
import {CodefixProvider} from "../atom/codefix/codefixProvider"
import {typeScriptScopes} from "../atom/utils"

export function getCodeActionsProvider(codefixProvider: CodefixProvider): CodeActionProvider {
  return {
    grammarScopes: typeScriptScopes(),
    priority: 0,
    async getCodeActions(textEditor: Atom.TextEditor, range: Atom.Range): Promise<CodeAction[]> {
      return (await codefixProvider.runCodeFix(textEditor, range.start)).map((fix) => ({
        getTitle: async () => ("description" in fix ? fix.description : fix.actionDescription),
        dispose: () => {},
        apply: async () => {
          await codefixProvider.applyFix(fix)
        },
      }))
    },
  }
}

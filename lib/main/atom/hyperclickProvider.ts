import * as Atom from "atom"
import {ClientResolver} from "../../client/clientResolver"
import {simpleSelectionView} from "./views/simpleSelectionView"
import {handleDefinitionResult} from "./commands/goToDeclaration"
import {isTypescriptGrammar} from "./utils"

export function getHyperclickProvider(clientResolver: ClientResolver): any {
  return {
    providerName: "typescript-hyperclick-provider",
    wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
    getSuggestionForWord(editor: Atom.TextEditor, text: string, range: Atom.Range) {
      if (!isTypescriptGrammar(editor.getGrammar())) {
        return null
      }
      const filePath = editor.getPath()
      if (!filePath) {
        return null
      }

      return {
        range: range,
        callback: async () => {
          const location = {
            file: filePath,
            line: range.start.row + 1,
            offset: range.start.column + 1,
          }
          const client = await clientResolver.get(location.file)
          const result = await client.executeDefinition(location)
          handleDefinitionResult(result, location)
        },
      }
    },
  }
}

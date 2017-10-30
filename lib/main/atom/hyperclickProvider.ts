import * as Atom from "atom"
import {ClientResolver} from "../../client/clientResolver"
import {handleDefinitionResult} from "./commands/goToDeclaration"
import {isTypescriptGrammar} from "./utils"

export function getHyperclickProvider(clientResolver: ClientResolver) {
  return {
    providerName: "typescript-hyperclick-provider",
    wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
    getSuggestionForWord(editor: Atom.TextEditor, _text: string, range: Atom.Range) {
      if (!isTypescriptGrammar(editor)) {
        return null
      }
      const filePath = editor.getPath()
      if (!filePath) {
        return null
      }

      return {
        range,
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

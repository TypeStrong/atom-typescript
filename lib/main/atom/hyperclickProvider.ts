import * as Atom from "atom"
import {ClientResolver} from "../../client"
import {handleDefinitionResult} from "./commands/goToDeclaration"
import {Dependencies} from "./commands/registry"
import {isTypescriptEditorWithPath} from "./utils"

export function getHyperclickProvider(
  clientResolver: ClientResolver,
  histGoForward: Dependencies["histGoForward"],
) {
  return {
    providerName: "typescript-hyperclick-provider",
    wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
    getSuggestionForWord(editor: Atom.TextEditor, _text: string, range: Atom.Range) {
      if (!isTypescriptEditorWithPath(editor)) {
        return null
      }
      const filePath = editor.getPath()
      if (filePath === undefined) {
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
          const result = await client.execute("definition", location)
          await handleDefinitionResult(result, editor, histGoForward)
        },
      }
    },
  }
}

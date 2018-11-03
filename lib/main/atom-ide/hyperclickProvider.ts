import * as Atom from "atom"
import {HyperclickProvider} from "atom/ide"
import {GetClientFunction} from "../../client"
import {handleDefinitionResult} from "../atom/commands/goToDeclaration"
import {Dependencies} from "../atom/commands/registry"
import {isTypescriptEditorWithPath} from "../atom/utils"

export function getHyperclickProvider(
  getClient: GetClientFunction,
  histGoForward: Dependencies["histGoForward"],
): HyperclickProvider {
  return {
    priority: 0,
    providerName: "typescript-hyperclick-provider",
    wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
    async getSuggestionForWord(editor: Atom.TextEditor, _text: string, range: Atom.Range) {
      if (!isTypescriptEditorWithPath(editor)) return
      const filePath = editor.getPath()
      if (filePath === undefined) return

      return {
        range,
        callback: async () => {
          const location = {
            file: filePath,
            line: range.start.row + 1,
            offset: range.start.column + 1,
          }
          const client = await getClient(location.file)
          const result = await client.execute("definition", location)
          await handleDefinitionResult(result, editor, histGoForward)
        },
      }
    },
  }
}

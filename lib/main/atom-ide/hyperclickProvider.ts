import * as Atom from "atom"
import {HyperclickProvider} from "atom-ide-base"
import {GetClientFunction} from "../../client"
import {handleFindReferencesResult} from "../atom/commands/findReferences"
import {handleDefinitionResult} from "../atom/commands/goToDeclaration"
import {Dependencies} from "../atom/commands/registry"
import {isTypescriptEditorWithPath} from "../atom/utils"

let hyperclickProviderPriority = 0
export function getHyperclickProvider(
  getClient: GetClientFunction,
  histGoForward: Dependencies["histGoForward"],
): HyperclickProvider {
  return {
    priority: hyperclickProviderPriority++,
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
          const resLoc = result.body ? result.body[0] : undefined
          if (
            result.body?.length === 1 &&
            resLoc?.start.line === location.line &&
            resLoc?.start.offset === location.offset
          ) {
            const references = await client.execute("references", location)
            await handleFindReferencesResult(references, editor, histGoForward)
          } else {
            await handleDefinitionResult(result, editor, histGoForward)
          }
        },
      }
    },
  }
}

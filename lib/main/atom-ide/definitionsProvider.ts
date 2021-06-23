import {Definition, DefinitionProvider} from "atom-ide-base"
import {FileSpan} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {
  getFilePathPosition,
  isTypescriptEditorWithPath,
  spanToRange,
  typeScriptScopes,
} from "../atom/utils"

let definitionProviderPriority = 0
export function getDefinitionProvider(getClient: GetClientFunction): DefinitionProvider {
  return {
    name: "atom-typescript",
    priority: definitionProviderPriority++,
    grammarScopes: typeScriptScopes(),
    wordRegExp: /([A-Za-z0-9_])+|['"`](\\.|[^'"`\\\\])*['"`]/g,
    async getDefinition(editor, position) {
      if (!isTypescriptEditorWithPath(editor)) return
      const location = getFilePathPosition(editor, position)
      if (!location) return
      const client = await getClient(location.file)
      const result = await client.execute("definition", location)
      if (!result.body) return
      if (result.body.length === 0) return

      return {
        queryRange: undefined,
        definitions: result.body.map(fileSpanToDefinition),
      }
    },
  }
}

function fileSpanToDefinition(span: FileSpan): Definition {
  const range = spanToRange(span)
  return {
    path: span.file,
    position: range.start,
    range,
    language: "TypeScript",
  }
}

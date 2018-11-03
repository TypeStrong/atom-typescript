import {CodeHighlightProvider} from "atom/ide"
import {GetClientFunction} from "../../client"
import {
  getFilePathPosition,
  isTypescriptEditorWithPath,
  spanToRange,
  typeScriptScopes,
} from "../atom/utils"

export function getCodeHighlightProvider(getClient: GetClientFunction): CodeHighlightProvider {
  return {
    grammarScopes: typeScriptScopes(),
    priority: 100,
    async highlight(editor, position) {
      if (!isTypescriptEditorWithPath(editor)) return
      const location = getFilePathPosition(editor, position)
      if (!location) return
      const client = await getClient(location.file)
      const result = await client.execute("occurrences", location)
      if (!result.body) return
      return result.body.map(spanToRange)
    },
  }
}

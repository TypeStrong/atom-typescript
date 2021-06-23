import {CodeHighlightProvider} from "atom-ide-base"
import {DocumentHighlightsItem} from "typescript/lib/protocol"
import {GetClientFunction} from "../../client"
import {
  getFilePathPosition,
  isTypescriptEditorWithPath,
  spanToRange,
  typeScriptScopes,
} from "../atom/utils"

let codeHighlightProviderPriority = 100
export function getCodeHighlightProvider(getClient: GetClientFunction): CodeHighlightProvider {
  return {
    grammarScopes: typeScriptScopes(),
    priority: codeHighlightProviderPriority++,
    async highlight(editor, position) {
      if (!isTypescriptEditorWithPath(editor)) return
      const location = getFilePathPosition(editor, position)
      if (!location) return
      const client = await getClient(location.file)
      const result = await client.execute("documentHighlights", {
        ...location,
        filesToSearch: [location.file],
      })
      if (!result.body) return
      return Array.from(getSpans(location.file, result.body))
    },
  }
}

function* getSpans(file: string, data: DocumentHighlightsItem[]) {
  for (const fileInfo of data) {
    if (fileInfo.file !== file) continue
    yield* fileInfo.highlightSpans.map(spanToRange)
  }
}

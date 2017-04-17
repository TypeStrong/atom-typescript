import {commands} from "./registry"
import {
  CodeEdit,
  commandForTypeScript,
  formatCode,
  FormatCodeSettings,
  LocationRangeQuery,
  rangeToLocationRange,
} from "../utils"
import {loadProjectConfig} from "../../atomts"

commands.set("typescript:format-code", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const editor = atom.workspace.getActiveTextEditor()
    const filePath = editor.getPath()
    const ranges: LocationRangeQuery[] = []

    for (const selection of editor.getSelectedBufferRanges()) {
      if (!selection.isEmpty()) {
        ranges.push(rangeToLocationRange(selection))
      }
    }

    // Format the whole document if there are no ranges added
    if (ranges.length === 0) {
      const end = editor.buffer.getEndPosition()
      ranges.push({
        line: 1,
        offset: 1,
        endLine: end.row + 1,
        endOffset: end.column + 1
      })
    }

    const client = await deps.getClient(filePath)
    const options = await getProjectCodeSettings(filePath)

    // Newer versions of tsserver ignore the options argument so we need to call
    // configure with the format code options to make the format command do anything.
    client.executeConfigure({
      formatOptions: options
    })

    const edits: CodeEdit[] = []

    // Collect all edits together so we can update everything in a single transaction
    for (const range of ranges) {
      const result = await client.executeFormat({...range, options, file: filePath})
      if (result.body) {
        edits.push(...result.body)
      }
    }

    if (edits.length > 0) {
      editor.transact(() => {
        formatCode(editor, edits)
      })
    }
  }
})

async function getProjectCodeSettings(filePath: string): Promise<FormatCodeSettings> {
  const config = await loadProjectConfig(filePath)
  const options = config.formatCodeOptions

  return {
    indentSize: atom.config.get("editor.tabLength"),
    tabSize: atom.config.get("editor.tabLength"),
    ...options,
  }
}

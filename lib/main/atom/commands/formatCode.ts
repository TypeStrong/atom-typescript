import {addCommand} from "./registry"
import {CodeEdit, LocationRangeQuery, rangeToLocationRange, spanToRange} from "../utils"
import {TextEditor} from "atom"

addCommand("atom-text-editor", "typescript:format-code", deps => ({
  description: "Format code in currently active text editor",
  async didDispatch(editor) {
    const filePath = editor.getPath()
    if (filePath === undefined) return

    const ranges: LocationRangeQuery[] = []

    for (const selection of editor.getSelectedBufferRanges()) {
      if (!selection.isEmpty()) {
        ranges.push(rangeToLocationRange(selection))
      }
    }

    // Format the whole document if there are no ranges added
    if (ranges.length === 0) {
      const end = editor.getBuffer().getEndPosition()
      ranges.push({
        line: 1,
        offset: 1,
        endLine: end.row + 1,
        endOffset: end.column + 1,
      })
    }

    const client = await deps.getClient(filePath)
    const edits: CodeEdit[] = []

    // Collect all edits together so we can update everything in a single transaction
    for (const range of ranges) {
      const result = await client.execute("format", {...range, file: filePath})
      if (result.body) {
        edits.push(...result.body)
      }
    }

    if (edits.length > 0) {
      editor.transact(() => {
        formatCode(editor, edits)
      })
    }
  },
}))

function formatCode(editor: TextEditor, edits: CodeEdit[]) {
  // The code edits need to be applied in reverse order
  for (let i = edits.length - 1; i >= 0; i--) {
    editor.setTextInBufferRange(spanToRange(edits[i]), edits[i].newText)
  }
}

import {commands} from "./registry"
import {
  commandForTypeScript,
  LocationRangeQuery,
  rangeToLocationRange,
  formatCode,
  CodeEdit
} from "../utils"

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
    const edits: CodeEdit[] = []

    // Collect all edits together so we can update in a single transaction
    for (const range of ranges) {
      const result = await client.executeFormat({...range, file: filePath})
      if (result.body) {
        edits.push(...result.body)
      }
    }

    if (edits.length > 0) {
      editor.transact(() => {
        formatCode(editor, edits)
      })
    }

    // if (selection.isEmpty()) {
      // console.log("no selection, format all")
      // parent.formatDocument({ filePath: filePath }).then((result) => {
      //     if (!result.edits.length) return;
      //     editor.transact(() => {
      //         atomUtils.formatCode(editor, result.edits);
      //     });
      // });
    // } else {
      // console.log("selcetion", selection, filePath)
      //
      // parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then((result) => {
      //     if (!result.edits.length) return;
      //     editor.transact(() => {
      //         atomUtils.formatCode(editor, result.edits);
      //     });
      // });
    // }
  }
})

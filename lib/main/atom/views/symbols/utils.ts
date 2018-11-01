import {TextEditor} from "atom"
import {EditorPositionHistoryManager} from "../../editorPositionHistoryManager"
import {Tag} from "./symbolsTag"

export async function openTag(
  tag: Tag,
  editor: TextEditor,
  histGoForward: EditorPositionHistoryManager["goForward"],
) {
  if (tag.file !== undefined) {
    return histGoForward(editor, {
      file: tag.file,
      start: {
        line: tag.position.row + 1,
        offset: tag.position.column + 1,
      },
    })
  }
}

export function serializeEditorState(editor: TextEditor) {
  const editorElement = atom.views.getView(editor)
  const scrollTop = editorElement.getScrollTop()

  return {
    bufferRanges: editor.getSelectedBufferRanges(),
    scrollTop,
  }
}

export function deserializeEditorState(
  editor: TextEditor,
  {bufferRanges, scrollTop}: ReturnType<typeof serializeEditorState>,
) {
  const editorElement = atom.views.getView(editor)
  editor.setSelectedBufferRanges(bufferRanges)
  editorElement.setScrollTop(scrollTop)
}

import {Tag} from "./symbolsTag"
import {TextEditor} from "atom"
import {EditorPositionHistoryManager} from "../../editorPositionHistoryManager"

export async function openTag(tag: Tag, editor: TextEditor, ephm: EditorPositionHistoryManager) {
  if (tag.file !== undefined) {
    return ephm.goForward(editor, {
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

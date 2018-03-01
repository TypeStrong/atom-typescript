import {Tag} from "./symbolsTag"
import {TextEditor} from "atom"

// TODO: Hook this into return-from-declaration and findReferences
export async function openTag(tag: Tag) {
  if (tag.file) {
    return atom.workspace.open(tag.file, {
      initialLine: tag.position.row,
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

export function deserializeEditorState(editor: TextEditor, {bufferRanges, scrollTop}: any) {
  const editorElement = atom.views.getView(editor)
  editor.setSelectedBufferRanges(bufferRanges)
  editorElement.setScrollTop(scrollTop)
}

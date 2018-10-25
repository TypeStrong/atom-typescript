import {TextEditor} from "atom"

// screen position from mouse event -- with <3 from Atom-Haskell
export function bufferPositionFromMouseEvent(
  editor: TextEditor,
  event: {clientX: number; clientY: number},
) {
  const sp = atom.views
    .getView(editor)
    .getComponent()
    .screenPositionForMouseEvent(event)
  if (isNaN(sp.row) || isNaN(sp.column)) {
    return
  }
  return editor.bufferPositionForScreenPosition(sp)
}

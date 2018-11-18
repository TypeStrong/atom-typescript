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

export function adjustElementPosition(
  element: HTMLElement,
  parent: HTMLElement,
  box: {left: number; right: number; top: number; bottom: number},
  pos: "top" | "bottom",
) {
  const offset = 10
  let left = box.right
  let right: number | false = false
  let top

  let whiteSpace = ""

  const clientWidth = parent.clientWidth
  const offsetWidth = element.offsetWidth
  const offsetHeight = element.offsetHeight

  // X axis adjust
  if (left + offsetWidth >= clientWidth) {
    left = clientWidth - offsetWidth - offset
  }
  if (left < 0) {
    whiteSpace = "pre-wrap"
    left = offset
    right = offset
  }

  if (pos === "bottom") {
    const clientHeight = parent.clientHeight

    top = box.bottom
    // Y axis adjust
    if (top + offsetHeight >= clientHeight) {
      top = box.top - offsetHeight
    }
  } else if (pos === "top") {
    top = box.top - offsetHeight

    // Y axis adjust
    if (top < 0) {
      top = box.bottom
    }
  }
  element.style.left = `${left}px`
  element.style.top = `${top}px`
  if (right !== false) element.style.right = `${right}px`
  if (whiteSpace) element.style.whiteSpace = whiteSpace
}

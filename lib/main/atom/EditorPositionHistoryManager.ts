import {FileLocationQuery, getFilePathPosition} from "./utils"
import {TextEditor} from "atom"

interface OpenParams {
  file: string
  start: {line: number; offset: number}
}

export class EditorPositionHistoryManager {
  constructor(private prevCursorPositions: FileLocationQuery[] = []) {}

  public goBack() {
    const position = this.prevCursorPositions.pop()
    if (!position) {
      atom.notifications.addInfo("AtomTS: Previous position not found.")
      return
    }
    this.open({
      file: position.file,
      start: {line: position.line, offset: position.offset},
    })
  }

  public goForward(currentEditor: TextEditor, item: OpenParams) {
    const location = getFilePathPosition(currentEditor)
    if (location) this.prevCursorPositions.push(location)
    this.open(item)
  }

  public dispose() {
    // NOOP
  }

  private async open(item: OpenParams) {
    const editor = await atom.workspace.open(item.file, {
      initialLine: item.start.line - 1,
      initialColumn: item.start.offset - 1,
    })
    if (atom.workspace.isTextEditor(editor)) {
      editor.scrollToCursorPosition({center: true})
    }
  }
}

import {FileLocationQuery, getFilePathPosition} from "./utils"
import {TextEditor} from "atom"

interface OpenParams {
  file: string
  start: {line: number; offset: number}
}

export class EditorPositionHistoryManager {
  constructor(private prevCursorPositions: FileLocationQuery[] = []) {}

  public async goBack(): Promise<object | undefined> {
    const position = this.prevCursorPositions.pop()
    if (!position) {
      atom.notifications.addInfo("AtomTS: Previous position not found.")
      return
    }
    return this.open({
      file: position.file,
      start: {line: position.line, offset: position.offset},
    })
  }

  public async goForward(currentEditor: TextEditor, item: OpenParams): Promise<object> {
    const location = getFilePathPosition(currentEditor)
    if (location) this.prevCursorPositions.push(location)
    return this.open(item)
  }

  public dispose() {
    // NOOP
  }

  public serialize() {
    return this.prevCursorPositions
  }

  private async open(item: OpenParams): Promise<object> {
    const editor = await atom.workspace.open(item.file, {
      initialLine: item.start.line - 1,
      initialColumn: item.start.offset - 1,
    })
    if (atom.workspace.isTextEditor(editor)) {
      editor.scrollToCursorPosition({center: true})
    }
    return editor
  }
}

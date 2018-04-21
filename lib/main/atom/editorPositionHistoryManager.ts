import {FileLocationQuery, getFilePathPosition} from "./utils"
import {TextEditor} from "atom"

interface OpenParams {
  file: string
  start: {line: number; offset: number}
}

export class EditorPositionHistoryManager {
  constructor(private prevCursorPositions: FileLocationQuery[] = []) {}

  public async goBack(): Promise<object | undefined> {
    return this.goHistory(1)
  }

  public async goHistory(depth: number): Promise<object | undefined> {
    let position
    while (depth-- > 0) position = this.prevCursorPositions.pop()
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
    if (location) {
      this.prevCursorPositions.push(location)
      const maxItems = 100
      if (this.prevCursorPositions.length > maxItems) {
        this.prevCursorPositions.splice(0, this.prevCursorPositions.length - maxItems)
      }
    }
    return this.open(item)
  }

  public getHistory() {
    return this.prevCursorPositions
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
      searchAllPanes: true,
    })
    if (atom.workspace.isTextEditor(editor)) {
      editor.scrollToCursorPosition({center: true})
    }
    return editor
  }
}

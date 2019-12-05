import * as Atom from "atom"
import {TSClient} from "../../../client"
import {handlePromise} from "../../../utils"
import {TooltipView} from "./tooltipView"

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

export class TooltipController {
  private cancelled = false
  private view?: TooltipView
  constructor(
    private getClient: (ed: Atom.TextEditor) => Promise<TSClient | undefined>,
    editor: Atom.TextEditor,
    e: {clientX: number; clientY: number},
    bufferPt: Atom.Point,
  ) {
    handlePromise(this.initialize(editor, e, bufferPt))
  }

  public dispose() {
    this.cancelled = true
    if (this.view) {
      handlePromise(this.view.destroy())
      this.view = undefined
    }
  }

  private async initialize(
    editor: Atom.TextEditor,
    e: {clientX: number; clientY: number},
    bufferPt: Atom.Point,
  ) {
    const rawView = atom.views.getView(editor)
    // tslint:disable-next-line: one-variable-per-declaration
    let curCharPixelPt, nextCharPixelPt
    try {
      curCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt)
      nextCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]))
    } catch (e) {
      console.warn(e)
      return
    }

    if (curCharPixelPt.left >= nextCharPixelPt.left) return
    // find out show position
    const offset = editor.getLineHeightInPixels() * 0.7
    const tooltipRect = {
      left: e.clientX,
      right: e.clientX,
      top: e.clientY - offset,
      bottom: e.clientY + offset,
    }

    const msg = await this.getMessage(editor, bufferPt)
    if (this.cancelled) return
    if (msg !== undefined) await this.showTooltip(tooltipRect, msg)
  }

  private async getMessage(editor: Atom.TextEditor, bufferPt: Atom.Point) {
    let result: protocol.QuickInfoResponse
    const client = await this.getClient(editor)
    if (!client) return
    const filePath = editor.getPath()
    try {
      if (filePath === undefined) {
        return
      }
      result = await client.execute("quickinfo", {
        file: filePath,
        line: bufferPt.row + 1,
        offset: bufferPt.column + 1,
      })
    } catch (e) {
      return
    }

    return result.body
  }

  private async showTooltip(tooltipRect: Rect, info: protocol.QuickInfoResponseBody) {
    this.view = new TooltipView()
    document.body.appendChild(this.view.element)
    await this.view.update({...tooltipRect, info})
  }
}

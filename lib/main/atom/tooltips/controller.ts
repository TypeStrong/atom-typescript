import {TooltipView} from "./tooltipView"
import {TSClient} from "../../../client"
import * as Atom from "atom"
import {handlePromise} from "../../../utils"
import escape = require("escape-html")
import {bufferPositionFromMouseEvent} from "./util"

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
  ) {
    handlePromise(this.initialize(editor, e))
  }

  public dispose() {
    this.cancelled = true
    if (this.view) {
      handlePromise(this.view.destroy())
      this.view = undefined
    }
  }

  private async initialize(editor: Atom.TextEditor, e: {clientX: number; clientY: number}) {
    const bufferPt = bufferPositionFromMouseEvent(editor, e)
    if (!bufferPt) return

    const rawView = atom.views.getView(editor)
    const curCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt)
    const nextCharPixelPt = rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]))

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

    const {displayString, documentation} = result.body!

    let message = `<b>${escape(displayString)}</b>`
    if (documentation) {
      message =
        message + `<br/><i>${escape(documentation).replace(/(?:\r\n|\r|\n)/g, "<br />")}</i>`
    }
    return message
  }

  private async showTooltip(tooltipRect: Rect, message: string) {
    this.view = new TooltipView()
    document.body.appendChild(this.view.element)
    await this.view.update({...tooltipRect, text: message})
  }
}

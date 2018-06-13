// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import atomUtils = require("./utils")
import * as Atom from "atom"
import fs = require("fs")
import {listen} from "./utils/element-listener"
import {TooltipView} from "./views/tooltipView"
import escape = require("escape-html")
import {TypescriptServiceClient} from "../../client/client"

const tooltipMap = new WeakMap<Atom.TextEditor, TooltipManager>()

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

// screen position from mouse event -- with <3 from Atom-Haskell
function bufferPositionFromMouseEvent(
  editor: Atom.TextEditor,
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

export async function showExpressionAt(editor: Atom.TextEditor, pt: Atom.Point) {
  const ed = tooltipMap.get(editor)
  if (ed) {
    return ed.showExpressionTypeKbd(pt)
  }
}

export class TooltipManager {
  private static exprTypeTooltip: TooltipView | undefined
  private clientPromise?: Promise<TypescriptServiceClient>
  private rawView: Atom.TextEditorElement
  private lines: Element
  private subscriptions = new Atom.CompositeDisposable()
  private exprTypeTimeout: number | undefined
  private lastExprTypeBufferPt?: Atom.Point
  private cancelShowTooltip?: () => void

  constructor(
    private editor: Atom.TextEditor,
    private getClient: (fp: string) => Promise<TypescriptServiceClient>,
  ) {
    this.rawView = atom.views.getView(editor)
    this.lines = this.rawView.querySelector(".lines")!
    tooltipMap.set(editor, this)

    this.subscriptions.add(
      listen(this.rawView, "mousemove", ".scroll-view", this.trackMouseMovement),
      listen(this.rawView, "mouseout", ".scroll-view", this.clearExprTypeTimeout),
      listen(this.rawView, "keydown", ".scroll-view", this.clearExprTypeTimeout),
      this.rawView.onDidChangeScrollTop(this.clearExprTypeTimeout),
      this.rawView.onDidChangeScrollLeft(this.clearExprTypeTimeout),
    )

    this.subscriptions.add(this.editor.onDidChangePath(this.reinitialize))

    this.reinitialize()
  }

  public dispose() {
    this.subscriptions.dispose()
    this.clearExprTypeTimeout()
  }

  public async showExpressionTypeKbd(pt: Atom.Point) {
    const view = atom.views.getView(this.editor)
    const px = view.pixelPositionForBufferPosition(pt)
    return this.showExpressionType(this.mousePositionForPixelPosition(px))
  }

  private reinitialize = () => {
    this.clientPromise = undefined
    // Only on ".ts" files
    const filePath = this.editor.getPath()
    if (filePath === undefined) return
    if (!atomUtils.isTypescriptEditorWithPath(this.editor)) return
    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) return

    this.clientPromise = this.getClient(filePath)
  }

  private mousePositionForPixelPosition(p: Atom.PixelPosition) {
    const linesRect = this.lines.getBoundingClientRect()
    return {
      clientY: p.top + linesRect.top + this.editor.getLineHeightInPixels() / 2,
      clientX: p.left + linesRect.left,
    }
  }

  private async showExpressionType(e: {clientX: number; clientY: number}) {
    if (!this.clientPromise) return
    // If we are already showing we should wait for that to clear
    if (TooltipManager.exprTypeTooltip) return

    if (this.cancelShowTooltip) this.cancelShowTooltip()

    let cancelled = false
    this.cancelShowTooltip = () => {
      cancelled = true
      this.cancelShowTooltip = undefined
    }

    const bufferPt = bufferPositionFromMouseEvent(this.editor, e)
    if (!bufferPt) return
    const curCharPixelPt = this.rawView.pixelPositionForBufferPosition(bufferPt)
    const nextCharPixelPt = this.rawView.pixelPositionForBufferPosition(bufferPt.traverse([0, 1]))

    if (curCharPixelPt.left >= nextCharPixelPt.left) {
      return
    }

    // find out show position
    const offset = this.editor.getLineHeightInPixels() * 0.7
    const tooltipRect = {
      left: e.clientX,
      right: e.clientX,
      top: e.clientY - offset,
      bottom: e.clientY + offset,
    }

    const msg = await this.getMessage(bufferPt)
    if (cancelled) return
    if (msg !== undefined) this.showTooltip(tooltipRect, msg)
  }

  private async getMessage(bufferPt: Atom.Point) {
    let result: protocol.QuickInfoResponse
    if (!this.clientPromise) return
    const client = await this.clientPromise
    const filePath = this.editor.getPath()
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

  private showTooltip(tooltipRect: Rect, message: string) {
    if (TooltipManager.exprTypeTooltip) return
    TooltipManager.exprTypeTooltip = new TooltipView()
    document.body.appendChild(TooltipManager.exprTypeTooltip.element)
    TooltipManager.exprTypeTooltip.update({...tooltipRect, text: message})
  }

  /** clears the timeout && the tooltip */
  private clearExprTypeTimeout = () => {
    if (this.exprTypeTimeout !== undefined) {
      clearTimeout(this.exprTypeTimeout)
      this.exprTypeTimeout = undefined
    }
    if (this.cancelShowTooltip) this.cancelShowTooltip()
    this.hideExpressionType()
  }

  private hideExpressionType() {
    if (!TooltipManager.exprTypeTooltip) return
    TooltipManager.exprTypeTooltip.destroy()
    TooltipManager.exprTypeTooltip = undefined
  }

  private trackMouseMovement = (e: MouseEvent) => {
    const bufferPt = bufferPositionFromMouseEvent(this.editor, e)
    if (!bufferPt) return
    if (
      this.lastExprTypeBufferPt &&
      this.lastExprTypeBufferPt.isEqual(bufferPt) &&
      TooltipManager.exprTypeTooltip
    ) {
      return
    }

    this.lastExprTypeBufferPt = bufferPt

    this.clearExprTypeTimeout()
    this.exprTypeTimeout = window.setTimeout(
      () => this.showExpressionType(e),
      atom.config.get("atom-typescript.tooltipDelay"),
    )
  }
}

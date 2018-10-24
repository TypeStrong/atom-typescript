// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import atomUtils = require("../utils")
import * as Atom from "atom"
import fs = require("fs")
import {listen} from "../utils/element-listener"
import {GetClientFunction} from "../../../client"
import {TooltipController} from "./controller"
import {bufferPositionFromMouseEvent} from "./util"

interface EditorInfo {
  rawView: Atom.TextEditorElement
  lines: Element
}

export class TooltipManager {
  private subscriptions = new Atom.CompositeDisposable()
  private pendingTooltip?: TooltipController
  private editorMap = new WeakMap<Atom.TextEditor, EditorInfo>()
  private exprTypeTimeout: number | undefined

  constructor(private getClientInternal: GetClientFunction) {
    this.subscriptions.add(
      atom.workspace.observeTextEditors(editor => {
        const rawView = atom.views.getView(editor)
        const lines = rawView.querySelector(".lines")!
        this.editorMap.set(editor, {
          rawView,
          lines,
        })
        const disp = new Atom.CompositeDisposable()
        disp.add(
          listen(rawView, "mousemove", ".scroll-view", this.trackMouseMovement(editor)),
          listen(rawView, "mouseout", ".scroll-view", this.clearExprTypeTimeout),
          listen(rawView, "keydown", ".scroll-view", this.clearExprTypeTimeout),
          rawView.onDidChangeScrollTop(this.clearExprTypeTimeout),
          rawView.onDidChangeScrollLeft(this.clearExprTypeTimeout),
          editor.onDidDestroy(() => {
            disp.dispose()
            this.subscriptions.remove(disp)
          }),
        )
        this.subscriptions.add(disp)
      }),
    )
  }

  public dispose() {
    this.subscriptions.dispose()
    this.clearExprTypeTimeout()
  }

  public async showExpressionAt(editor: Atom.TextEditor, pt: Atom.Point) {
    return this.showExpressionTypeKbd(editor, pt)
  }

  public async showExpressionTypeKbd(editor: Atom.TextEditor, pt: Atom.Point) {
    const view = atom.views.getView(editor)
    const px = view.pixelPositionForBufferPosition(pt)
    return this.showExpressionType(editor, this.mousePositionForPixelPosition(editor, px))
  }

  private getClient = async (editor: Atom.TextEditor) => {
    // Only on ".ts" files
    const filePath = editor.getPath()
    if (filePath === undefined) return
    if (!atomUtils.isTypescriptEditorWithPath(editor)) return
    // We only create a "program" once the file is persisted to disk
    if (!fs.existsSync(filePath)) return

    return this.getClientInternal(filePath)
  }

  private mousePositionForPixelPosition(editor: Atom.TextEditor, p: Atom.PixelPosition) {
    const data = this.editorMap.get(editor)
    if (!data) throw new Error("No editor data!")
    const linesRect = data.lines.getBoundingClientRect()
    return {
      clientY: p.top + linesRect.top + editor.getLineHeightInPixels() / 2,
      clientX: p.left + linesRect.left,
    }
  }

  private async showExpressionType(editor: Atom.TextEditor, e: {clientX: number; clientY: number}) {
    const data = this.editorMap.get(editor)
    if (!data) return

    if (this.pendingTooltip) this.pendingTooltip.dispose()
    this.pendingTooltip = new TooltipController(this.getClient, editor, e)
  }

  /** clears the timeout && the tooltip */
  private clearExprTypeTimeout = () => {
    if (this.exprTypeTimeout !== undefined) {
      clearTimeout(this.exprTypeTimeout)
      this.exprTypeTimeout = undefined
    }
    this.hideExpressionType()
  }

  private hideExpressionType() {
    if (!this.pendingTooltip) return
    this.pendingTooltip.dispose()
    this.pendingTooltip = undefined
  }

  private trackMouseMovement = (editor: Atom.TextEditor) => {
    let lastExprTypeBufferPt: Atom.Point | undefined
    return (e: MouseEvent) => {
      const bufferPt = bufferPositionFromMouseEvent(editor, e)
      if (!bufferPt) return
      if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && this.pendingTooltip) {
        return
      }

      lastExprTypeBufferPt = bufferPt

      this.clearExprTypeTimeout()
      this.exprTypeTimeout = window.setTimeout(
        () => this.showExpressionType(editor, e),
        atom.config.get("atom-typescript.tooltipDelay"),
      )
    }
  }
}

// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import * as Atom from "atom"
import fs from "fs"
import {GetClientFunction} from "../../../client"
import * as atomUtils from "../utils"
import {listen} from "../utils/element-listener"
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
      atom.workspace.observeTextEditors((editor) => {
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
            this.clearExprTypeTimeout()
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

  public showExpressionAt(editor: Atom.TextEditor) {
    const pt = editor.getLastCursor().getBufferPosition()
    const view = atom.views.getView(editor)
    let px
    try {
      px = view.pixelPositionForBufferPosition(pt)
    } catch (e) {
      console.warn(e)
      return
    }
    this.showExpressionType(editor, this.mousePositionForPixelPosition(editor, px), pt)
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
    const rawView = atom.views.getView(editor)
    const lines = rawView.querySelector(".lines")!
    const linesRect = lines.getBoundingClientRect()
    return {
      clientY: p.top + linesRect.top + editor.getLineHeightInPixels() / 2,
      clientX: p.left + linesRect.left,
    }
  }

  private showExpressionType(
    editor: Atom.TextEditor,
    e: {clientX: number; clientY: number},
    bufferPt: Atom.Point,
  ) {
    if (this.pendingTooltip) this.pendingTooltip.dispose()
    this.pendingTooltip = new TooltipController(this.getClient, editor, e, bufferPt)
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
        () => this.showExpressionType(editor, e, bufferPt),
        atom.config.get("atom-typescript").tooltipDelay,
      )
    }
  }
}

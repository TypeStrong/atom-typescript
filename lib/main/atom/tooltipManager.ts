// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import atomUtils = require("./utils")
import {clientResolver} from "../atomts"
import * as Atom from "atom"
import path = require("path")
import fs = require("fs")
import {listen} from "./utils/element-listener"
import {TooltipView} from "./views/tooltipView"
import escape = require("escape-html")

const tooltipMap = new WeakMap<Atom.TextEditor, (pt: Atom.Point) => Promise<void>>()

// screen position from mouse event -- with <3 from Atom-Haskell
export function bufferPositionFromMouseEvent(
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

export function showExpressionAt(editor: Atom.TextEditor, pt: Atom.Point) {
  const ed = tooltipMap.get(editor)
  if (ed) {
    return ed(pt)
  }
}

export function attach(editor: Atom.TextEditor) {
  const rawView = atom.views.getView(editor)

  // Only on ".ts" files
  const filePath = editor.getPath()
  if (!filePath) {
    return
  }
  const filename = path.basename(filePath)
  const ext = path.extname(filename)
  if (!atomUtils.isAllowedExtension(ext)) {
    return
  }

  // We only create a "program" once the file is persisted to disk
  if (!fs.existsSync(filePath)) {
    return
  }

  const clientPromise = clientResolver.get(filePath)
  const subscriber = new Atom.CompositeDisposable()
  let exprTypeTimeout: number | undefined
  let exprTypeTooltip: TooltipView | undefined

  // to debounce mousemove event's firing for some reason on some machines
  let lastExprTypeBufferPt: Atom.Point

  subscriber.add(
    listen(rawView, "mousemove", ".scroll-view", (e: MouseEvent) => {
      const bufferPt = bufferPositionFromMouseEvent(editor, e)
      if (!bufferPt) return
      if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip) {
        return
      }

      lastExprTypeBufferPt = bufferPt

      clearExprTypeTimeout()
      exprTypeTimeout = window.setTimeout(() => showExpressionType(e), 100)
    }),
  )
  subscriber.add(listen(rawView, "mouseout", ".scroll-view", () => clearExprTypeTimeout()))
  subscriber.add(listen(rawView, "keydown", ".scroll-view", () => clearExprTypeTimeout()))

  // Setup for clearing
  editor.onDidDestroy(() => deactivate())

  tooltipMap.set(editor, showExpressionTypeKbd)

  const lines = rawView.querySelector(".lines")!

  function mousePositionForPixelPosition(p: Atom.PixelPosition) {
    const linesRect = lines.getBoundingClientRect()
    return {
      clientY: p.top + linesRect.top + editor.getLineHeightInPixels() / 2,
      clientX: p.left + linesRect.left,
    }
  }

  async function showExpressionTypeKbd(pt: Atom.Point) {
    const view = atom.views.getView(editor)
    const px = view.pixelPositionForBufferPosition(pt)
    return showExpressionType(mousePositionForPixelPosition(px))
  }

  async function showExpressionType(e: {clientX: number; clientY: number}) {
    // If we are already showing we should wait for that to clear
    if (exprTypeTooltip) {
      return
    }

    const bufferPt = bufferPositionFromMouseEvent(editor, e)
    if (!bufferPt) return
    const curCharPixelPt = rawView.pixelPositionForBufferPosition(
      Atom.Point.fromObject([bufferPt.row, bufferPt.column]),
    )
    const nextCharPixelPt = rawView.pixelPositionForBufferPosition(
      Atom.Point.fromObject([bufferPt.row, bufferPt.column + 1]),
    )

    if (curCharPixelPt.left >= nextCharPixelPt.left) {
      return
    }

    // find out show position
    const offset = editor.getLineHeightInPixels() * 0.7
    const tooltipRect = {
      left: e.clientX,
      right: e.clientX,
      top: e.clientY - offset,
      bottom: e.clientY + offset,
    }
    let result: protocol.QuickInfoResponse
    const client = await clientPromise
    try {
      if (!filePath) {
        return
      }
      result = await client.executeQuickInfo({
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
    if (!exprTypeTooltip) {
      exprTypeTooltip = new TooltipView()
      document.body.appendChild(exprTypeTooltip.refs.main)
      exprTypeTooltip.update({...tooltipRect, text: message})
    }
  }

  function deactivate() {
    subscriber.dispose()
    clearExprTypeTimeout()
  }
  /** clears the timeout && the tooltip */
  function clearExprTypeTimeout() {
    if (exprTypeTimeout) {
      clearTimeout(exprTypeTimeout)
      exprTypeTimeout = undefined
    }
    hideExpressionType()
  }
  function hideExpressionType() {
    if (!exprTypeTooltip) {
      return
    }
    exprTypeTooltip.destroy()
    exprTypeTooltip = undefined
  }
}

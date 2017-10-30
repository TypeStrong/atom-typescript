// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import atomUtils = require("./utils")
import {clientResolver} from "../atomts"
import * as Atom from "atom"
import path = require("path")
import fs = require("fs")
import emissary = require("emissary")
const Subscriber = emissary.Subscriber
import tooltipView = require("./views/tooltipView")
import TooltipView = tooltipView.TooltipView
import {$} from "atom-space-pen-views"
import escape = require("escape-html")

export function getFromShadowDom(element: JQuery, selector: string): JQuery {
  const el = element[0]
  const found = (el as any).querySelectorAll(selector)
  return $(found[0])
}

// screen position from mouse event -- with <3 from Atom-Haskell
export function bufferPositionFromMouseEvent(editor: Atom.TextEditor, event: MouseEvent) {
  const sp = (atom.views.getView(editor) as any).component.screenPositionForMouseEvent(event)
  if (isNaN(sp.row) || isNaN(sp.column)) {
    return
  }
  return (editor as any).bufferPositionForScreenPosition(sp)
}

export function attach(editorView: JQuery, editor: Atom.TextEditor) {
  const rawView: any = editorView[0]

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
  const scroll = getFromShadowDom(editorView, ".scroll-view")
  const subscriber = new Subscriber()
  let exprTypeTimeout: any | undefined
  let exprTypeTooltip: TooltipView | undefined

  // to debounce mousemove event's firing for some reason on some machines
  let lastExprTypeBufferPt: any

  subscriber.subscribe(scroll, "mousemove", (e: MouseEvent) => {
    const bufferPt = bufferPositionFromMouseEvent(editor, e)
    if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip) {
      return
    }

    lastExprTypeBufferPt = bufferPt

    clearExprTypeTimeout()
    exprTypeTimeout = setTimeout(() => showExpressionType(e), 100)
  })
  subscriber.subscribe(scroll, "mouseout", () => clearExprTypeTimeout())
  subscriber.subscribe(scroll, "keydown", () => clearExprTypeTimeout())

  // Setup for clearing
  editor.onDidDestroy(() => deactivate())

  async function showExpressionType(e: MouseEvent) {
    // If we are already showing we should wait for that to clear
    if (exprTypeTooltip) {
      return
    }

    const bufferPt = bufferPositionFromMouseEvent(editor, e)
    const curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column])
    const nextCharPixelPt = rawView.pixelPositionForBufferPosition([
      bufferPt.row,
      bufferPt.column + 1,
    ])

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
    exprTypeTooltip = new TooltipView(tooltipRect)
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
    if (exprTypeTooltip) {
      exprTypeTooltip.updateText(message)
    }
  }

  function deactivate() {
    subscriber.unsubscribe()
    clearExprTypeTimeout()
  }
  /** clears the timeout && the tooltip */
  function clearExprTypeTimeout() {
    if (exprTypeTimeout) {
      clearTimeout(exprTypeTimeout)
      exprTypeTimeout = null
    }
    hideExpressionType()
  }
  function hideExpressionType() {
    if (!exprTypeTooltip) {
      return
    }
    exprTypeTooltip.$.remove()
    exprTypeTooltip = undefined
  }
}

function pixelPositionFromMouseEvent(editorView: JQuery, event: MouseEvent) {
  const clientX = event.clientX
  const clientY = event.clientY
  const linesClientRect = getFromShadowDom(editorView, ".lines")[0].getBoundingClientRect()
  const top = clientY - linesClientRect.top
  const left = clientX - linesClientRect.left
  return {top, left}
}

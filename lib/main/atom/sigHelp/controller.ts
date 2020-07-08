import * as Atom from "atom"
import {debounce} from "lodash"
import {GetClientFunction} from "../../../client"
import {handlePromise} from "../../../utils"
import {isTypescriptEditorWithPath} from "../utils"
import {TooltipView} from "./tooltipView"

export class TooltipController {
  private cancelled = false
  private view: TooltipView
  private disposables = new Atom.CompositeDisposable()
  constructor(
    private deps: {
      getClient: GetClientFunction
    },
    private editor: Atom.TextEditor,
    bufferPt: Atom.Point,
  ) {
    const rawView = atom.views.getView(this.editor)
    this.view = new TooltipView(rawView)
    rawView.appendChild(this.view.element)
    const debouncedUpdate = debounce(this.updateTooltip.bind(this), 100, {leading: true})
    this.disposables.add(
      this.editor.onDidChangeCursorPosition((evt) => {
        bufferPt = evt.newBufferPosition
        handlePromise(debouncedUpdate(bufferPt))
      }),
      rawView.onDidChangeScrollTop(() => {
        setImmediate(() => this.updateTooltipPosition(bufferPt))
      }),
      rawView.onDidChangeScrollLeft(() => {
        setImmediate(() => this.updateTooltipPosition(bufferPt))
      }),
    )
    handlePromise(this.updateTooltip(bufferPt))
  }

  public isDisposed() {
    return this.cancelled
  }

  public dispose() {
    if (this.cancelled) return
    this.cancelled = true
    this.disposables.dispose()
    handlePromise(this.view.destroy())
  }

  public async rotateSigHelp(shift: number) {
    const {visibleItem, sigHelp} = this.view.props
    const curVisItem =
      visibleItem !== undefined
        ? visibleItem
        : sigHelp?.selectedItemIndex !== undefined
        ? sigHelp?.selectedItemIndex
        : 0
    await this.view.update({visibleItem: curVisItem + shift})
  }

  private async updateTooltip(bufferPt: Atom.Point) {
    if (this.cancelled) return
    let tooltipRect
    try {
      tooltipRect = this.computeTooltipPosition(bufferPt)
    } catch (e) {
      console.warn(e)
      return
    }

    const msg = await this.getMessage(bufferPt)
    if (this.cancelled) return
    if (!msg) {
      this.dispose()
      return
    }
    await this.view.update({...tooltipRect, sigHelp: msg})
  }

  private updateTooltipPosition(bufferPt: Atom.Point) {
    if (this.cancelled) return
    const tooltipRect = this.computeTooltipPosition(bufferPt)
    handlePromise(this.view.update({...tooltipRect}))
  }

  private computeTooltipPosition(bufferPt: Atom.Point) {
    const rawView = atom.views.getView(this.editor)
    const pixelPos = rawView.pixelPositionForBufferPosition(bufferPt)
    const lines = rawView.querySelector(".lines")!
    const linesRect = lines.getBoundingClientRect()
    const lineH = this.editor.getLineHeightInPixels()
    const parentRect = rawView.getBoundingClientRect()
    const Y = pixelPos.top + linesRect.top - parentRect.top + lineH / 2
    const X = pixelPos.left + linesRect.left - parentRect.left
    const offset = lineH * 0.7
    return {
      left: X,
      right: X,
      top: Y - offset,
      bottom: Y + offset,
    }
  }

  private async getMessage(bufferPt: Atom.Point) {
    if (!isTypescriptEditorWithPath(this.editor)) return
    const filePath = this.editor.getPath()
    if (filePath === undefined) return
    const client = await this.deps.getClient(filePath)
    try {
      const result = await client.execute("signatureHelp", {
        file: filePath,
        line: bufferPt.row + 1,
        offset: bufferPt.column + 1,
      })
      return result.body
    } catch (e) {
      return
    }
  }
}

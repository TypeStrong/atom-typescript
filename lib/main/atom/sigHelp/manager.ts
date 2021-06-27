// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow

import * as Atom from "atom"
import {GetClientFunction} from "../../../client"
import {handlePromise} from "../../../utils"
import {TooltipController} from "./controller"

export class SigHelpManager {
  private subscriptions = new Atom.CompositeDisposable()
  private editorMap = new WeakMap<Atom.TextEditor, TooltipController>()

  constructor(
    private deps: {
      getClient: GetClientFunction
    },
  ) {
    this.subscriptions.add(
      atom.workspace.observeTextEditors((editor) => {
        const disp = new Atom.CompositeDisposable()
        disp.add(
          editor.onDidDestroy(() => {
            disp.dispose()
            this.subscriptions.remove(disp)
            const controller = this.editorMap.get(editor)
            if (controller) controller.dispose()
          }),
          editor.onDidStopChanging(this.stoppedChanging(editor)),
        )
        this.subscriptions.add(disp)
      }),
    )
  }

  public dispose() {
    this.subscriptions.dispose()
    for (const editor of atom.workspace.getTextEditors()) {
      const controller = this.editorMap.get(editor)
      if (controller) controller.dispose()
    }
  }

  public async showTooltipAt(editor: Atom.TextEditor) {
    const pt = editor.getLastCursor().getBufferPosition()
    return this.showTooltip(editor, pt)
  }

  public rotateSigHelp(editor: Atom.TextEditor, shift: number) {
    const controller = this.editorMap.get(editor)
    if (controller && !controller.isDisposed()) {
      handlePromise(controller.rotateSigHelp(shift))
      return true
    } else {
      return false
    }
  }

  public hideTooltipAt(editor: Atom.TextEditor): boolean {
    const controller = this.editorMap.get(editor)
    if (controller && !controller.isDisposed()) {
      controller.dispose()
      return true
    } else {
      return false
    }
  }

  private async showTooltip(editor: Atom.TextEditor, pos: Atom.Point) {
    const controller = this.editorMap.get(editor)
    if (!controller || controller.isDisposed()) {
      this.editorMap.set(editor, new TooltipController(this.deps, editor, pos))
    }
  }

  private stoppedChanging =
    (editor: Atom.TextEditor) => (event: Atom.BufferStoppedChangingEvent) => {
      if (!atom.config.get("atom-typescript.sigHelpDisplayOnChange")) return
      const filePath = editor.getPath()
      if (filePath === undefined) return
      const pos = editor.getLastCursor().getBufferPosition()
      const [ch] = event.changes.filter((x) => x.newRange.containsPoint(pos)) as Array<
        Atom.TextChange | undefined
      >
      if (ch && ch.newText.match(/[<(,]/) !== null) {
        handlePromise(this.showTooltip(editor, pos))
      }
    }
}

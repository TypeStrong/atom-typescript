import {CompositeDisposable} from "atom"
import {SemanticView, SEMANTIC_VIEW_URI} from "./semanticView"
import {Disposable} from "atom"
import {WithTypescriptBuffer} from "../../../pluginManager"

export class SemanticViewController {
  private view?: SemanticView
  private subscriptions: CompositeDisposable

  constructor(private withTypescriptBuffer: WithTypescriptBuffer) {
    this.subscriptions = new CompositeDisposable()

    const pane = atom.workspace.paneForURI(SEMANTIC_VIEW_URI)
    if (pane) this.view = pane.itemForURI(SEMANTIC_VIEW_URI) as SemanticView | undefined
    if (this.view) this.view.setWithTypescriptBuffer(this.withTypescriptBuffer)

    this.subscriptions.add(
      new Disposable(() => {
        if (this.view) {
          atom.workspace.hide(this.view)
          this.view.destroy()
        }
      }),
      atom.config.observe("atom-typescript.showSemanticView", val => {
        if (val) this.show()
        else this.hide()
      }),
    )
  }

  public dispose() {
    this.subscriptions.dispose()
  }

  public async toggle(): Promise<void> {
    if (!this.view) await this.show()
    else await atom.workspace.toggle(this.view)
  }

  private async show(): Promise<void> {
    if (!this.view) {
      this.view = SemanticView.create({navTree: null})
      this.view.setWithTypescriptBuffer(this.withTypescriptBuffer)
    }

    await atom.workspace.open(this.view, {searchAllPanes: true})
  }

  private hide(): boolean {
    if (!this.view) return false
    else return atom.workspace.hide(this.view)
  }
}

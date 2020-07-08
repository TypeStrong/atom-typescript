import {CompositeDisposable} from "atom"
import {Disposable} from "atom"
import {GetClientFunction} from "../../../../client"
import {handlePromise} from "../../../../utils"
import {SemanticView, SEMANTIC_VIEW_URI} from "./semanticView"

export class SemanticViewController {
  private view?: SemanticView
  private subscriptions: CompositeDisposable

  constructor(private getClient: GetClientFunction) {
    this.subscriptions = new CompositeDisposable()

    const pane = atom.workspace.paneForURI(SEMANTIC_VIEW_URI)
    if (pane) this.view = pane.itemForURI(SEMANTIC_VIEW_URI) as SemanticView | undefined
    if (this.view) handlePromise(this.view.setGetClient(this.getClient))

    this.subscriptions.add(
      new Disposable(() => {
        if (this.view) {
          atom.workspace.hide(this.view)
          handlePromise(this.view.destroy())
        }
      }),
      atom.config.observe("atom-typescript.showSemanticView", (val) => {
        if (val) handlePromise(this.show())
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
      await this.view.setGetClient(this.getClient)
    }

    await atom.workspace.open(this.view, {searchAllPanes: true})
  }

  private hide(): boolean {
    if (!this.view) return false
    else return atom.workspace.hide(this.view)
  }
}

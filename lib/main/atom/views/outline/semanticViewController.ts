import {CompositeDisposable} from "atom"
import {SemanticView} from "./semanticView"
import {Disposable} from "atom"

class SemanticViewController {
  subscriptions: CompositeDisposable

  constructor(public view?: SemanticView) {
    this.subscriptions = new CompositeDisposable()

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

  destroy() {
    this.subscriptions.dispose()
  }

  async toggle(): Promise<void> {
    if (!this.view) await this.show()
    else await atom.workspace.toggle(this.view)
  }

  async show(): Promise<void> {
    if (!this.view) {
      // make sure, SemanticView is singleton: check if there is a SemanticView in any Pane
      const pane = atom.workspace.paneForURI(SemanticView.URI)
      if (pane) {
        this.view = pane.itemForURI(SemanticView.URI) as SemanticView
      }

      // create new, if none-exists
      if (!this.view) {
        this.view = new SemanticView({navTree: null})
      }
    }

    await atom.workspace.open(this.view, {searchAllPanes: true})
  }

  hide(): boolean {
    if (!this.view) return false
    else return atom.workspace.hide(this.view)
  }

  setView(view: SemanticView): void {
    if (this.view) {
      this.view.destroy()
    }
    this.view = view
  }
}

let mainPane: SemanticViewController | undefined
export function initialize(view?: SemanticView): Disposable {
  if (!mainPane) {
    mainPane = new SemanticViewController(view)
  } else if (view) {
    mainPane.setView(view)
  }

  const pane = mainPane
  return new Disposable(() => {
    pane.destroy()
  })
}

export function toggle() {
  if (mainPane) {
    mainPane.toggle()
  } else {
    throw new Error("cannot toggle: SemanticViewController not initialized")
  }
}

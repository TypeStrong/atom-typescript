import {CompositeDisposable} from "atom"
import {SemanticView} from "./semanticView"
import {Disposable} from "atom"

class SemanticViewPane {
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
    if (!this.view) this.view = new SemanticView({})
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

let mainPane: SemanticViewPane | undefined
export function initialize(view?: SemanticView): Disposable {
  // console.log('initializeSemanticViewPane -> ', view)// DEBUG

  if (!mainPane) {
    mainPane = new SemanticViewPane(view)
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
    throw new Error("cannot toggle: SemanticViewPane not initialized")
  }
}

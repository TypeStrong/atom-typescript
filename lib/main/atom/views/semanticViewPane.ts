import {CompositeDisposable, PaneItemObservedEvent} from "atom"
import {SemanticView} from "./semanticView"
import {Disposable} from "atom"

class SemanticViewPane {
  subscriptions: CompositeDisposable
  view?: SemanticView

  constructor() {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      new Disposable(() => {
        if (this.view) {
          atom.workspace.hide(this.view)
          this.view.destroy()
        }
      }),
      atom.workspace.onDidAddPaneItem((event: PaneItemObservedEvent) => {
        if (event.item instanceof SemanticView) {
          atom.config.set("atom-typescript.showSemanticView", true)
        }
      }),
      atom.workspace.onDidDestroyPaneItem((event: PaneItemObservedEvent) => {
        if (event.item instanceof SemanticView) {
          atom.config.set("atom-typescript.showSemanticView", false)
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
}

let mainPane: SemanticViewPane | undefined
export function initialize(): Disposable {
  // Only attach once
  if (!mainPane) {
    mainPane = new SemanticViewPane()
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

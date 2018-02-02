import {CompositeDisposable, PaneItemObservedEvent} from "atom"
import {SemanticView, SEMANTIC_VIEW_URI} from "./semanticView"

export class SemanticViewPane {
  isOpen: boolean = false
  subscriptions: CompositeDisposable | null = null

  public activate(state: any) {
    if (!SEMANTIC_VIEW_URI && state) {
      // NOTE is is just a dummy to avoid warning of unused variable state
      console.log(state)
    }
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(
      atom.workspace.addOpener((uri: string) => {
        if (uri === "atom://" + SEMANTIC_VIEW_URI) {
          this.isOpen = true
          const view = new SemanticView({})
          view.start()
          return view
        }
      }),
    )

    this.subscriptions.add({
      dispose() {
        atom.workspace.getPaneItems().forEach(paneItem => {
          if (paneItem instanceof SemanticView) {
            paneItem.destroy()
          }
        })
      },
    })

    this.subscriptions.add(
      atom.workspace.onDidAddPaneItem((event: PaneItemObservedEvent) => {
        if (event.item instanceof SemanticView) {
          this.isOpen = true
          atom.config.set<string>("atom-typescript.showSemanticView", true)
          // console.log("TypeScript Semantic View was opened")
        }
      }),
    )

    this.subscriptions.add(
      atom.workspace.onDidDestroyPaneItem((event: PaneItemObservedEvent) => {
        if (event.item instanceof SemanticView) {
          this.isOpen = false
          atom.config.set<string>("atom-typescript.showSemanticView", false)
          // console.log("TypeScript Semantic View was closed")
        }
      }),
    )

    this.subscriptions.add(
      atom.config.onDidChange(
        "atom-typescript.showSemanticView",
        (val: {newValue: any; oldValue?: any}) => {
          this.show(val.newValue as boolean)
        },
      ),
    )

    this.show(atom.config.get("atom-typescript.showSemanticView"))
  }

  deactivate() {
    if (this.subscriptions !== null) {
      this.subscriptions.dispose()
    }
  }

  toggle(): void {
    // console.log("TypeScript Semantic View was toggled")
    atom.workspace.toggle("atom://" + SEMANTIC_VIEW_URI)
  }

  show(isShow?: boolean): void {
    if (isShow === false) {
      this.hide()
      return
    }
    // console.log("TypeScript Semantic View was opened")
    atom.workspace.open("atom://" + SEMANTIC_VIEW_URI, {})
  }

  hide(isHide?: boolean): void {
    if (isHide === false) {
      this.show()
      return
    }
    // console.log("TypeScript Semantic View was hidden")
    atom.workspace.hide("atom://" + SEMANTIC_VIEW_URI)
  }
}

export let mainPane: SemanticViewPane
export function attach(): {dispose(): void; semanticView: SemanticViewPane} {
  // Only attach once
  if (!mainPane) {
    mainPane = new SemanticViewPane()
    mainPane.activate({})
  }

  return {
    dispose() {
      mainPane.deactivate()
    },
    semanticView: mainPane,
  }
}

export function toggle() {
  if (mainPane) {
    mainPane.toggle()
  } else {
    console.log(`cannot toggle: ${SEMANTIC_VIEW_URI} not initialized`)
  }
}

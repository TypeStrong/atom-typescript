import {CompositeDisposable} from "atom"
import {SemanticView} from "./semanticView"
import {Disposable} from "atom"

export class SemanticViewController {
  private static instance: SemanticViewController | null = null
  public static create() {
    if (!SemanticViewController.instance) {
      SemanticViewController.instance = new SemanticViewController()
    }
    return SemanticViewController.instance
  }
  private subscriptions: CompositeDisposable
  public view?: SemanticView

  private constructor() {
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

  dispose() {
    this.subscriptions.dispose()
  }

  static async toggle(): Promise<void> {
    if (SemanticViewController.instance) {
      return SemanticViewController.instance.toggleImpl()
    } else {
      throw new Error("cannot toggle: SemanticViewController not initialized")
    }
  }

  private async toggleImpl(): Promise<void> {
    if (!this.view) await this.show()
    else await atom.workspace.toggle(this.view)
  }

  async show(): Promise<void> {
    if (!this.view) this.view = SemanticView.create({navTree: null})

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

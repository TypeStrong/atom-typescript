import {CompositeDisposable} from "atom"
import {FileView} from "./fileSymbolsView"

export class FileSymbolsView {
  private stack: Array<Position>
  editorSubscription: CompositeDisposable | null = null
  workspaceSubscription: CompositeDisposable | null = null
  fileView: any

  activate() {
    this.stack = []

    //FIXME registry.ts does not work (yet?) -> when it does, this must be removed/disabled
    this.editorSubscription = atom.commands.add("atom-text-editor", {
      "typescript:toggle-file-symbols": () => {
        this.createFileView().toggle()
      },
    })
  }

  deactivate() {
    if (this.fileView != null) {
      this.fileView.destroy()
      this.fileView = null
    }

    if (this.workspaceSubscription != null) {
      this.workspaceSubscription.dispose()
      this.workspaceSubscription = null
    }

    if (this.editorSubscription != null) {
      this.editorSubscription.dispose()
      this.editorSubscription = null
    }
  }

  createFileView() {
    if (this.fileView) {
      return this.fileView
    }
    // const FileView  = require('./fileSymbolsView');
    this.fileView = new FileView(this.stack)
    return this.fileView
  }
}

export var mainPane: FileSymbolsView
export function attach(): {dispose(): void; fileSymbolsView: FileSymbolsView} {
  // Only attach once
  if (!mainPane) {
    mainPane = new FileSymbolsView()
    mainPane.activate()
  }

  return {
    dispose() {
      mainPane.deactivate()
    },
    fileSymbolsView: mainPane,
  }
}

export function toggle() {
  if (mainPane) {
    mainPane.createFileView().toggle()
  } else {
    console.log(`cannot toggle: typescript:toggle-file-symbols not initialized`)
  }
}

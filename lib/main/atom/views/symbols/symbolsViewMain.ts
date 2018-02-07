import {FileView} from "./fileSymbolsView"
import ProjectView from "./projectSymbolsView"

/**
 * this is a slightly modified copy of symbols-view/lib/main.js
 * for support of searching file-symbols in typescript files.
 */

export class FileSymbolsView {
  private stack: Position[]
  fileView: FileView | null
  projectView: ProjectView | null

  activate() {
    this.stack = []

    // NOTE commands are registered via
    //        commands/**SybmolsView.ts
    //      and commands/index.ts
  }

  deactivate() {
    if (this.fileView != null) {
      this.fileView.destroy()
      this.fileView = null
    }

    if (this.projectView != null) {
      this.projectView.destroy()
      this.projectView = null
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

  createProjectView() {
    if (this.projectView) {
      return this.projectView
    }
    // const ProjectView  = require('./project-view');
    this.projectView = new ProjectView(this.stack)
    return this.projectView
  }
}

export let mainPane: FileSymbolsView
export function initialize(): {dispose(): void; fileSymbolsView: FileSymbolsView} {
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

export function toggleFileSymbols() {
  if (mainPane) {
    mainPane.createFileView().toggle()
  } else {
    console.log(`cannot toggle: typescript:toggle-file-symbols not initialized`)
  }
}

export function toggleProjectSymbols() {
  if (mainPane) {
    mainPane.createProjectView().toggle()
  } else {
    console.log(`cannot toggle: typescript:toggle-project-symbols not initialized`)
  }
}

import {FileView} from "./fileSymbolsView"
import ProjectView from "./projectSymbolsView"
import {ClientResolver} from "../../../../client/clientResolver"

/**
 * this is a slightly modified copy of symbols-view/lib/main.js
 * for support of searching file-symbols in typescript files.
 */

export class SymbolsViewController {
  private stack: Position[]
  private fileView: FileView | null
  private projectView: ProjectView | null

  constructor(private clientResolver: ClientResolver) {
    this.stack = []
  }

  public activate() {
    // NOTE commands are registered via
    //        commands/**SybmolsView.ts
    //      and commands/index.ts
  }

  public deactivate() {
    if (this.fileView != null) {
      this.fileView.destroy()
      this.fileView = null
    }

    if (this.projectView != null) {
      this.projectView.destroy()
      this.projectView = null
    }
  }

  public createFileView() {
    if (this.fileView) {
      return this.fileView
    }
    // const FileView  = require('./fileSymbolsView');
    this.fileView = new FileView(this.stack, this.clientResolver)
    return this.fileView
  }

  public createProjectView() {
    if (this.projectView) {
      return this.projectView
    }
    // const ProjectView  = require('./project-view');
    this.projectView = new ProjectView(this.stack, this.clientResolver)
    return this.projectView
  }

  public toggleFileView() {
    this.createFileView().toggle()
  }

  public toggleProjectView() {
    this.createProjectView().toggle()
  }

  public dispose() {
    this.deactivate()
  }
}

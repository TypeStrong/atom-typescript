import {toggle as toggleFileView} from "./fileSymbolsView"
import {toggle as toggleProjectView} from "./projectSymbolsView"
import {TextEditor} from "atom"
import {Deps} from "./deps"
import {handlePromise} from "../../../../utils"

export class SymbolsViewController {
  constructor(private deps: Deps) {}

  public toggleFileView(editor: TextEditor) {
    handlePromise(toggleFileView(editor, this.deps))
  }

  public toggleProjectView(editor: TextEditor) {
    handlePromise(toggleProjectView(editor, this.deps))
  }

  public dispose() {
    // TODO: proper disposal
  }
}

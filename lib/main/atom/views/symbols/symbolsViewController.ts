import {TextEditor} from "atom"
import {handlePromise} from "../../../../utils"
import {Deps} from "./deps"
import {toggle as toggleFileView} from "./fileSymbolsView"
import {toggle as toggleProjectView} from "./projectSymbolsView"

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

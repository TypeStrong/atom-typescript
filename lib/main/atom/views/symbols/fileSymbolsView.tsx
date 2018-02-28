import {TextEditor} from "atom"
import {selectListView} from "../simpleSelectionView"
import * as etch from "etch"
import {generate} from "./generator"
import * as utils from "./utils"
import {Tag} from "./fileSymbolsTag"
import {Deps} from "./deps"

export async function toggle(editor: TextEditor, deps: Deps) {
  const filePath = editor.getPath()
  if (filePath) {
    // NOTE uses the "parent" package's setting (i.e. from symbols-view):
    let initialState
    if (atom.config.get("symbols-view.quickJumpToFileSymbol")) {
      initialState = utils.serializeEditorState(editor)
    }
    const tag = await selectListView({
      items: generate(filePath, false, deps),
      itemTemplate: ({name, position}) => (
        <li class="two-lines">
          <div class="primary-line">{name}</div>
          <div class="secondary-line">{`Line ${position.row + 1}`}</div>
        </li>
      ),
      didChangeSelection(item: Tag) {
        // NOTE uses the "parent" package's setting (i.e. from symbols-view):
        if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
          editor.setCursorBufferPosition(item.position)
        }
      },
      itemFilterKey: "name",
    })
    if (tag) utils.openTag(tag)
    else if (initialState) utils.deserializeEditorState(editor, initialState)
  }
}

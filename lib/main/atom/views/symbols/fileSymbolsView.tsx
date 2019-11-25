import {TextEditor} from "atom"
import * as etch from "etch"
import {HighlightComponent} from "../highlightComponent"
import {selectListView} from "../simpleSelectionView"
import {Deps} from "./deps"
import {generateFile} from "./generator"
import {Tag} from "./symbolsTag"
import * as utils from "./utils"

export async function toggle(editor: TextEditor, deps: Deps) {
  const filePath = editor.getPath()
  if (filePath !== undefined) {
    // NOTE uses the "parent" package's setting (i.e. from symbols-view):
    let initialState
    if (atom.config.get("symbols-view.quickJumpToFileSymbol")) {
      initialState = utils.serializeEditorState(editor)
    }
    const tag = await selectListView({
      items: generateFile(filePath, deps),
      itemTemplate: ({name, position}, ctx) => (
        <li className="two-lines">
          <div className="primary-line">
            <HighlightComponent label={name} query={ctx.getFilterQuery()} />
          </div>
          <div className="secondary-line">{`Line ${position.row + 1}`}</div>
        </li>
      ),
      didChangeSelection(item?: Tag) {
        // NOTE uses the "parent" package's setting (i.e. from symbols-view):
        if (atom.config.get("symbols-view.quickJumpToFileSymbol") && item) {
          editor.setCursorBufferPosition(item.position)
        }
      },
      itemFilterKey: "name",
    })
    if (tag) await utils.openTag(tag, editor, deps.histGoForward)
    else if (initialState) utils.deserializeEditorState(editor, initialState)
  }
}

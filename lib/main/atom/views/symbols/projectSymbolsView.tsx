import {TextEditor} from "atom"
import {selectListView} from "../simpleSelectionView"
import * as etch from "etch"
import * as utils from "./utils"
import {generate} from "./generator"
import {Deps} from "./deps"

export async function toggle(editor: TextEditor, deps: Deps) {
  const filePath = editor.getPath()
  if (filePath) {
    // NOTE uses the "parent" package's setting (i.e. from symbols-view):
    const tag = await selectListView({
      items: generate(filePath, true, deps),
      itemTemplate({name, position, file}) {
        const relfile = atom.project.relativize(file)
        return (
          <li class="two-lines">
            <div class="primary-line">{name}</div>
            <div class="secondary-line">{`File ${relfile} line ${position.row + 1}`}</div>
          </li>
        )
      },
      itemFilterKey: "name",
    })
    if (tag) utils.openTag(tag)
  }
}

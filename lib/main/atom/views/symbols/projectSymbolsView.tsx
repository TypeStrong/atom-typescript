import {TextEditor} from "atom"
import {selectListView} from "../simpleSelectionView"
import * as etch from "etch"
import * as utils from "./utils"
import {generateProject} from "./generator"
import {Deps} from "./deps"

export async function toggle(editor: TextEditor, deps: Deps) {
  const filePath = editor.getPath()
  if (filePath) {
    const tag = await selectListView({
      items: (search: string) => generateProject(filePath, search, deps),
      itemTemplate({name, position, file}) {
        const relfile = atom.project.relativize(file!)
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

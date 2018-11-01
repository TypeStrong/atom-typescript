import {TextEditor} from "atom"
import * as etch from "etch"
import {HighlightComponent} from "../highlightComponent"
import {selectListView} from "../simpleSelectionView"
import {Deps} from "./deps"
import {generateProject} from "./generator"
import * as utils from "./utils"

export async function toggle(editor: TextEditor, deps: Deps) {
  const filePath = editor.getPath()
  if (filePath !== undefined) {
    const tag = await selectListView({
      items: (search: string) => generateProject(filePath, search, deps),
      itemTemplate({name, position, file}, ctx) {
        const relfile = atom.project.relativize(file!)
        return (
          <li class="two-lines">
            <div class="primary-line">
              <HighlightComponent label={name} query={ctx.getFilterQuery()} />
            </div>
            <div class="secondary-line">{`File ${relfile} line ${position.row + 1}`}</div>
          </li>
        )
      },
      itemFilterKey: "name",
    })
    if (tag) await utils.openTag(tag, editor, deps.histGoForward)
  }
}

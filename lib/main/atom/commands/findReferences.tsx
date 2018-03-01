import {addCommand} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {TsView} from "../components/tsView"
import {HighlightComponent} from "../views/highlightComponent"

addCommand("atom-text-editor", "typescript:find-references", deps => ({
  description: "Find where symbol under text cursor is referenced",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition(e.currentTarget.getModel())
    if (!location) {
      e.abortKeyBinding()
      return
    }
    const client = await deps.getClient(location.file)
    const result = await client.executeReferences(location)

    const res = await selectListView({
      items: result.body!.refs.map(r => ({...r, file: atom.project.relativize(r.file)})),
      itemTemplate: (item, ctx) => {
        return (
          <li>
            <HighlightComponent label={item.file} query={ctx.getFilterQuery()} />
            <div class="pull-right">line: ${item.start.line}</div>
            <TsView text={item.lineText.trim()} />
          </li>
        )
      },
      itemFilterKey: "file",
    })
    if (res) {
      atom.workspace.open(res.file, {
        initialLine: res.start.line - 1,
        initialColumn: res.start.offset - 1,
      })
    }
  },
}))

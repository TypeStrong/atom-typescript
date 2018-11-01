import * as etch from "etch"
import {TsView} from "../components/tsView"
import {getFilePathPosition} from "../utils"
import {HighlightComponent} from "../views/highlightComponent"
import {selectListView} from "../views/simpleSelectionView"
import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:find-references", deps => ({
  description: "Find where symbol under text cursor is referenced",
  async didDispatch(editor) {
    const location = getFilePathPosition(editor)
    if (!location) return

    const client = await deps.getClient(location.file)
    const result = await client.execute("references", location)

    const res = await selectListView({
      items: result.body!.refs,
      itemTemplate: (item, ctx) => {
        return (
          <li>
            <HighlightComponent
              label={atom.project.relativize(item.file)}
              query={ctx.getFilterQuery()}
            />
            <div class="pull-right">line: {item.start.line}</div>
            <TsView text={item.lineText.trim()} />
          </li>
        )
      },
      itemFilterKey: "file",
    })
    if (res) await deps.histGoForward(editor, res)
  },
}))

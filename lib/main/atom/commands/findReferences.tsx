import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {TsView} from "../components/tsView"

commands.set("typescript:find-references", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    if (!location) {
      e.abortKeyBinding()
      return
    }
    const client = await deps.getClient(location.file)
    const result = await client.executeReferences(location)

    const res = await selectListView({
      items: result.body!.refs,
      itemTemplate: item => {
        return (
          <div>
            <span>{atom.project.relativize(item.file)}</span>
            <div class="pull-right">line: ${item.start.line}</div>
            <TsView text={item.lineText.trim()} />
          </div>
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
  }
})

import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../atomUtils"
import {simpleSelectionView} from "../views/simpleSelectionView"
import escapeHtml = require('escape-html')

commands.set("typescript:find-references", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.getClient(location.file)
    const result = await client.executeReferences(location)

    simpleSelectionView({
      items: result.body.refs,
      viewForItem: item => {
        return `<div>
          <span>${atom.project.relativize(item.file)}</span>
          <div class="pull-right">line: ${item.start.line}</div>
          <ts-view>${escapeHtml(item.lineText.trim())}</ts-view>
        </div>`
      },
      filterKey: 'filePath',
      confirmed: open
    })

    function open(item: typeof result.body.refs[0]) {
      atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1
      })
    }
  }
})

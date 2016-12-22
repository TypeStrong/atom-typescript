import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../atomUtils"
import {simpleSelectionView} from "../views/simpleSelectionView"

commands.set("typescript:go-to-declaration", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.clientResolver.get(location.file)
    const result = await client.executeDefinition(location)

    if (result.body.length > 1) {
      simpleSelectionView({
        items: result.body,
        viewForItem: item => {
            return `
                <span>${item.file}</span>
                <div class="pull-right">line: ${item.start.line}</div>
            `
        },
        filterKey: 'filePath',
        confirmed: open
      })
    } else {
      open(result.body[0])
    }

    function open(item: typeof result.body[0]) {
      atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1
      })
    }
  }
})

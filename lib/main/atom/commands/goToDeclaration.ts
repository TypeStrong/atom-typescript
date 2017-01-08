import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {simpleSelectionView} from "../views/simpleSelectionView"

commands.set("typescript:go-to-declaration", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.getClient(location.file)
    const result = await client.executeDefinition(location)

    if (result.body!.length > 1) {
      simpleSelectionView({
        items: result.body!,
        viewForItem: item => {
            return `
                <span>${item.file}</span>
                <div class="pull-right">line: ${item.start.line}</div>
            `
        },
        filterKey: 'filePath',
        confirmed: item => open(item)
      })
    } else {
      open(result.body![0])
    }

    function open(item: {file: string, start: {line: number, offset: number}}) {
      atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1
      })
    }
  }
})

import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition, FileLocationQuery} from "../utils"
import {simpleSelectionView} from "../views/simpleSelectionView"

const prevCursorPositions:FileLocationQuery[] = [];

function open(item: {file: string, start: {line: number, offset: number}}) {
   atom.workspace.open(item.file, {
     initialLine: item.start.line - 1,
     initialColumn: item.start.offset - 1
   })
}

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
        confirmed: item => {
           prevCursorPositions.push(location);
           open(item)
        }
      })
    } else {
      prevCursorPositions.push(location);
      open(result.body![0])
    }
  }
});

commands.set("typescript:return-from-declaration", deps => {
   return async e => {
      const position = prevCursorPositions.pop();
      if (!position) {
         atom.notifications.addInfo('AtomTS: Previous position not found.');
         return;
      }
      open({
         file: position.file,
         start: { line: position.line, offset: position.offset }
      });
   }
});

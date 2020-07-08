import {TextEditor} from "atom"
import * as etch from "etch"
import {getFilePathPosition} from "../utils"
import {HighlightComponent} from "../views/highlightComponent"
import {selectListView} from "../views/simpleSelectionView"
import {addCommand, Dependencies} from "./registry"

addCommand("atom-text-editor", "typescript:go-to-declaration", (deps) => ({
  description: "Go to declaration of symbol under text cursor",
  async didDispatch(editor) {
    const location = getFilePathPosition(editor)
    if (!location) return

    const client = await deps.getClient(location.file)
    const result = await client.execute("definition", location)
    await handleDefinitionResult(result, editor, deps.histGoForward)
  },
}))

export async function handleDefinitionResult(
  result: protocol.DefinitionResponse,
  editor: TextEditor,
  histGoForward: Dependencies["histGoForward"],
): Promise<void> {
  if (!result.body) {
    return
  } else if (result.body.length > 1) {
    const res = await selectListView({
      items: result.body,
      itemTemplate: (item, ctx) => {
        return (
          <li>
            <HighlightComponent label={item.file} query={ctx.getFilterQuery()} />
            <div className="pull-right">line: {item.start.line}</div>
          </li>
        )
      },
      itemFilterKey: "file",
    })
    if (res) await histGoForward(editor, res)
  } else if (result.body.length > 0) {
    await histGoForward(editor, result.body[0])
  }
}

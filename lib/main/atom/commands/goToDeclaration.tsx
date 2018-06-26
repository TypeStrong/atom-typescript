import {addCommand} from "./registry"
import {getFilePathPosition} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"
import {TextEditor} from "atom"
import {EditorPositionHistoryManager} from "../editorPositionHistoryManager"

addCommand("atom-text-editor", "typescript:go-to-declaration", deps => ({
  description: "Go to declaration of symbol under text cursor",
  async didDispatch(editor) {
    const location = getFilePathPosition(editor)
    if (!location) return

    const client = await deps.getClient(location.file)
    const result = await client.execute("definition", location)
    handleDefinitionResult(result, editor, deps.getEditorPositionHistoryManager())
  },
}))

export async function handleDefinitionResult(
  result: protocol.DefinitionResponse,
  editor: TextEditor,
  hist: EditorPositionHistoryManager,
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
            <div class="pull-right">line: {item.start.line}</div>
          </li>
        )
      },
      itemFilterKey: "file",
    })
    if (res) hist.goForward(editor, res)
  } else if (result.body.length > 0) {
    hist.goForward(editor, result.body[0])
  }
}

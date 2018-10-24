import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"
import {selectListView} from "../views/simpleSelectionView"
import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:return-from-declaration", deps => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    await deps.getEditorPositionHistoryManager().goBack()
  },
}))

addCommand("atom-workspace", "typescript:show-editor-position-history", deps => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    const ehm = deps.getEditorPositionHistoryManager()
    const res = await selectListView({
      items: ehm
        .getHistory()
        .slice()
        .reverse()
        .map((item, idx) => ({...item, idx})),
      itemTemplate: (item, ctx) => (
        <li class="two-lines">
          <div class="primary-line">
            <HighlightComponent label={item.file} query={ctx.getFilterQuery()} />
          </div>
          <div class="secondary-line">
            Line: {item.line}, column: {item.offset}
          </div>
        </li>
      ),
      itemFilterKey: "file",
    })
    if (res) await ehm.goHistory(res.idx + 1)
  },
}))

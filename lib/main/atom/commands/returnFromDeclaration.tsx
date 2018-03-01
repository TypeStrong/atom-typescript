import {addCommand} from "./registry"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"

addCommand("atom-workspace", "typescript:return-from-declaration", deps => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    deps.getEditorPositionHistoryManager().goBack()
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
    if (res) ehm.goHistory(res.idx + 1)
  },
}))

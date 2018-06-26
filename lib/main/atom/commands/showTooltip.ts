import {addCommand} from "./registry"
import {showExpressionAt} from "../tooltipManager"

addCommand("atom-text-editor", "typescript:show-tooltip", () => ({
  description: "Show type tooltip at current text cursor position",
  async didDispatch(ed) {
    return showExpressionAt(ed, ed.getLastCursor().getBufferPosition())
  },
}))

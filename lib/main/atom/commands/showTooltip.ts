import {commands} from "./registry"
import {showExpressionAt} from "../tooltipManager"

commands.set("typescript:show-tooltip", _deps => {
  return async () => {
    const ed = atom.workspace.getActiveTextEditor()
    if (!ed) return
    return showExpressionAt(ed, ed.getLastCursor().getBufferPosition())
  }
})

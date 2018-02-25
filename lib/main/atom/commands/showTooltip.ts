import {addCommand} from "./registry"
import {showExpressionAt} from "../tooltipManager"
import {CommandEvent, TextEditorElement} from "atom"

addCommand("atom-text-editor", "typescript:show-tooltip", () => ({
  description: "Show type tooltip at current text cursor position",
  async didDispatch(e: CommandEvent<TextEditorElement>) {
    const ed = e.currentTarget.getModel()
    return showExpressionAt(ed, ed.getLastCursor().getBufferPosition())
  },
}))

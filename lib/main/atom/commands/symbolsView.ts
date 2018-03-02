import {addCommand} from "./registry"
import {commandForTypeScript} from "../utils"

addCommand("atom-text-editor", "typescript:toggle-file-symbols", deps => ({
  description: "Toggle view for finding file symbols",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }
    deps.getSymbolsViewController().toggleFileView(e.currentTarget.getModel())
  },
}))

addCommand("atom-text-editor", "typescript:toggle-project-symbols", deps => ({
  description: "Toggle view for finding file symbols",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }
    deps.getSymbolsViewController().toggleProjectView(e.currentTarget.getModel())
  },
}))

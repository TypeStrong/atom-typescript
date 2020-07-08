import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:show-tooltip", (deps) => ({
  description: "Show type tooltip at current text cursor position",
  async didDispatch(ed) {
    return deps.showTooltipAt(ed)
  },
}))

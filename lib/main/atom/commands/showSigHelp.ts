import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:show-signature-help", deps => ({
  description: "Show signature help tooltip at current text cursor position",
  async didDispatch(ed) {
    return deps.showSigHelpAt(ed)
  },
}))

import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:hide-signature-help", deps => ({
  description: "Hide the currently visible signature help",
  async didDispatch(ed, ignore) {
    if (!deps.hideSigHelpAt(ed)) ignore()
  },
}))

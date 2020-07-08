import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:show-signature-help", (deps) => ({
  description: "Show signature help tooltip at current text cursor position",
  async didDispatch(ed) {
    return deps.showSigHelpAt(ed)
  },
}))

addCommand("atom-text-editor", "typescript:hide-signature-help", (deps) => ({
  description: "Hide the currently visible signature help",
  async didDispatch(ed, ignore) {
    if (!deps.hideSigHelpAt(ed)) ignore()
  },
}))

addCommand("atom-text-editor", "typescript:signature-help-next", (deps) => ({
  description: "Show next signature help if available",
  async didDispatch(ed, ignore) {
    if (!deps.rotateSigHelp(ed, +1)) ignore()
  },
}))

addCommand("atom-text-editor", "typescript:signature-help-prev", (deps) => ({
  description: "Show previous signature help if available",
  async didDispatch(ed, ignore) {
    if (!deps.rotateSigHelp(ed, -1)) ignore()
  },
}))

import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:toggle-file-symbols", deps => ({
  description: "Toggle view for finding file symbols",
  async didDispatch(editor) {
    deps.getSymbolsViewController().toggleFileView(editor)
  },
}))

addCommand("atom-text-editor", "typescript:toggle-project-symbols", deps => ({
  description: "Toggle view for finding file symbols",
  async didDispatch(editor) {
    deps.getSymbolsViewController().toggleProjectView(editor)
  },
}))

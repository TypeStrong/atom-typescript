import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:return-from-declaration", (deps) => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    await deps.histGoBack()
  },
}))

addCommand("atom-workspace", "typescript:show-editor-position-history", (deps) => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    await deps.histShowHistory()
  },
}))

import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:return-from-declaration", deps => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    deps.getEditorPositionHistoryManager().goBack()
  },
}))

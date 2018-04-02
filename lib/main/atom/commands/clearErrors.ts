import {addCommand} from "./registry"

addCommand("atom-workspace", "typescript:clear-errors", deps => ({
  description: "Clear error messages",
  didDispatch() {
    deps.clearErrors()
  },
}))

addCommand("atom-text-editor", "typescript:reload-projects", deps => ({
  description: "Reload projects",
  async didDispatch(e) {
    const editor = e.currentTarget.getModel()
    const path = editor.getPath()
    if (path === undefined) return
    const client = await deps.getClient(path)
    client.execute("reloadProjects", undefined)
  },
}))

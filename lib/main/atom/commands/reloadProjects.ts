import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:reload-projects", (deps) => ({
  description: "Reload projects",
  async didDispatch(editor) {
    const path = editor.getPath()
    if (path === undefined) return
    const client = await deps.getClient(path)
    await client.execute("reloadProjects")
  },
}))

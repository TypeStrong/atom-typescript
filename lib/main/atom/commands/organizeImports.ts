import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:organize-imports", deps => ({
  description: "Organize module imports",
  async didDispatch(editor) {
    const filePath = editor.getPath()
    if (filePath === undefined) return

    const client = await deps.getClient(filePath)
    const result = await client.execute("organizeImports", {
      scope: {type: "file", args: {file: filePath}},
    })
    if (result.body.length > 0) await deps.applyEdits(result.body)
  },
}))

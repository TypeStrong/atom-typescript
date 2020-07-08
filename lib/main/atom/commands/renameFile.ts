import * as fs from "fs-plus"
import {showRenameDialog} from "../views/renameView"
import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:rename-file", (deps) => ({
  description: "Rename current file",
  async didDispatch(editor) {
    const location = editor.getPath()
    // tslint:disable-next-line: strict-boolean-expressions
    if (!location) return

    const newLocation = await showRenameDialog({
      autoSelect: true,
      title: "Rename File",
      text: location,
      onValidate: (newText): string => {
        if (!newText.trim()) {
          return "If you want to abort : Press esc to exit"
        }
        return ""
      },
    })

    // tslint:disable-next-line: strict-boolean-expressions
    if (!newLocation) return

    const client = await deps.getClient(location)
    const response = await client.execute("getEditsForFileRename", {
      oldFilePath: location,
      newFilePath: newLocation,
    })

    await deps.applyEdits(response.body)

    await new Promise<void>((resolve, reject) => {
      fs.move(location, newLocation, (err?: Error) => {
        if (err) reject(err)
        else {
          editor.getBuffer().setPath(newLocation)
          resolve()
        }
      })
    })
  },
}))

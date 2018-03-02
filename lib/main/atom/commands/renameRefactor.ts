import {addCommand} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {spanToRange} from "../utils"
import {showRenameDialog} from "../views/renameView"

addCommand("atom-text-editor", "typescript:rename-refactor", deps => ({
  description: "Rename symbol under text cursor everywhere it is used",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition(e.currentTarget.getModel())
    if (!location) {
      e.abortKeyBinding()
      return
    }
    const client = await deps.getClient(location.file)
    const response = await client.execute("rename", location)
    const {info, locs} = response.body!

    if (!info.canRename) {
      return atom.notifications.addInfo("AtomTS: Rename not available at cursor location")
    }

    const newName = await showRenameDialog({
      autoSelect: true,
      title: "Rename Variable",
      text: info.displayName,
      onValidate: (newText): string => {
        if (newText.replace(/\s/g, "") !== newText.trim()) {
          return "The new variable must not contain a space"
        }
        if (!newText.trim()) {
          return "If you want to abort : Press esc to exit"
        }
        return ""
      },
    })

    if (newName !== undefined) {
      locs.map(async loc => {
        await deps.withTypescriptBuffer(loc.file, async buffer => {
          buffer.buffer.transact(() => {
            for (const span of loc.locs) {
              buffer.buffer.setTextInRange(spanToRange(span), newName)
            }
          })
        })
      })
    }
  },
}))

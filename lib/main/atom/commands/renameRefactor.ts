import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {spanToRange} from "../utils"

commands.set("typescript:rename-refactor", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const location = getFilePathPosition()
    const client = await deps.getClient(location.file)
    const response = await client.executeRename(location)
    const {info, locs} = response.body!

    if (!info.canRename) {
      return atom.notifications.addInfo("AtomTS: Rename not available at cursor location")
    }

    const newName = await deps.renameView.showRenameDialog({
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
      }
    })

    locs.map(async loc => {
      const {buffer, isOpen} = await deps.getTypescriptBuffer(loc.file)

      buffer.buffer.transact(() => {
        for (const span of loc.locs) {
          buffer.buffer.setTextInRange(spanToRange(span), newName)
        }
      })

      if (!isOpen) {
        buffer.buffer.save()
        buffer.on("saved", () => {
          buffer.buffer.destroy()
        })
      }
    })
  }
})

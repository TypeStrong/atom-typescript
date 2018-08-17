import {addCommand} from "./registry"
import {getFilePathPosition, TextSpan} from "../utils"
import {showRenameDialog} from "../views/renameView"

addCommand("atom-text-editor", "typescript:rename-refactor", deps => ({
  description: "Rename symbol under text cursor everywhere it is used",
  async didDispatch(editor) {
    const location = getFilePathPosition(editor)
    if (!location) return

    const client = await deps.getClient(location.file)
    const response = await client.execute("rename", location)
    const {info, locs} = response.body!

    if (!info.canRename) {
      atom.notifications.addInfo("AtomTS: Rename not available at cursor location")
      return
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
      await deps.applyEdits(
        locs.map(span => ({
          fileName: span.file,
          textChanges: span.locs
            .map(loc => ({...loc, newText: newName}))
            .sort(spanComparer),
        })),
      )
    }
  },
}))

const spanComparer = (a: TextSpan, b: TextSpan) => {
  if (a.start.line !== b.start.line) return a.start.line - b.start.line
  if (a.start.offset !== b.start.offset) return a.start.offset - b.start.offset
  if (a.end.line !== b.end.line) return a.end.line - b.end.line
  if (a.end.offset !== b.end.offset) return a.end.offset - b.end.offset
  return 0
}

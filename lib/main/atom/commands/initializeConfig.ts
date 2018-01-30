import {commands} from "./registry"
import {resolveBinary} from "../../../client/clientResolver"
import {execFile} from "child_process"
import {CommandEvent, TextEditorElement} from "atom"

commands["atom-text-editor"]["typescript:initialize-config"] = () => ({
  description: "Create tsconfig.json in the project related to currently-active text edtior",
  async didDispatch(e: CommandEvent<TextEditorElement>) {
    try {
      const editor = e.currentTarget.getModel()

      const projectDirs = atom.project.getDirectories()
      if (projectDirs.length === 0) throw new Error("ENOPROJECT")

      const currentPath = editor.getPath()
      if (!currentPath) throw new Error("ENOPATH")

      const pathToTsc = (await resolveBinary(currentPath, "tsc")).pathToBin

      for (const projectDir of projectDirs) {
        if (projectDir.contains(currentPath)) {
          await initConfig(pathToTsc, projectDir.getPath())
          atom.notifications.addSuccess(
            `Successfully created tsconfig.json in ${projectDir.getPath()}`,
          )
        }
      }
    } catch (e) {
      switch (e.message) {
        case "ENOPROJECT":
          e.abortKeyBinding()
          return
        case "ENOPATH":
          atom.notifications.addWarning(
            "Current editor has no file path. Can not determine which project to initialize",
            {
              dismissable: true,
            },
          )
          return
        default:
          atom.notifications.addFatalError("Something went wrong, see details below.", {
            detail: e.message,
            dismissable: true,
            stack: e.stack,
          })
      }
    }
  },
})

function initConfig(tsc: string, projectRoot: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      execFile(tsc, ["--init"], {cwd: projectRoot}, err => {
        if (err) reject(err)
        else resolve()
      })
    } catch (e) {
      reject(e)
    }
  })
}

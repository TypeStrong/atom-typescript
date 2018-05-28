import {addCommand} from "./registry"
import {resolveBinary} from "../../../client/clientResolver"
import {BufferedNodeProcess} from "atom"
import {CommandEvent, TextEditorElement} from "atom"

addCommand("atom-text-editor", "typescript:initialize-config", () => ({
  description: "Create tsconfig.json in the project related to currently-active text edtior",
  async didDispatch(e: CommandEvent<TextEditorElement>) {
    try {
      const editor = e.currentTarget.getModel()

      const projectDirs = atom.project.getDirectories()
      if (projectDirs.length === 0) throw new Error("ENOPROJECT")

      const currentPath = editor.getPath()
      if (currentPath === undefined) throw new Error("ENOPATH")

      const pathToTsc = (await resolveBinary(currentPath, "tsc")).pathToBin

      for (const projectDir of projectDirs) {
        if (projectDir.contains(currentPath)) {
          await initConfig(pathToTsc, projectDir.getPath())
          atom.notifications.addSuccess(
            `Successfully created tsconfig.json in ${projectDir.getPath()}`,
          )
        }
      }
    } catch (error) {
      const err = error as Error
      switch (err.message) {
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
            detail: err.message,
            dismissable: true,
            stack: err.stack,
          })
      }
    }
  },
}))

function initConfig(tsc: string, projectRoot: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const bnp = new BufferedNodeProcess({
        command: tsc,
        args: ["--init"],
        options: {cwd: projectRoot},
        exit: code => {
          if (code === 0) resolve()
          else reject(new Error(`Tsc ended with nonzero exit code ${code}`))
        },
      })
      bnp.onWillThrowError(reject)
    } catch (e) {
      reject(e)
    }
  })
}

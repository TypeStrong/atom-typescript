import {commands} from "./registry"
import {resolveBinary} from "../../../client/clientResolver"
import {execFile} from "child_process"

commands.set("typescript:initialize-config", () => {
  return async ev => {
    try {
      const projectDirs = atom.project.getDirectories()

      if (projectDirs.length === 0) {
        throw new Error("ENOPROJECT")
      }

      const editor = atom.workspace.getActiveTextEditor()

      if (!editor) {
        throw new Error("ENOEDITOR")
      }

      const currentPath = editor.getPath()

      if (!currentPath) {
        throw new Error("ENOPATH")
      }

      const pathToTsc = (await resolveBinary(currentPath, "tsc")).pathToBin

      for (const projectDir of projectDirs) {
        if (projectDir.contains(currentPath)) {
          await initConfig(pathToTsc, projectDir.getPath())
        }
      }
    } catch (e) {
      switch (e.message) {
        case "ENOPROJECT":
        case "ENOEDITOR":
          ev.abortKeyBinding()
          return
        default:
          atom.notifications.addFatalError("Something went wrong, see details below.", {
            detail: e.message,
            dismissable: true,
            stack: e.stack,
          })
      }
    }
  }
})

const initConfig = (tsc: string, projectRoot: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      execFile(
        tsc,
        ["--init"],
        {
          cwd: projectRoot,
        },
        err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        },
      )
    } catch (e) {
      reject(e)
    }
  })
}

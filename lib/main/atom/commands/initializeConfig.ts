import {commands} from "./registry"
import {resolveBinary} from "../../../client/clientResolver"
import {execFile} from "child_process"

commands.set("typescript:initialize-config", () => {
  return async ev => {
    let projectDirs
    let editor
    let currentPath
    let pathToTsc

    try {
      projectDirs = atom.project.getDirectories()

      if (projectDirs.length === 0) {
        throw new Error("ENOPROJECT")
      }

      editor = atom.workspace.getActiveTextEditor()

      if (!editor) {
        throw new Error("ENOEDITOR")
      }

      currentPath = editor.getPath()

      if (!currentPath) {
        throw new Error("ENOPATH")
      }
    } catch (e) {
      switch (e.message) {
        case "ENOPROJECT":
        case "ENOEDITOR":
          ev.abortKeyBinding()
          return
        default:
          if (e.stack) {
            atom.notifications.addFatalError("Something went wrong, see details below.", {
              detail: e.message,
              dismissable: true,
              stack: e.stack,
            })
          } else {
            atom.notifications.addError("Unknown error has occured.", {
              detail: e.message,
              dismissable: true,
            })
          }
      }
    }

    if (currentPath) {
      pathToTsc = (await resolveBinary(currentPath, "tsc")).pathToBin
    }

    if (projectDirs) {
      for (const projectDir of projectDirs) {
        if (currentPath && projectDir.contains(currentPath) && pathToTsc) {
          await initConfig(pathToTsc, projectDir.getPath()).catch(e => {
            atom.notifications.addFatalError("Something went wrong, see details below.", {
              detail: e.message,
              dismissable: true,
              stack: e.stack,
            })
          })
        }
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

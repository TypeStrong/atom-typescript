import {commands} from "./registry"
import {resolveModule} from "../../../client/clientResolver"
import {execFile} from "child_process"

commands.set("typescript:initialize-config", () => {
  return async e => {
    const projectDirs = atom.project.getDirectories()

    if (projectDirs.length === 0) {
      e.abortKeyBinding()
      return
    }

    let editor
    let currentPath

    try {
      editor = atom.workspace.getActiveTextEditor()

      if (!editor) {
        throw new Error("There is no active text editor available.")
      }

      currentPath = editor.getPath()

      if (!currentPath) {
        throw new Error("There is no active filepath available.")
      }
    } catch (e) {
      console.error(e.message)
    }

    const pathToTsc = await resolveModule("typescript/bin/tsc").catch(() =>
      require.resolve("typescript/bin/tsc"),
    )

    for (const projectDir of projectDirs) {
      if (currentPath && projectDir.contains(currentPath)) {
        await initConfig(pathToTsc, projectDir.getPath())
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
      // error handling is done within callback since operation is async
    }
  })
}

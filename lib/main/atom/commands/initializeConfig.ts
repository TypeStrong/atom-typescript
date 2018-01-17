import {commands} from "./registry"
import {execFile} from "child_process"
import * as Resolve from "resolve"

commands.set("typescript:initialize-config", () => {
  return async e => {
    const projectRootPaths = atom.project.getPaths()

    if (!projectRootPaths) {
      e.abortKeyBinding()
      return
    }

    const editor = atom.workspace.getActiveTextEditor()
    let currentlyActivePath

    if (editor !== undefined) {
      currentlyActivePath = editor.getPath()
    }

    const pathToTsc = await resolveModule("typescript/bin/tsc")

    for (const projectRootPath of projectRootPaths) {
      if (currentlyActivePath && currentlyActivePath.includes(projectRootPath)) {
        await initConfig(pathToTsc, projectRootPath)
      }
    }
  }
})

// Promisify the async resolve function
const resolveModule = (id: string): Promise<string> => {
  return new Promise<string>((resolve, reject) =>
    Resolve(id, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    }),
  )
}

const initConfig = (tsc: string, projectRoot: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      execFile(tsc, ["--init"], {
        cwd: projectRoot,
      })
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

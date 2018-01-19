import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"

commands.set("typescript:build", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const fpp = getFilePathPosition()
    if (!fpp) {
      e.abortKeyBinding()
      return
    }
    const {file} = fpp
    const client = await deps.getClient(file)

    const projectInfo = await client.executeProjectInfo({
      file,
      needFileNameList: true,
    })

    const files = new Set(projectInfo.body!.fileNames)
    files.delete(projectInfo.body!.configFileName)
    let filesSoFar = 0
    const promises = [...files.values()].map(f =>
      _finally(client.executeCompileOnSaveEmitFile({file: f, forced: true}), () => {
        deps.statusPanel.update({progress: {max: files.size, value: (filesSoFar += 1)}})
        if (files.size <= filesSoFar) deps.statusPanel.update({progress: undefined})
      }),
    )

    try {
      const results = await Promise.all(promises)
      if (results.some(result => result.body === false)) {
        throw new Error("Emit failed")
      }
      deps.statusPanel.update({buildStatus: {success: true}})
    } catch (err) {
      console.error(err)
      deps.statusPanel.update({buildStatus: {success: false, message: err.message}})
    }
  }
})

function _finally<T>(promise: Promise<T>, callback: (result: T) => void): Promise<T> {
  promise.then(callback, callback)
  return promise
}

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
    const promises = [...files.values()].map(f =>
      _finally(client.executeCompileOnSaveEmitFile({file: f, forced: true}), () => {
        files.delete(file)
      }),
    )

    Promise.all(promises)
      .then(results => {
        if (results.some(result => result.body === false)) {
          throw new Error("Emit failed")
        }

        deps.statusPanel.update({buildStatus: {success: true}})
      })
      .catch(err => {
        console.error(err)
        deps.statusPanel.update({buildStatus: {success: false}})
      })

    deps.statusPanel.update({buildStatus: null})
  }
})

function _finally<T>(promise: Promise<T>, callback: (result: T) => void): Promise<T> {
  promise.then(callback, callback)
  return promise
}

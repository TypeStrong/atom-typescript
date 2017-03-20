import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"

commands.set("typescript:build", deps => {
  return async e => {
    if (!commandForTypeScript(e)) {
      return
    }

    const {file} = getFilePathPosition()
    const client = await deps.getClient(file)

    const projectInfo = await client.executeProjectInfo({
      file,
      needFileNameList: true
    })

    const files = new Set(projectInfo.body!.fileNames)
    const max = files.size
    const promises = [...files.values()].map(file =>
      _finally(client.executeCompileOnSaveEmitFile({file, forced: true}), () => {
        files.delete(file)
        updateStatus()
      })
    )

    Promise.all(promises).then(results => {
      if (results.some(result => result.body === false)) {
        throw new Error("Emit failed")
      }

      deps.statusPanel.setBuildStatus({success: true})
    }).catch(() => {
      deps.statusPanel.setBuildStatus({success: false})
    })

    deps.statusPanel.setBuildStatus(undefined)
    deps.statusPanel.setProgress({max, value: 0})

    function updateStatus() {
      if (files.size === 0) {
        deps.statusPanel.setProgress(undefined)
      } else {
        deps.statusPanel.setProgress({max, value: max - files.size})
      }
    }
  }
})

function _finally<T>(promise: Promise<T>, callback: (result: T) => any): Promise<T> {
  promise.then(callback, callback)
  return promise
}

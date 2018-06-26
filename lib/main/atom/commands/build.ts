import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:build", deps => ({
  description: "Compile all files in project related to current active text editor",
  async didDispatch(editor) {
    const file = editor.getPath()
    if (file === undefined) return
    const client = await deps.getClient(file)

    const projectInfo = await client.execute("projectInfo", {
      file,
      needFileNameList: true,
    })

    const files = new Set(projectInfo.body!.fileNames)
    files.delete(projectInfo.body!.configFileName)
    let filesSoFar = 0
    const stp = deps.getStatusPanel()
    const promises = [...files.values()].map(f =>
      _finally(client.execute("compileOnSaveEmitFile", {file: f, forced: true}), () => {
        stp.update({progress: {max: files.size, value: (filesSoFar += 1)}})
        if (files.size <= filesSoFar) stp.update({progress: undefined})
      }),
    )

    try {
      const results = await Promise.all(promises)
      if (results.some(result => result.body === false)) {
        throw new Error("Emit failed")
      }
      stp.update({buildStatus: {success: true}})
    } catch (error) {
      const err = error as Error
      console.error(err)
      stp.update({buildStatus: {success: false, message: err.message}})
    }
  },
}))

function _finally<T>(promise: Promise<T>, callback: (result: T) => void): Promise<T> {
  promise.then(callback, callback)
  return promise
}

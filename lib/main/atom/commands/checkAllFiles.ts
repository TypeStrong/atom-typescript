import {commands} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"

commands.set("typescript:check-all-files", deps => {
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
    const max = files.size

    // There's no real way to know when all of the errors have been received and not every file from
    // the files set is going to receive a a diagnostic event (typically some d.ts files). To counter
    // that, we cancel the listener and close the progress bar after no diagnostics have been received
    // for some amount of time.
    let cancelTimeout: number | undefined

    const unregister = client.on("syntaxDiag", evt => {
      if (cancelTimeout !== undefined) window.clearTimeout(cancelTimeout)
      cancelTimeout = window.setTimeout(cancel, 500)

      files.delete(evt.file)
      updateStatus()
    })

    deps.statusPanel.update({progress: {max, value: 0}})
    client.executeGetErrForProject({file, delay: 0})

    function cancel() {
      files.clear()
      updateStatus()
    }

    function updateStatus() {
      if (files.size === 0) {
        unregister()
        deps.statusPanel.update({progress: undefined})
      } else {
        deps.statusPanel.update({progress: {max, value: max - files.size}})
      }
    }
  }
})

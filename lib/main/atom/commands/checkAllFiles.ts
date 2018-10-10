import {addCommand} from "./registry"
import {handlePromise} from "../../../utils"

addCommand("atom-text-editor", "typescript:check-all-files", deps => ({
  description: "Typecheck all files in project related to current active text editor",
  async didDispatch(editor) {
    const file = editor.getPath()
    if (file === undefined) return
    const client = await deps.getClient(file)

    const projectInfo = await client.execute("projectInfo", {
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

    const disp = client.on("syntaxDiag", evt => {
      if (cancelTimeout !== undefined) window.clearTimeout(cancelTimeout)
      cancelTimeout = window.setTimeout(cancel, 500)

      files.delete(evt.file)
      handlePromise(updateStatus())
    })

    const stp = deps.getStatusPanel()

    await stp.update({progress: {max, value: 0}})
    await client.execute("geterrForProject", {file, delay: 0})

    async function cancel() {
      files.clear()
      await updateStatus()
    }

    async function updateStatus() {
      if (files.size === 0) {
        disp.dispose()
        await stp.update({progress: undefined})
      } else {
        await stp.update({progress: {max, value: max - files.size}})
      }
    }
  },
}))

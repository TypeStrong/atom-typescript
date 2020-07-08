import * as path from "path"
import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:check-all-files", (deps) => ({
  description: "Typecheck all files in project related to current active text editor",
  async didDispatch(editor) {
    const file = editor.getPath()
    if (file === undefined) return
    const client = await deps.getClient(file)

    const projectInfo = await client.execute("projectInfo", {
      file,
      needFileNameList: true,
    })

    const files = new Set(
      projectInfo.body!.fileNames?.filter(
        (fn) =>
          // filter out obvious potholes
          !fn.endsWith("tsconfig.json") && !fn.includes(`${path.sep}node_modules${path.sep}`),
      ),
    )
    const max = files.size

    // There's no real way to know when all of the errors have been received and not every file from
    // the files set is going to receive a a diagnostic event (typically some d.ts files). To counter
    // that, we cancel the listener and close the progress bar after no diagnostics have been received
    // for some amount of time.
    // That is, if we can't rely on multistep
    if (client.multistepSupported) {
      const disp = client.on("syntaxDiag", (evt) => {
        if ("file" in evt) files.delete(evt.file)
        deps.reportProgress({max, value: max - files.size})
      })

      deps.reportProgress({max, value: 0})
      await client.execute("geterrForProject", {file, delay: 0})
      disp.dispose()
    } else {
      let cancelTimeout: number | undefined

      const disp = client.on("syntaxDiag", (evt) => {
        if (cancelTimeout !== undefined) window.clearTimeout(cancelTimeout)
        cancelTimeout = window.setTimeout(() => {
          files.clear()
          disp.dispose()
          deps.reportProgress({max, value: max})
        }, 2000)

        if ("file" in evt) files.delete(evt.file)
        if (files.size === 0) {
          disp.dispose()
          window.clearTimeout(cancelTimeout)
        }
        deps.reportProgress({max, value: max - files.size})
      })

      deps.reportProgress({max, value: 0})
      await client.execute("geterrForProject", {file, delay: 0})
    }
  },
}))

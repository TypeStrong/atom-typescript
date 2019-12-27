import {File} from "atom"
import {TypescriptServiceClient} from "../../../client/client"
import {handlePromise} from "../../../utils"
import {getOpenEditorsPaths} from "../utils"
import {findNodeAt, prepareNavTree} from "../views/outline/navTreeUtils"
import {NavigationTreeViewModel} from "../views/outline/semanticViewModel"
import {addCommand, Dependencies} from "./registry"

addCommand("atom-text-editor", "typescript:check-related-files", deps => ({
  description: "Typecheck all files in project related to current active text editor",
  async didDispatch(editor) {
    const file = editor.getPath()
    if (file === undefined) return

    const line = editor.getLastCursor().getBufferRow()
    const client = await deps.getClient(file)
    const result = await client.execute("projectInfo", {file, needFileNameList: false})
    const root = result.body ? new File(result.body.configFileName).getParent().getPath() : undefined
    await handleCheckRelatedFilesResult(line, root, file, client, deps.reportProgress)
  },
}))

interface OpenRequestArgs {
  file: string
  fileContent?: string
  projectRootPath?: string
}

const buffer: Set<string> = new Set()

export async function handleCheckRelatedFilesResult(
  line: number,
  root: string | undefined,
  file: string,
  client: TypescriptServiceClient,
  reportProgress: Dependencies["reportProgress"],
): Promise<void> {
  if (root === undefined) return

  const files = new Set([file])
  const opens = Array.from(getOpenEditorsPaths(root))
  const result = await client.execute("navtree", {file})
  const navTree = result.body as NavigationTreeViewModel
  prepareNavTree(navTree)

  const node = findNodeAt(line, line, navTree)
  const openFiles: OpenRequestArgs[] = []
  if (node && node.nameSpan) {
    const location = {file, ...node.nameSpan.start}
    const references = await client.execute("references", location)
    if (references.body && references.body.refs.length > 0)  {
      for (const ref of references.body.refs) {
        if (!files.has(ref.file)) {
          if (opens.indexOf(ref.file) < 0 && !buffer.has(ref.file)) {
            openFiles.push({file: ref.file, projectRootPath: root})
            buffer.add(ref.file)
          }
          files.add(ref.file)
        }
      }
    }
  }

  const max = files.size
  reportProgress({max, value: 0})

  if (openFiles.length > 0) {
    await client.execute("updateOpen", {openFiles})
  }

  // There's no real way to know when all of the errors have been received and not every file from
  // the files set is going to receive a a diagnostic event (typically some d.ts files). To counter
  // that, we cancel the listener and close the progress bar after no diagnostics have been received
  // for some amount of time.
  let cancelTimeout: number | undefined

  const disp = client.on("syntaxDiag", evt => {
    if (cancelTimeout !== undefined) window.clearTimeout(cancelTimeout)
    cancelTimeout = window.setTimeout(cancel, 2000)

    if ("file" in evt) files.delete(evt.file)
    updateStatus()
  })

  await client.execute("geterr", {files: Array.from(files.values()), delay: 0})

  async function dispose() {
    disp.dispose()
    if (buffer.size > 0) {
      const closedFiles = Array.from(buffer.values())
      buffer.clear()

      await client.execute("updateOpen", {closedFiles})
    }
  }

  function cancel() {
    files.clear()
    updateStatus()
  }

  function updateStatus() {
    reportProgress({max, value: max - files.size})
    if (files.size === 0) {
      handlePromise(dispose())
    }
  }
}

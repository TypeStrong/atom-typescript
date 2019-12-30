import {Disposable, File} from "atom"
import {TypescriptServiceClient} from "../../../client/client"
import {getOpenEditorsPaths} from "../utils"
import {findNodeAt, prepareNavTree} from "../views/outline/navTreeUtils"
import {NavigationTreeViewModel} from "../views/outline/semanticViewModel"
import {addCommand} from "./registry"

addCommand("atom-text-editor", "typescript:check-related-files", deps => ({
  description: "Typecheck all files in project related to current active text editor",
  async didDispatch(editor) {
    const file = editor.getPath()
    if (file === undefined) return

    const line = editor.getLastCursor().getBufferRow()
    const client = await deps.getClient(file)
    const result = await client.execute("projectInfo", {file, needFileNameList: false})
    const root = result.body ? new File(result.body.configFileName).getParent().getPath() : undefined
    await client.busyWhile(
      "checkRelatedFiles",
      handleCheckRelatedFilesResult(line, line, root, file, client),
    )
  },
}))

interface OpenRequestArgs {
  file: string
  fileContent?: string
  projectRootPath?: string
}

const files: Set<string> = new Set()
const buffer: Set<string> = new Set()
let disp: Disposable | undefined

export async function handleCheckRelatedFilesResult(
  startLine: number,
  endLine: number,
  root: string | undefined,
  file: string,
  client: TypescriptServiceClient,
): Promise<void> {
  if (files.size !== 0) await cancel()
  if (root === undefined) return

  const navTreeRes = await client.execute("navtree", {file})
  const navTree = navTreeRes.body as NavigationTreeViewModel
  prepareNavTree(navTree)

  const node = findNodeAt(startLine, endLine, navTree)
  const openFiles: OpenRequestArgs[] = []
  if (node && node.nameSpan) {
    const refsRes = await client.execute("references", {file, ...node.nameSpan.start})
    const refs = refsRes.body ? refsRes.body.refs.map(ref => ref.file) : []

    if (refs.length > 0)  {
      const opens = Array.from(getOpenEditorsPaths(root))
      for (const ref of refs) {
        if (!files.has(ref)) {
          if (opens.indexOf(ref) < 0 && !buffer.has(ref)) {
            openFiles.push({file: ref, projectRootPath: root})
            buffer.add(ref)
          }
          files.add(ref)
        }
      }
    }
  }

  if (openFiles.length > 0) {
    await client.execute("updateOpen", {openFiles})
  }

  if (files.size > 0) {
    let cancelTimeout: number | undefined
    disp = client.on("semanticDiag", async evt => {
      if (cancelTimeout !== undefined) window.clearTimeout(cancelTimeout)
      cancelTimeout = window.setTimeout(cancel, 1000)
      files.delete(evt.file)
      await updateStatus()
    })
    await client.execute("geterr", {files: Array.from(files), delay: 0})
  }

  async function cancel() {
    files.clear()
    await updateStatus()
  }

  async function updateStatus() {
    if (files.size === 0) await dispose()
  }

  async function dispose() {
    if (disp !== undefined) {
      disp.dispose()
      disp = undefined
    }
    if (buffer.size > 0) {
      const openedFiles = Array.from(getOpenEditorsPaths(root))
      const closedFiles = Array.from(buffer).filter(buff => !openedFiles.includes(buff))
      buffer.clear()
      await client.execute("updateOpen", {closedFiles})
    }
  }
}

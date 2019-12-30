import {File} from "atom"
import {TypescriptServiceClient} from "../../../client/client"
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
    await handleCheckRelatedFilesResult(line, line, root, file, client, deps.reportProgress)
  },
}))

interface OpenRequestArgs {
  file: string
  fileContent?: string
  projectRootPath?: string
}

const files: Set<string> = new Set()
const buffer: Set<string> = new Set()

export async function handleCheckRelatedFilesResult(
  startLine: number,
  endLine: number,
  root: string | undefined,
  file: string,
  client: TypescriptServiceClient,
  reportProgress: Dependencies["reportProgress"],
): Promise<void> {
  if (root === undefined) return
  if (files.size !== 0) await cancel()

  files.add(file)
  const navTreeRes = await client.execute("navtree", {file})
  const navTree = navTreeRes.body as NavigationTreeViewModel
  prepareNavTree(navTree)

  const node = findNodeAt(startLine, endLine, navTree)
  const openFiles: OpenRequestArgs[] = []
  if (node && node.nameSpan) {
    const referencesRes = await client.execute("references", {file, ...node.nameSpan.start})
    const references = referencesRes.body ? referencesRes.body.refs : []
    if (references.length > 0)  {
      const opens = Array.from(getOpenEditorsPaths(root))
      for (const ref of references) {
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

  const disp = client.on("semanticDiag", async evt => {
    files.delete(evt.file)
    await updateStatus()
  })

  await client.execute("geterr", {files: Array.from(files.values()), delay: 0})

  async function dispose() {
    disp.dispose()
    if (buffer.size > 0) {
      const openedFiles = Array.from(getOpenEditorsPaths(root))
      const closedFiles = Array.from(buffer.values()).filter(buff => !openedFiles.includes(buff))
      buffer.clear()
      await client.execute("updateOpen", {closedFiles})
    }
  }

  async function cancel() {
    files.clear()
    await updateStatus()
  }

  async function updateStatus() {
    // tslint:disable-next-line:strict-type-predicates
    const total = max !== undefined ? max : files.size
    reportProgress({max: total, value: total - files.size})
    if (files.size === 0) await dispose()
  }
}

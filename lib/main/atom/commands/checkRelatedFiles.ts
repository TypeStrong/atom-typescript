import {File} from "atom"
import {Diagnostic, OpenRequest} from "typescript/lib/protocol"
import {GetErrorsFunction, PushErrorFunction} from "../../../client"
import {TypescriptServiceClient} from "../../../client/client"
import {getOpenEditorsPaths, isTypescriptFile} from "../utils"
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
    const root = result.body
      ? new File(result.body.configFileName).getParent().getPath()
      : undefined
    await client.busyWhile(
      "checkRelatedFiles",
      handleCheckRelatedFilesResult(
        line,
        line,
        root,
        file,
        client,
        deps.pushFileError,
        deps.getFileErrors,
      ),
    )
  },
}))

type OpenRequestArgs = OpenRequest["arguments"]

const openedFilesBuffer: Set<string> = new Set()

export async function handleCheckRelatedFilesResult(
  startLine: number,
  endLine: number,
  root: string | undefined,
  file: string,
  client: TypescriptServiceClient,
  pushFileError: PushErrorFunction,
  getFileErrors: GetErrorsFunction,
): Promise<void> {
  if (root === undefined) return

  const files = new Set([file])
  const navTreeRes = await client.execute("navtree", {file})
  const navTree = navTreeRes.body as NavigationTreeViewModel
  prepareNavTree(navTree)

  const node = findNodeAt(startLine, endLine, navTree)
  const updateOpen: OpenRequestArgs[] = []
  setOpenfiles(getFileErrors(file))

  if (node && node.nameSpan) {
    const res = await client.execute("references", {file, ...node.nameSpan.start})
    setOpenfiles(res.body ? res.body.refs.map(ref => ref.file) : [])
  }

  if (updateOpen.length > 0) {
    const openFiles = updateOpen.sort((a, b) => (a.file > b.file ? 1 : -1))
    await client.execute("updateOpen", {openFiles})
  }

  const checkList = makeCheckList()
  for (const filePath of checkList) {
    const res = await client.execute("semanticDiagnosticsSync", {file: filePath})
    pushFileError({
      filePath,
      type: "semanticDiag",
      diagnostics: res.body ? (res.body as Diagnostic[]) : [],
      triggerFile: file,
    })
  }

  if (openedFilesBuffer.size > 0) {
    const openedFiles = getOpenedFilesFromEditor()
    const closedFiles = Array.from(openedFilesBuffer).filter(buff => !openedFiles.includes(buff))
    openedFilesBuffer.clear()
    await client.execute("updateOpen", {closedFiles})
  }

  function setOpenfiles(items: string[]) {
    const openedFiles = getOpenedFilesFromEditor()
    for (const item of items) {
      if (!files.has(item) && isTypescriptFile(item)) {
        if (openedFiles.indexOf(item) < 0 && !openedFilesBuffer.has(item)) {
          updateOpen.push({file: item, projectRootPath: root})
          openedFilesBuffer.add(item)
        }
        files.add(item)
      }
    }
  }

  function getOpenedFilesFromEditor() {
    return Array.from(getOpenEditorsPaths(root))
  }

  function makeCheckList() {
    const list = Array.from(files)
    const first = list.shift() as string
    return [first, ...list.sort((a, b) => (a > b ? 1 : -1))]
  }
}

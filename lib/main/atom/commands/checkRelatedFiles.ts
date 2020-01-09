import {Diagnostic} from "typescript/lib/protocol"
import {GetCheckListFunction, PushErrorFunction} from "../../../client"
import {TypescriptServiceClient} from "../../../client/client"
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

    await deps.reportBusyWhile("checkRelatedFiles", () =>
      handleCheckRelatedFilesResult(
        line,
        line,
        file,
        client,
        deps.pushFileError,
        deps.createFileList,
        deps.clearFileList,
      ),
    )
  },
}))

export async function handleCheckRelatedFilesResult(
  startLine: number,
  endLine: number,
  file: string,
  client: TypescriptServiceClient,
  pushFileError: PushErrorFunction,
  getCheckList: GetCheckListFunction,
  clearCheckList: (file: string) => Promise<void>
): Promise<unknown> {
  const [root] = atom.project.relativizePath(file)
  if (root === null) return

  const navTreeRes = await client.execute("navtree", {file})
  const navTree = navTreeRes.body as NavigationTreeViewModel
  prepareNavTree(navTree)

  const node = findNodeAt(startLine, endLine, navTree)
  let references: string[] = []

  if (node && node.nameSpan) {
    const res = await client.execute("references", {file, ...node.nameSpan.start})
    references = res.body ? res.body.refs.map(ref => ref.file) : []
  }

  const serverPath = ""
  const checkList = await getCheckList(file, references)
  for (const filePath of checkList) {
    const res = await client.execute("semanticDiagnosticsSync", {file: filePath})
    pushFileError(file, {
      filePath,
      serverPath,
      type: "semanticDiag",
      diagnostics: res.body ? (res.body as Diagnostic[]) : [],
    })
  }

  await clearCheckList(file)
}

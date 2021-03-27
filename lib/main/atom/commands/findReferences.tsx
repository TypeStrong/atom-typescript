import {TextEditor} from "atom"
import * as etch from "etch"
import * as fs from "fs"
import {TsView} from "../components/tsView"
import {getFilePathPosition, highlight} from "../utils"
import {HighlightComponent} from "../views/highlightComponent"
import {selectListView} from "../views/simpleSelectionView"
import {addCommand, Dependencies} from "./registry"

addCommand("atom-text-editor", "typescript:find-references", (deps) => ({
  description: "Find where symbol under text cursor is referenced",
  async didDispatch(editor) {
    const location = getFilePathPosition(editor)
    if (!location) return

    const client = await deps.getClient(location.file)
    const result = await client.execute("references", location)
    await handleFindReferencesResult(result, editor, deps.histGoForward)
  },
}))

export async function handleFindReferencesResult(
  result: protocol.ReferencesResponse,
  editor: TextEditor,
  histGoForward: Dependencies["histGoForward"],
): Promise<void> {
  const refs = Promise.all(
    result.body!.refs.map(async (ref) => {
      const fileContents = (
        await new Promise<string>((resolve, reject) =>
          fs.readFile(ref.file, (error, data) => {
            if (error) reject(error)
            else resolve(data.toString("utf-8"))
          }),
        )
      ).split(/\r?\n/g)
      const context =
        ref.contextStart !== undefined && ref.contextEnd !== undefined
          ? fileContents.slice(ref.contextStart.line - 1, ref.contextEnd.line)
          : fileContents
      const fileHlText = (await highlight(context.join("\n"), "source.tsx")).split("\n")
      const lineText = fileHlText[ref.start.line - (ref.contextStart?.line ?? 1)]
      return {...ref, hlText: lineText}
    }),
  )

  const res = await selectListView({
    items: refs,
    itemTemplate: (item, ctx) => {
      return (
        <li>
          <HighlightComponent
            label={atom.project.relativize(item.file)}
            query={ctx.getFilterQuery()}
          />
          <div className="pull-right">line: {item.start.line}</div>
          <TsView highlightedText={item.hlText} />
        </li>
      )
    },
    itemFilterKey: "file",
  })
  if (res) await histGoForward(editor, res)
}

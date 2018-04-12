import {addCommand, Dependencies} from "./registry"
import {commandForTypeScript, getFilePathPosition, spanToRange} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"
import * as protocol from "typescript/lib/protocol"
import * as atom from "atom"
import {TypescriptServiceClient} from "../../../client/client"

interface RefactorAction {
  refactorName: string
  refactorDescription: string
  actionName: string
  actionDescription: string
  inlineable: boolean
}

addCommand("atom-text-editor", "typescript:refactor-selection", deps => ({
  description: "Get a list of applicable refactors to selected code",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }

    const editor = e.currentTarget.getModel()
    const location = getFilePathPosition(editor)
    if (!location) {
      e.abortKeyBinding()
      return
    }
    const selection = editor.getSelectedBufferRange()
    if (selection.isEmpty()) {
      e.abortKeyBinding()
      return
    }
    const client = await deps.getClient(location.file)

    const fileRange: protocol.FileRangeRequestArgs = {
      file: location.file,
      startLine: selection.start.row + 1,
      startOffset: selection.start.column + 1,
      endLine: selection.end.row + 1,
      endOffset: selection.end.column + 1,
    }

    const actions = await getApplicableRefactorsActions(client, fileRange)

    if (actions.length === 0) {
      // TODO Show a "no applicable refactors here" message
      e.abortKeyBinding()
      return
    }

    const selectedAction = await selectListView({
      items: actions,
      itemTemplate: (item, ctx) => {
        return (
          <li>
            <HighlightComponent
              label={`${item.refactorDescription}: ${item.actionDescription}`}
              query={ctx.getFilterQuery()}
            />
          </li>
        )
      },
      itemFilterKey: "actionDescription",
    })

    if (selectedAction !== undefined) {
      await applyRefactors(selectedAction, fileRange, client, deps, editor, e)

      // TODO responseEdits could have renameFilename and renameLocation properties
      // so we can call a rename command.
    }
  },
}))

async function getApplicableRefactorsActions(
  client: TypescriptServiceClient,
  range: protocol.FileRangeRequestArgs,
) {
  const responseApplicable = await client.execute("getApplicableRefactors", range)
  if (responseApplicable.body === undefined || responseApplicable.body.length === 0) {
    return []
  }

  const actions: RefactorAction[] = []
  responseApplicable.body.forEach(refactor => {
    refactor.actions.forEach(action => {
      actions.push({
        refactorName: refactor.name,
        refactorDescription: refactor.description,
        actionName: action.name,
        actionDescription: action.description,
        inlineable: refactor.inlineable !== undefined ? refactor.inlineable : true,
      })
    })
  })

  return actions
}

async function applyRefactors(
  selectedAction: RefactorAction,
  range: protocol.FileRangeRequestArgs,
  client: TypescriptServiceClient,
  deps: Dependencies,
  editor: atom.TextEditor,
  e: atom.CommandEvent,
) {
  const responseEdits = await client.execute("getEditsForRefactor", {
    ...range,
    refactor: selectedAction.refactorName,
    action: selectedAction.actionName,
  })

  if (responseEdits.body === undefined) {
    e.abortKeyBinding()
    return
  }

  for (const edit of responseEdits.body.edits) {
    await deps.withTypescriptBuffer(edit.fileName, async buffer => {
      buffer.buffer.transact(() => {
        for (const change of edit.textChanges.reverse()) {
          editor.setTextInBufferRange(spanToRange(change), change.newText)
        }
      })
    })
  }
}

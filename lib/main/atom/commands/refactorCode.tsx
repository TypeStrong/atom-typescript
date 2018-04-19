import {addCommand, Dependencies} from "./registry"
import {commandForTypeScript, getFilePathPosition} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"
import * as protocol from "typescript/lib/protocol"
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
      atom.notifications.addInfo("AtomTS: No applicable refactors for the selection")
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

    if (selectedAction === undefined) return
    await applyRefactors(selectedAction, fileRange, client, deps)
  },
}))

async function getApplicableRefactorsActions(
  client: TypescriptServiceClient,
  range: protocol.FileRangeRequestArgs,
) {
  const responseApplicable = await getApplicabeRefactors(client, range)
  if (!responseApplicable) return []
  if (responseApplicable.body === undefined || responseApplicable.body.length === 0) {
    return []
  }

  const actions: RefactorAction[] = []
  for (const refactor of responseApplicable.body) {
    for (const action of refactor.actions) {
      actions.push({
        refactorName: refactor.name,
        refactorDescription: refactor.description,
        actionName: action.name,
        actionDescription: action.description,
        inlineable: refactor.inlineable !== undefined ? refactor.inlineable : true,
      })
    }
  }

  return actions
}

async function getApplicabeRefactors(
  client: TypescriptServiceClient,
  range: protocol.FileRangeRequestArgs,
) {
  try {
    return await client.execute("getApplicableRefactors", range)
  } catch {
    return undefined
  }
}

async function applyRefactors(
  selectedAction: RefactorAction,
  range: protocol.FileRangeRequestArgs,
  client: TypescriptServiceClient,
  deps: Dependencies,
) {
  const responseEdits = await client.execute("getEditsForRefactor", {
    ...range,
    refactor: selectedAction.refactorName,
    action: selectedAction.actionName,
  })

  if (responseEdits.body === undefined) return
  const {edits, renameFilename, renameLocation} = responseEdits.body

  await deps.applyEdits(edits)

  if (renameFilename === undefined || renameLocation === undefined) return

  const editor = await atom.workspace.open(renameFilename, {
    searchAllPanes: true,
    initialLine: renameLocation.line - 1,
    initialColumn: renameLocation.offset - 1,
  })
  await atom.commands.dispatch(atom.views.getView(editor), "typescript:rename-refactor")
}

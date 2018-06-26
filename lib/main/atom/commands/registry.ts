import * as Atom from "atom"
import {TypescriptServiceClient} from "../../../client/client"
import {StatusPanel} from "../../atom/components/statusPanel"
import {SemanticViewController} from "../views/outline/semanticViewController"
import {SymbolsViewController} from "../views/symbols/symbolsViewController"
import {ApplyEdits} from "../../pluginManager"
import {EditorPositionHistoryManager} from "../editorPositionHistoryManager"

export interface Dependencies {
  applyEdits: ApplyEdits
  clearErrors(): void
  getClient(filePath: string): Promise<TypescriptServiceClient>
  getStatusPanel(): StatusPanel
  getSemanticViewController(): SemanticViewController
  getSymbolsViewController(): SymbolsViewController
  getEditorPositionHistoryManager(): EditorPositionHistoryManager
}

export type AllowedSelectors = keyof Dispatch

export interface Dispatch {
  "atom-text-editor": (editor: Atom.TextEditor, abort: () => void) => void | Promise<void>
  "atom-workspace": () => void | Promise<void>
}

export type CommandDescription = {
  [Selector in AllowedSelectors]: (deps: Dependencies) => CommandData[Selector]
}

export type CommandData = {
  [Selector in AllowedSelectors]: {
    didDispatch: Dispatch[Selector]
    description: string
    displayName?: string
  }
}

export type CommandDescriptionWithSelector = {
  [Selector in AllowedSelectors]: {
    selector: Selector
    command: string
    desc: CommandDescription[Selector]
  }
}

// To allow using dependency injection, but avoid having to type a lot of boilerplate, we have the
// individual command files register themselves in the below map. When the package is initializing,
// the constructors are passed the deps and return the actual commands handlers.
const commands: Array<CommandDescriptionWithSelector[AllowedSelectors]> = []

export function addCommand<Selector extends AllowedSelectors>(
  selector: Selector,
  command: string,
  desc: CommandDescription[Selector],
) {
  commands.push({selector, command, desc} as CommandDescriptionWithSelector[Selector])
}

export function getCommands() {
  return commands
}

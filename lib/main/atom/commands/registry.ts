import * as Atom from "atom"
import {GetClientFunction} from "../../../client"
import {ApplyEdits} from "../../pluginManager"
import {TBuildStatus, TProgress} from "../components/statusPanel"
import {OpenParams} from "../editorPositionHistoryManager"

export interface Dependencies {
  getClient: GetClientFunction
  applyEdits: ApplyEdits
  clearErrors: () => void
  killAllServers: () => void
  reportProgress: (progress: TProgress) => void
  reportBuildStatus: (status: TBuildStatus | undefined) => void
  toggleSemanticViewController: () => void
  toggleFileSymbolsView: (ed: Atom.TextEditor) => void
  toggleProjectSymbolsView: (ed: Atom.TextEditor) => void
  histGoForward: (ed: Atom.TextEditor, openParams: OpenParams) => Promise<object>
  histGoBack: () => Promise<object | undefined>
  histShowHistory: () => Promise<void>
  showTooltipAt: (ed: Atom.TextEditor) => void
  showSigHelpAt: (ed: Atom.TextEditor) => void
  hideSigHelpAt: (ed: Atom.TextEditor) => boolean
  rotateSigHelp: (ed: Atom.TextEditor, shift: number) => boolean
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
  commands.push({selector, command, desc} as unknown as CommandDescriptionWithSelector[Selector])
}

export function getCommands() {
  return commands
}

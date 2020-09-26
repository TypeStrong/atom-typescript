import {DisposableLike} from "atom"
import {
  BusySignalService,
  CodeActionProvider,
  CodeHighlightProvider,
  DatatipService,
  DefinitionProvider,
  FindReferencesProvider,
  HyperclickProvider,
  OutlineProvider,
  SignatureHelpRegistry,
} from "atom-ide-base"
import * as packageDeps from "atom-package-deps"
import {AutocompleteProvider} from "atom/autocomplete-plus"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"
import etch from "etch"
import {handlePromise} from "../utils"
import {SemanticView, SemanticViewSerializationData} from "./atom/views/outline/semanticView"
import {State} from "./packageState"
import {PluginManager} from "./pluginManager"

let pluginManager: PluginManager | undefined

export function activate(state: State) {
  etch.setScheduler(atom.views)
  pluginManager = new PluginManager(state)

  setImmediate(() => handlePromise(checkAndInstallDependencies()))
}

async function checkAndInstallDependencies() {
  const packagesProvidingUIServices = ["atom-ide-ui", "linter", "nuclide"]
  if (!packagesProvidingUIServices.some((p) => atom.packages.isPackageLoaded(p))) {
    await packageDeps.install("atom-typescript", true)
  }
}

export function deactivate() {
  if (pluginManager) pluginManager.destroy()
  pluginManager = undefined
}

export function serialize() {
  if (pluginManager) return pluginManager.serialize()
  else return undefined
}

export function deserializeSemanticView(serialized: SemanticViewSerializationData): SemanticView {
  return SemanticView.create(serialized.data)
}

////////////////////////////////// Consumers ///////////////////////////////////
export function consumeLinter(
  register: (opts: {name: string}) => IndieDelegate,
): DisposableLike | void {
  if (pluginManager) return pluginManager.consumeLinter(register)
}

export function consumeStatusBar(statusBar: StatusBar): DisposableLike | void {
  if (pluginManager) return pluginManager.consumeStatusBar(statusBar)
}

export function consumeDatatipService(datatipService: DatatipService): DisposableLike | void {
  if (pluginManager) return pluginManager.consumeDatatipService(datatipService)
}

export function consumeSignatureHelp(registry: SignatureHelpRegistry): DisposableLike | void {
  if (pluginManager) return pluginManager.consumeSigHelpService(registry)
}

export function consumeBusySignal(busySignalService: BusySignalService): DisposableLike | void {
  if (pluginManager) return pluginManager.consumeBusySignal(busySignalService)
}

////////////////////////////////// Providers ///////////////////////////////////
export function provideAutocomplete(): AutocompleteProvider[] | undefined {
  if (pluginManager) return pluginManager.provideAutocomplete()
}

export function provideIntentions() {
  if (pluginManager) return pluginManager.provideIntentions()
}

export function provideIntentionsHighlight() {
  if (pluginManager) return pluginManager.provideIntentionsHighlight()
}

export function provideCodeActions(): CodeActionProvider | undefined {
  if (pluginManager) return pluginManager.provideCodeActions()
}

export function provideHyperclick(): HyperclickProvider | undefined {
  if (pluginManager) return pluginManager.provideHyperclick()
}

export function provideReferences(): FindReferencesProvider | undefined {
  if (pluginManager) return pluginManager.provideReferences()
}

export function provideOutlines(): OutlineProvider | undefined {
  if (pluginManager) return pluginManager.provideOutlines()
}

export function provideDefinitions(): DefinitionProvider | undefined {
  if (pluginManager) return pluginManager.provideDefinitions()
}

export function provideCodeHighlight(): CodeHighlightProvider | undefined {
  if (pluginManager) return pluginManager.provideCodeHighlight()
}

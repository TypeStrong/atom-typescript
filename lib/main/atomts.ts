import * as Atom from "atom"
import * as tsconfig from "tsconfig/dist/tsconfig"
import {attach as attachRenameView} from "./atom/views/renameView"
import {AutocompleteProvider} from "./atom/autoCompleteProvider"
import {ClientResolver} from "../client/clientResolver"
import {getHyperclickProvider} from "./atom/hyperclickProvider"
import {CodefixProvider, IntentionsProvider, CodeActionsProvider} from "./atom/codefix"
import {CompositeDisposable} from "atom"
import {debounce} from "lodash"
import {ErrorPusher} from "./errorPusher"
import {flatten, values} from "lodash"
import {IndieDelegate} from "atom/linter"
import {StatusBar} from "atom/status-bar"
import {StatusPanel} from "./atom/components/statusPanel"
import {TypescriptEditorPane} from "./typescriptEditorPane"
import {TypescriptBuffer} from "./typescriptBuffer"

// globals
const subscriptions: CompositeDisposable = new CompositeDisposable()
export const clientResolver: ClientResolver = new ClientResolver()
const panes: TypescriptEditorPane[] = []
const statusPanel: StatusPanel = StatusPanel.create()
const errorPusher: ErrorPusher = new ErrorPusher()
const codefixProvider: CodefixProvider = new CodefixProvider(clientResolver)

// Register all custom components
import "./atom/components"
import {registerCommands} from "./atom/commands"

export async function activate() {
  const pns = atom.packages.getAvailablePackageNames()
  if (!(pns.includes("atom-ide-ui") || pns.includes("linter"))) {
    await require("atom-package-deps").install("atom-typescript", true)
  }

  // Add the rename view
  const {renameView} = attachRenameView()

  errorPusher.setUnusedAsInfo(atom.config.get("atom-typescript.unusedAsInfo"))
  subscriptions.add(
    atom.config.onDidChange("atom-typescript.unusedAsInfo", val => {
      errorPusher.setUnusedAsInfo(val.newValue)
    }),
  )

  codefixProvider.errorPusher = errorPusher
  codefixProvider.getTypescriptBuffer = getTypescriptBuffer

  clientResolver.on("pendingRequestsChange", () => {
    const pending = flatten(values(clientResolver.clients).map(cl => cl.pending))
    statusPanel.setPending(pending)
  })

  // Register the commands
  registerCommands({
    clearErrors() {
      errorPusher.clear()
    },
    getTypescriptBuffer,
    async getClient(filePath: string) {
      const pane = panes.find(p => p.filePath === filePath)
      if (pane && pane.client) {
        return pane.client
      }

      return clientResolver.get(filePath)
    },
    renameView,
    statusPanel,
  })

  let activePane: TypescriptEditorPane | undefined

  const onSave = debounce((pane: TypescriptEditorPane) => {
    if (!pane.client) {
      return
    }

    const files: string[] = []
    for (const p of panes.sort((a, b) => a.activeAt - b.activeAt)) {
      if (p.filePath && p.isTypescript && p.client === p.client) {
        files.push(p.filePath)
      }
    }

    pane.client.executeGetErr({files, delay: 100})
  }, 50)

  subscriptions.add(
    atom.workspace.observeTextEditors((editor: Atom.TextEditor) => {
      panes.push(
        new TypescriptEditorPane(editor, {
          getClient: (filePath: string) => clientResolver.get(filePath),
          onClose(filePath) {
            // Clear errors if any from this file
            errorPusher.setErrors("syntaxDiag", filePath, [])
            errorPusher.setErrors("semanticDiag", filePath, [])
          },
          onDispose(pane) {
            if (activePane === pane) {
              activePane = undefined
            }

            panes.splice(panes.indexOf(pane), 1)
          },
          onSave,
          statusPanel,
        }),
      )
    }),
  )

  activePane = panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor())

  if (activePane) {
    activePane.onActivated()
  }

  subscriptions.add(
    atom.workspace.onDidChangeActiveTextEditor((editor?: Atom.TextEditor) => {
      if (activePane) {
        activePane.onDeactivated()
        activePane = undefined
      }

      const pane = panes.find(p => p.editor === editor)
      if (pane) {
        activePane = pane
        pane.onActivated()
      }
    }),
  )
}

export function deactivate() {
  subscriptions.dispose()
}

export function consumeLinter(register: (opts: {name: string}) => IndieDelegate) {
  const linter = register({
    name: "Typescript",
  })

  errorPusher.setLinter(linter)

  clientResolver.on("diagnostics", ({type, filePath, diagnostics}) => {
    errorPusher.setErrors(type, filePath, diagnostics)
  })
}

export function consumeStatusBar(statusBar: StatusBar) {
  let statusPriority = 100
  for (const panel of statusBar.getRightTiles()) {
    if (atom.views.getView(panel.getItem()).tagName === "GRAMMAR-SELECTOR-STATUS") {
      statusPriority = panel.getPriority() - 1
    }
  }
  statusBar.addRightTile({
    item: statusPanel,
    priority: statusPriority,
  })

  subscriptions.add(statusPanel)
}

// Registering an autocomplete provider
export function provideAutocomplete() {
  return [new AutocompleteProvider(clientResolver, {getTypescriptBuffer})]
}

export function provideIntentions() {
  return new IntentionsProvider(codefixProvider)
}

export function provideCodeActions(): CodeActionsProvider {
  return new CodeActionsProvider(codefixProvider)
}

export function hyperclickProvider() {
  return getHyperclickProvider(clientResolver)
}

async function getProjectConfigPath(sourcePath: string): Promise<string> {
  const client = await clientResolver.get(sourcePath)
  const result = await client.executeProjectInfo({
    needFileNameList: false,
    file: sourcePath,
  })
  return result.body!.configFileName
}

interface TSConfig {
  formatCodeOptions: protocol.FormatCodeSettings
}

export async function loadProjectConfig(
  sourcePath: string,
  configFile?: string,
): Promise<TSConfig> {
  return tsconfig.readFile(configFile || (await getProjectConfigPath(sourcePath)))
}

// Get Typescript buffer for the given path
async function getTypescriptBuffer(filePath: string) {
  const pane = panes.find(p => p.filePath === filePath)
  if (pane) {
    return {
      buffer: pane.buffer,
      isOpen: true,
    }
  }

  // Wait for the buffer to load before resolving the promise
  const buffer = await Atom.TextBuffer.load(filePath)

  return {
    buffer: new TypescriptBuffer(buffer, fp => clientResolver.get(fp)),
    isOpen: false,
  }
}

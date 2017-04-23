import * as Atom from "atom"
import * as tsconfig from "tsconfig/dist/tsconfig"
import {attach as attachRenameView} from './atom/views/renameView'
import {AutocompleteProvider} from './atom/autoCompleteProvider'
import {ClientResolver} from "../client/clientResolver"
import {CompositeDisposable} from "atom"
import {debounce} from "lodash"
import {ErrorPusher} from "./errorPusher"
import {flatten, values} from "lodash"
import {LinterRegistry, Linter} from "../typings/linter"
import {StatusBar} from "../typings/status_bar"
import {StatusPanel} from "./atom/components/statusPanel"
import {TypescriptEditorPane} from "./typescriptEditorPane"
import {TypescriptBuffer} from "./typescriptBuffer"

// globals
const subscriptions = new CompositeDisposable()
export const clientResolver = new ClientResolver()
const panes: TypescriptEditorPane[] = []

// Register all custom components
import "./atom/components"
import {registerCommands} from "./atom/commands"

let linter: Linter
let statusBar: StatusBar

interface PackageState {}

export function activate(state: PackageState) {
  require('atom-package-deps').install('atom-typescript', true).then(() => {

    let statusPriority = 100
    for (const panel of statusBar.getRightTiles()) {
      if (panel.getItem().tagName === "GRAMMAR-SELECTOR-STATUS") {
        statusPriority = panel.getPriority() - 1
      }
    }

    // Add the rename view
    const {renameView} = attachRenameView()
    const statusPanel = StatusPanel.create()

    statusBar.addRightTile({
      item: statusPanel,
      priority: statusPriority
    })

    subscriptions.add(statusPanel)
    const errorPusher = new ErrorPusher()
    errorPusher.setUnusedAsInfo(atom.config.get("atom-typescript.unusedAsInfo"))
    subscriptions.add(atom.config.onDidChange("atom-typescript.unusedAsInfo",
      (val: {oldValue: boolean, newValue: boolean}) => {
        errorPusher.setUnusedAsInfo(val.newValue)
      }
    ))

    clientResolver.on("pendingRequestsChange", () => {
      const pending = flatten(values(clientResolver.clients).map(cl => cl.pending))
      statusPanel.setPending(pending)
    })

    if (linter) {
      errorPusher.setLinter(linter)

      clientResolver.on("diagnostics", ({type, filePath, diagnostics}) => {
        errorPusher.setErrors(type, filePath, diagnostics)
      })
    }

    // Register the commands
    registerCommands({
      clearErrors() {
        errorPusher.clear()
      },
      getTypescriptBuffer,
      async getClient(filePath: string) {
        const pane = panes.find(pane => pane.filePath === filePath)
        if (pane) {
          return pane.client
        }

        return clientResolver.get(filePath)
      },
      renameView,
      statusPanel,
    })

    let activePane: TypescriptEditorPane | undefined

    const onSave = debounce((pane: TypescriptEditorPane) => {
      if (!pane.client)
        return

      const files = panes
        .sort((a, b) => a.activeAt - b.activeAt)
        .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
        .map(pane => pane.filePath)

      pane.client.executeGetErr({files, delay: 100})

    }, 50)

    subscriptions.add(atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
      panes.push(new TypescriptEditorPane(editor, {
        getClient: (filePath: string) => clientResolver.get(filePath),
        onDispose(pane) {
          if (activePane === pane) {
            activePane = undefined
          }

          panes.splice(panes.indexOf(pane), 1)

          // Clear errors if any from this pane
          errorPusher.setErrors("syntaxDiag", pane.filePath, [])
          errorPusher.setErrors("semanticDiag", pane.filePath, [])
        },
        onSave,
        statusPanel,
      }))
    }))

    activePane = panes.find(pane => pane.editor === atom.workspace.getActiveTextEditor())

    if (activePane) {
      activePane.onActivated()
    }

    subscriptions.add(atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
      if (activePane) {
        activePane.onDeactivated()
        activePane = undefined
      }

      if (atom.workspace.isTextEditor(editor)) {
        const pane = panes.find(pane => pane.editor === editor)
        if (pane) {
          activePane = pane
          pane.onActivated()
        }
      }
    }))
  })
}

export function deactivate() {
  subscriptions.dispose()
}

export function serialize(): PackageState {
  return {}
}

export function consumeLinter(registry: LinterRegistry) {
  linter = registry.register({
    name: "Typescript"
  })
}

export function consumeStatusBar(_statusBar: StatusBar) {
  statusBar = _statusBar
}

// Registering an autocomplete provider
export function provide() {
  return [
    new AutocompleteProvider(clientResolver, {getTypescriptBuffer}),
  ]
}

export var config = {
  unusedAsInfo: {
    title: 'Show unused values with severity info',
    description: 'Show unused values with severety \'info\' instead of \'error\'',
    type: 'boolean',
    default: true
  }
}

export function loadProjectConfig(sourcePath: string): Promise<tsconfig.TSConfig> {
  return clientResolver.get(sourcePath).then(client => {
    return client.executeProjectInfo({needFileNameList: false, file: sourcePath}).then(result => {
      return tsconfig.load(result.body!.configFileName)
    })
  })
}

// Get Typescript buffer for the given path
async function getTypescriptBuffer(filePath: string) {
  const pane = panes.find(pane => pane.filePath === filePath)
  if (pane) {
    return {
      buffer: pane.buffer,
      isOpen: true
    }
  }

  // Wait for the buffer to load before resolving the promise
  const buffer = await new Promise<TextBuffer.ITextBuffer>(resolve => {
    const buffer = new Atom.TextBuffer({
      filePath,
      load: true
    })

    buffer.onDidReload(() => {
      resolve(buffer)
    })
  })

  return {
    buffer: new TypescriptBuffer(buffer, filePath => clientResolver.get(filePath)),
    isOpen: false
  }
}

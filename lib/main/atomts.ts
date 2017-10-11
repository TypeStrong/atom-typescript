import * as Atom from "atom"
import * as tsconfig from "tsconfig/dist/tsconfig"
import {attach as attachRenameView} from "./atom/views/renameView"
import {AutocompleteProvider} from "./atom/autoCompleteProvider"
import {ClientResolver} from "../client/clientResolver"
import {getHyperclickProvider} from "./atom/hyperclickProvider"
import {CodefixProvider} from "./atom/codefixProvider"
import {CompositeDisposable} from "atom"
import {debounce} from "lodash"
import {ErrorPusher} from "./errorPusher"
import {flatten, values} from "lodash"
import {RegisterLinter, Linter} from "../typings/linter"
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
const codefixProvider = new CodefixProvider(clientResolver)

interface PackageState {}

export function activate(state: PackageState) {
  require("atom-package-deps")
    .install("atom-typescript", true)
    .then(() => {
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
        priority: statusPriority,
      })

      subscriptions.add(statusPanel)
      const errorPusher = new ErrorPusher()
      errorPusher.setUnusedAsInfo(atom.config.get("atom-typescript.unusedAsInfo"))
      subscriptions.add(
        atom.config.onDidChange(
          "atom-typescript.unusedAsInfo",
          (val: {oldValue: boolean; newValue: boolean}) => {
            errorPusher.setUnusedAsInfo(val.newValue)
          },
        ),
      )

      codefixProvider.errorPusher = errorPusher
      codefixProvider.getTypescriptBuffer = getTypescriptBuffer

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
        if (!pane.client) return

        const files = panes
          .sort((a, b) => a.activeAt - b.activeAt)
          .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
          .map(pane => pane.filePath)

        pane.client.executeGetErr({files, delay: 100})
      }, 50)

      subscriptions.add(
        atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
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
        atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
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
        }),
      )
    })
}

export function deactivate() {
  subscriptions.dispose()
}

export function serialize(): PackageState {
  return {}
}

export function consumeLinter(register: RegisterLinter) {
  linter = register({
    name: "Typescript",
  })
}

export function consumeStatusBar(_statusBar: StatusBar) {
  statusBar = _statusBar
}

// Registering an autocomplete provider
export function provide() {
  return [new AutocompleteProvider(clientResolver, {getTypescriptBuffer})]
}

export function provideIntentions() {
  return codefixProvider
}

export function hyperclickProvider() {
  return getHyperclickProvider(clientResolver)
}

export var config = {
  unusedAsInfo: {
    title: "Show unused values with severity info",
    description: "Show unused values with severity 'info' instead of 'error'",
    type: "boolean",
    default: true,
  },
}

export async function getProjectConfigPath(sourcePath: string): Promise<string> {
  const client = await clientResolver.get(sourcePath)
  const result = await client.executeProjectInfo({needFileNameList: false, file: sourcePath})
  return result.body!.configFileName
}

export async function loadProjectConfig(sourcePath: string, configFile?: string): Promise<any> {
  return tsconfig.readFile(configFile || (await getProjectConfigPath(sourcePath)))
}

// Get Typescript buffer for the given path
async function getTypescriptBuffer(filePath: string) {
  const pane = panes.find(pane => pane.filePath === filePath)
  if (pane) {
    return {
      buffer: pane.buffer,
      isOpen: true,
    }
  }

  // Wait for the buffer to load before resolving the promise
  const buffer = await new Promise<TextBuffer.ITextBuffer>(resolve => {
    const buffer = new Atom.TextBuffer({
      filePath,
      load: true,
    })

    buffer.onDidReload(() => {
      resolve(buffer)
    })
  })

  return {
    buffer: new TypescriptBuffer(buffer, filePath => clientResolver.get(filePath)),
    isOpen: false,
  }
}

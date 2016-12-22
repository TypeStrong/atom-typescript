console.log("be initializing them package")
console.profile("atomts init")

const startTime = process.hrtime()

// import {getFileStatus} from "./atom/fileStatusCache"
// import {$} from "atom-space-pen-views"
import {ClientResolver} from "../client/clientResolver"
import {CompositeDisposable} from "atom"
import {debounce} from "lodash"
import {ErrorPusher} from "./error_pusher"
import {LinterRegistry, Linter} from "../typings/linter"
import {StatusBar} from "../typings/status_bar"
import {TypescriptEditorPane} from "./typescript_editor_pane"
import {StatusPanel} from "./atom/components/statusPanel"
import * as atomConfig from './atom/atomConfig'
// import * as atomUtils from './atom/atomUtils'
import {AutocompleteProvider} from './atom/autoCompleteProvider'
import * as commands from "./atom/commands/commands"
// import * as fs from 'fs'
import * as hyperclickProvider from "../hyperclickProvider"
// import * as path from 'path'
import * as renameView from './atom/views/renameView'
import * as tsconfig from "tsconfig/dist/tsconfig"
import {flatten, values} from "lodash"

// globals
const subscriptions = new CompositeDisposable()
export const clientResolver = new ClientResolver()
export const config = atomConfig.schema

let linter: Linter
let statusBar: StatusBar

interface PackageState {}

export function activate(state: PackageState) {
    require('atom-package-deps').install('atom-typescript').then(() => {

      let statusPriority = 100
      for (const panel of statusBar.getRightTiles()) {
        if (panel.getItem().tagName === "GRAMMAR-SELECTOR-STATUS") {
          statusPriority = panel.getPriority() - 1
        }
      }

      const statusPanel = StatusPanel.create()

      statusBar.addRightTile({
        item: statusPanel,
        priority: statusPriority
      })

      subscriptions.add(statusPanel)

      const errorPusher = new ErrorPusher()

      clientResolver.on("pendingRequestsChange", () => {
        const pending = flatten(values(clientResolver.clients).map(cl => cl.pending))
        statusPanel.setPending(pending)
      })

      if (linter) {
        errorPusher.setLinter(linter)

        clientResolver.on("diagnostics", ({type, serverPath, filePath, diagnostics}) => {
          errorPusher.addErrors(type + serverPath, filePath, diagnostics)
        })
      }

      // Add the rename view
      renameView.attach()

      // Register the commands
      commands.registerCommands({clientResolver})

      const panes: TypescriptEditorPane[] = []

      const onSave = debounce((pane: TypescriptEditorPane) => {
        console.log("checking errors for all panes for", pane.filePath)

        const files = panes
          .sort((a, b) => a.activeAt - b.activeAt)
          .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
          .map(pane => pane.filePath)

        pane.client.executeGetErr({files, delay: 100})

      }, 50)

      subscriptions.add(atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
        panes.push(new TypescriptEditorPane(editor, {
          onDispose(pane) {
            if (activePane === pane) {
              activePane = null
            }

            panes.splice(panes.indexOf(pane), 1)
          },
          onSave,
          statusPanel,
        }))
      }))

      let activePane: TypescriptEditorPane = panes.find(pane =>
        pane.editor === atom.workspace.getActiveTextEditor())

      if (activePane) {
        activePane.onActivated()
      }

      subscriptions.add(atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
        if (activePane) {
          activePane.onDeactivated()
          activePane = null
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
    return {};
}

export function consumeLinter(registry: LinterRegistry) {
    console.log("consume linter")

    linter = registry.register({
      name: ""
    })

    console.log("linter is", linter)
}

export function consumeStatusBar(_statusBar) {
  statusBar = _statusBar
}

// Registering an autocomplete provider
export function provide() {
  return [
    new AutocompleteProvider(clientResolver),
  ]
}

export function getHyperclickProvider() {
  return hyperclickProvider;
}

export function loadProjectConfig(sourcePath: string): Promise<tsconfig.TSConfig> {
  return clientResolver.get(sourcePath).then(client => {
    return client.executeProjectInfo({needFileNameList: false, file: sourcePath}).then(result => {
      return tsconfig.load(result.body.configFileName)
    })
  })
}

console.profileEnd()
console.log("init took", process.hrtime(startTime))

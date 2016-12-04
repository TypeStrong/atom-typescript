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
import {TypescriptEditorPane} from "./typescript_editor_pane"
import * as atomConfig from './atom/atomConfig'
// import * as atomUtils from './atom/atomUtils'
import * as autoCompleteProvider from './atom/autoCompleteProvider'
import * as commands from "./atom/commands/commands"
// import * as fs from 'fs'
import * as hyperclickProvider from "../hyperclickProvider"
import * as mainPanel from "../main/atom/views/mainPanelView"
import * as mainPanelView from "./atom/views/mainPanelView"
// import * as path from 'path'
import * as renameView from './atom/views/renameView'
import * as tsconfig from "tsconfig/dist/tsconfig"

// globals
export const clientResolver = new ClientResolver()
export const config = atomConfig.schema
let linter: Linter
const errorPusher = new ErrorPusher()
const subscriptions = new CompositeDisposable()

interface PackageState {}

clientResolver.on("pendingRequestsChange", () => {
  // We only start once the panel view is initialized
  if (!mainPanel.panelView) return;

  const pending = Object.keys(clientResolver.clients)
    .map(serverPath => clientResolver.clients[serverPath].pending)

  mainPanel.panelView.updatePendingRequests([].concat.apply([], pending))
})

export function activate(state: PackageState) {
    require('atom-package-deps').install('atom-typescript').then(() => {

      if (linter) {
        errorPusher.setLinter(linter)

        clientResolver.on("diagnostics", ({type, serverPath, filePath, diagnostics}) => {
          errorPusher.addErrors(type + serverPath, filePath, diagnostics)
        })
      }

      mainPanelView.attach()
      mainPanelView.hide()

      // Add the rename view
      renameView.attach()

      // Register the commands
      commands.registerCommands()

      const panes: TypescriptEditorPane[] = []

      const checkErrors = debounce((pane: TypescriptEditorPane) => {
        console.log("checking errors for all panes for", pane.filePath)

        const files = panes
          .sort((a, b) => a.activeAt - b.activeAt)
          .filter(_pane => _pane.filePath && _pane.isTypescript && _pane.client === pane.client)
          .map(pane => pane.filePath)

        pane.client.executeGetErr({files, delay: 100})

      }, 50)

      subscriptions.add(atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {
        panes.push(new TypescriptEditorPane(editor, {
          checkErrors
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

// Registering an autocomplete provider
export function provide() {
    return [autoCompleteProvider.provider];
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

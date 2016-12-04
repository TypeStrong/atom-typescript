console.log("be initializing them package")
console.profile("atomts init")

const startTime = process.hrtime()

import {$} from "atom-space-pen-views"
import {debounce} from "lodash"
import {ClientResolver} from "../client/clientResolver"
import {getFileStatus} from "./atom/fileStatusCache"
import * as atomConfig from './atom/atomConfig'
import * as atomUtils from './atom/atomUtils'
import * as autoCompleteProvider from './atom/autoCompleteProvider'
import * as commands from "./atom/commands/commands"
import * as fs from 'fs'
import * as hyperclickProvider from "../hyperclickProvider"
import * as mainPanel from "../main/atom/views/mainPanelView"
import * as mainPanelView from "./atom/views/mainPanelView"
import * as path from 'path'
import * as renameView from './atom/views/renameView'
import * as tooltipManager from './atom/tooltipManager'
import * as tsconfig from "tsconfig/dist/tsconfig"
import {spanToRange} from "./utils/tsUtil"
import {LinterRegistry, Linter} from "../typings/linter"
import {ErrorPusher} from "./error_pusher"

// globals
export const clientResolver = new ClientResolver()
export const config = atomConfig.schema
let linter: Linter
let errorPusher: ErrorPusher
let statusBarMessage
let editorWatch: AtomCore.Disposable
let autoCompleteWatch: AtomCore.Disposable

interface PackageState {}

clientResolver.on("pendingRequestsChange", () => {
  // We only start once the panel view is initialized
  if (!mainPanel.panelView) return;

  const pending = Object.keys(clientResolver.clients)
    .map(serverPath => clientResolver.clients[serverPath].pending)

  mainPanel.panelView.updatePendingRequests([].concat.apply([], pending))
})

var hideIfNotActiveOnStart = debounce(() => {
    // Only show if this editor is active:
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTsRelated(editor)) {
        mainPanelView.hide();
    }
}, 100);

export function activate(state: PackageState) {
    console.log("activating them package", state)

    require('atom-package-deps').install('atom-typescript').then(() => {

    if (linter) {
      errorPusher = new ErrorPusher(linter)

      clientResolver.on("diagnostics", ({type, serverPath, filePath, diagnostics}) => {
        errorPusher.addErrors(type + serverPath, filePath, diagnostics)
      })
    }

    mainPanelView.attach();

    // Add the rename view
    renameView.attach();

    // Observe changed active editor
    atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
        console.log("did change active panel", editor)

        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();

            updatePanelConfig(filePath);

            mainPanelView.panelView.updateFileStatus(filePath);
            mainPanelView.show();
        }
        else if (atomUtils.onDiskAndTsRelated(editor)){
            mainPanelView.show();
        }
        else {
            mainPanelView.hide();
        }
    });

    // Observe editors loading
    editorWatch = atom.workspace.observeTextEditors(async function(editor: AtomCore.IEditor) {
        let filePath = editor.getPath()
        console.log("opened editor", filePath)

        let client = await clientResolver.get(filePath)
        console.log("found client for editor", {filePath, client})

        // subscribe for tooltips
        // inspiration : https://github.com/chaika2013/ide-haskell
        var editorView = $(atom.views.getView(editor))
        tooltipManager.attach(editorView, editor)

        var ext = path.extname(filePath);
        if (atomUtils.isAllowedExtension(ext)) {
            try {
                client.executeOpen({
                  file: filePath,
                  fileContent: editor.getText()
                })

                updatePanelConfig(filePath);

                // We only do analysis once the file is persisted to disk
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }

                // Setup the TS reporter:
                hideIfNotActiveOnStart();

                if (onDisk) {

                    client.executeGetErr({files: [filePath], delay: 100})

                    // // Set errors in project per file
                    // parent.updateText({ filePath: filePath, text: editor.getText() })
                    //     .then(() => parent.errorsForFile({ filePath: filePath }))
                    //     .then((resp) => errorView.setErrors(filePath, resp.errors));
                    //
                    // // Comparing potential emit to the existing js file
                    // parent.getOutputJsStatus({ filePath: filePath }).then((res) => {
                    //     let status = getFileStatus(filePath);
                    //     status.emitDiffers = res.emitDiffers;
                    //
                    //     // Update status if the file compared above is currently in the active editor
                    //     let ed = atom.workspace.getActiveTextEditor();
                    //     if (ed && ed.getPath() === filePath) {
                    //         mainPanelView.panelView.updateFileStatus(filePath);
                    //     }
                    // });
                }

                const markers: AtomCore.IDisplayBufferMarker[] = []

                editor.onDidChangeCursorPosition(() => {
                  for (const marker of markers) {
                    marker.destroy()
                  }

                  const pos = editor.getLastCursor().getBufferPosition()

                  client.executeOccurances({
                    file: filePath,
                    line: pos.row+1,
                    offset: pos.column+1
                  }).then(result => {
                    for (const ref of result.body) {
                      const marker = editor.markBufferRange(spanToRange(ref))
                      editor.decorateMarker(marker as any, {
                        type: "highlight",
                        class: "atom-typescript-occurrence"
                      })
                      markers.push(marker)
                    }
                  }).catch(() => null)
                })

                // Observe editors changing
                var changeObserver = editor.onDidStopChanging(() => {

                    // The condition is required because on initial load this event fires
                    // on every opened file, not just the active one
                    if (editor === atom.workspace.getActiveTextEditor()) {
                        let status = getFileStatus(filePath);
                        status.modified = editor.isModified();
                        mainPanelView.panelView.updateFileStatus(filePath);
                    }

                    // If the file isn't saved and we just show an error to guide the user
                    if (!onDisk) {
                        console.log("file is not on disk..")
                        return
                    }

                    // Set errors in project per file
                    client.executeGetErr({files: [filePath], delay: 100})

                    // TODO: provide function completions
                    /*var position = atomUtils.getEditorPosition(editor);
                    signatureProvider.requestHandler({
                        program: program,
                        editor: editor,
                        filePath: filePath,
                        position: position
                    });*/

                });

                var fasterChangeObserver: AtomCore.Disposable = (<any>editor.buffer).onDidChange((diff: { oldRange: TextBuffer.IRange; newRange: TextBuffer.IRange; oldText: string; newText: string }) => {

                    //// For debugging
                    // console.log(buffer.characterIndexForPosition(diff.oldRange.start), buffer.characterIndexForPosition(diff.oldRange.end), diff.oldText,
                    //     buffer.characterIndexForPosition(diff.newRange.start), buffer.characterIndexForPosition(diff.newRange.end), diff.newText);
                    //// Examples
                    //// 20 20 "aaaa" 20 20 ""
                    //// 23 23 "" 23 24 "a"
                    //// 20 20 "" 20 24 "aaaa"
                    // stack();

                    client.executeChange({
                      endLine: diff.oldRange.end.row+1,
                      endOffset: diff.oldRange.end.column+1,
                      file: editor.getPath(),
                      line: diff.oldRange.start.row+1,
                      offset: diff.oldRange.start.column+1,
                      insertString: diff.newText,
                    })

                    // For debugging the language service going out of sync
                    // console.log(JSON.stringify({oldText,newText}));
                    // promise.then(() => {
                    //     parent.debugLanguageServiceHostVersion({filePath:atom.workspace.getActiveTextEditor().getPath()})
                    //         .then((res)=>{
                    //             console.log(JSON.stringify({real:editor.buffer.getText()}));
                    //             console.log(JSON.stringify({lang:res.text}));
                    //             console.log(editor.getText() == res.text);
                    //         });
                    // });
                });

                // Observe editors saving
                var saveObserver = editor.onDidSave(async function(event) {
                    console.log("saved", editor.getPath())

                    onDisk = true
                    // If this is a saveAs event.path will be different so we should change it

                    if (filePath !== event.path) {
                      console.log("file path changed to", event.path)
                      client = await clientResolver.get(event.path)
                    }

                    filePath = event.path
                });

                // Observe editors closing
                var destroyObserver = editor.onDidDestroy(() => {
                    client.executeClose({file: editor.getPath()})

                    // Clear editor observers
                    changeObserver.dispose();
                    fasterChangeObserver.dispose();
                    saveObserver.dispose();
                    destroyObserver.dispose();

                });

            } catch (ex) {
                console.error('Solve this in atom-typescript', ex);
                throw ex;
            }
        }
    });

    // Register the commands
    commands.registerCommands();

    })
}

/** Update the panel with the configu resolved from the given source file */
function updatePanelConfig(filePath: string) {
  clientResolver.get(filePath).then(client => {
    client.executeProjectInfo({
      needFileNameList: false,
      file: filePath
    }).then(result => {
      mainPanelView.panelView.setTsconfigInUse(result.body.configFileName)
    }, err => {
      mainPanelView.panelView.setTsconfigInUse('');
    })
  })
}

export function deactivate() {
    if (statusBarMessage) statusBarMessage.destroy();
    if (editorWatch) editorWatch.dispose();
    if (autoCompleteWatch) autoCompleteWatch.dispose();
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

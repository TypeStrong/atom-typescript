console.log("be initializing them package")
console.profile("atomts init")
const start = process.hrtime()

import atomConfig = require('./atom/atomConfig');
import {makeTsGlobal} from "../typescript/makeTypeScriptGlobal";
makeTsGlobal(atomConfig.typescriptServices);

import path = require('path');
import fs = require('fs');
import os = require('os');
import * as _ from "lodash"

import {errorView} from "./atom/views/mainPanelView";

///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./atom/autoCompleteProvider'); ///ts:import:generated
///ts:import=tooltipManager
import tooltipManager = require('./atom/tooltipManager'); ///ts:import:generated
///ts:import=signatureProvider
import signatureProvider = require('./atom/signatureProvider'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atom/atomUtils'); ///ts:import:generated
import commands = require("./atom/commands/commands");
///ts:import=onSaveHandler
import onSaveHandler = require('./atom/onSaveHandler'); ///ts:import:generated
///ts:import=debugAtomTs
import debugAtomTs = require('./atom/debugAtomTs'); ///ts:import:generated
///ts:import=typescriptGrammar
import typescriptGrammar = require('./atom/typescriptGrammar'); ///ts:import:generated
import _atom = require('atom');
import {$} from "atom-space-pen-views";

import documentationView = require('./atom/views/documentationView');
import renameView = require('./atom/views/renameView');
import mainPanelView = require("./atom/views/mainPanelView");
import {getFileStatus} from "./atom/fileStatusCache";

import editorSetup = require("./atom/editorSetup");

// globals
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;
var autoCompleteWatch: AtomCore.Disposable;

export interface PackageState {}

import parent = require('../worker/parent');

// Export config
export var config = atomConfig.schema;
import {debounce} from "./lang/utils";

import {LinterRegistry, Linter} from "../linter"

let linter: Linter

var hideIfNotActiveOnStart = debounce(() => {
    // Only show if this editor is active:
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTsRelated(editor)) {
        mainPanelView.hide();
    }
}, 100);

const attachViews = _.once(() => {
    mainPanelView.attach();

    // Add the documentation view
    documentationView.attach();

    // Add the rename view
    renameView.attach();
})

/** only called once we have our dependencies */
function readyToActivate() {

    // Observe changed active editor
    atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();

            attachViews()
            updatePanelConfig(filePath);

            // // Refresh errors stuff on change active tab.
            // // Because the fix might be in the other file
            // // or the other file might have made this file have an error
            // parent.errorsForFile({ filePath: filePath })
            //     .then((resp) => {
            //         errorView.setErrors(filePath, resp.errors)
            //         atomUtils.triggerLinter();
            //     });

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

        let client = await parent.clients.get(filePath)
        console.log("found client for editor", {filePath, client})

        // subscribe for tooltips
        // inspiration : https://github.com/chaika2013/ide-haskell
        var editorView = $(atom.views.getView(editor))
        tooltipManager.attach(editorView, editor)

        var ext = path.extname(filePath);
        if (atomUtils.isAllowedExtension(ext)) {

            // Listen for error events for this file and display them
            const unsubSyntax = client.on("syntaxDiag", diag => {
              // console.log("syntax errors", diag)
            })

            const unsubSemantic = client.on("semanticDiag", diag => {
              if (diag.file === filePath) {
                console.log("semantic errors", diag)

                errorView.setErrors(filePath, diag.diagnostics.map(error => {
                  const preview = editor.buffer.getTextInRange(
                    new _atom.Range(
                      [error.start.line-1, error.start.offset-1],
                      [error.end.line-1, error.end.offset-1]))

                  return {
                    filePath: filePath,
                    startPos: {line: error.start.line - 1, col: error.start.offset - 1},
                    endPos: {line: error.end.line - 1, col: error.end.offset - 1},
                    message: ts.flattenDiagnosticMessageText(error.text, '\n'),
                    preview
                  }


                }))
              }
            })


            let isTst = ext === '.tst';
            try {
                // Only once stuff
                attachViews()

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

                debugAtomTs.runDebugCode({ filePath, editor });

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

                // Setup additional observers on the editor
                editorSetup.setupEditor(editor);

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
                        var root = { line: 0, col: 0 };
                        errorView.setErrors(filePath,
                            [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]
                            );
                        return;
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

                var buffer = editor.buffer;
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
                var saveObserver = editor.onDidSave((event) => {
                    console.log("saved", editor.getPath())
                    onDisk = true;
                    // If this is a saveAs event.path will be different so we should change it
                    filePath = event.path;
                    // onSaveHandler.handle({ filePath: filePath, editor: editor });
                });

                // Observe editors closing
                var destroyObserver = editor.onDidDestroy(() => {
                    client.executeClose({file: editor.getPath()})

                    // Clear errors in view
                    errorView.setErrors(filePath, []);

                    // Clear editor observers
                    changeObserver.dispose();
                    fasterChangeObserver.dispose();
                    saveObserver.dispose();
                    destroyObserver.dispose();

                    unsubSemantic()
                    unsubSyntax()
                });

            } catch (ex) {
                console.error('Solve this in atom-typescript', ex);
                throw ex;
            }
        }
    });

    // Register the commands
    commands.registerCommands();
}

/** Update the panel with the configu resolved from the given source file */
function updatePanelConfig(filePath: string) {
  parent.clients.get(filePath).then(client => {
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

export function activate(state: PackageState) {
    console.log("activating them package", state)

    atom.workspace.observeTextEditors(function(editor){
        console.log("opened editor", editor)

        editor.observeGrammar(function(grammar) {
            console.log("observed grammar", grammar)
        })
    })

    // require('atom-package-deps').install('atom-typescript').then(readyToActivate)
}

export function deactivate() {
    if (statusBarMessage) statusBarMessage.destroy();
    if (editorWatch) editorWatch.dispose();
    if (autoCompleteWatch) autoCompleteWatch.dispose();

    parent.stopWorker();
}

export function serialize(): PackageState {
    return {};
}

export function deserialize() {
    /* do any tear down here */
}

export function consumeLinter(registry: LinterRegistry) {
    console.log("consume this")

    linter = registry.register({
        name: "Typescript"
    })

    console.log("got linter", linter)
}

// Registering an autocomplete provider
export function provide() {
    return [autoCompleteProvider.provider];
}

import * as hyperclickProvider from "../hyperclickProvider";
export function getHyperclickProvider() {
  return hyperclickProvider;
}

console.profileEnd()
console.log("init took", process.hrtime(start))

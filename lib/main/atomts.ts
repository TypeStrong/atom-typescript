import atomConfig = require('./atom/atomConfig');
import {makeTsGlobal} from "../typescript/makeTypeScriptGlobal";
makeTsGlobal(atomConfig.typescriptServices);

import path = require('path');
import fs = require('fs');
import os = require('os');

// Make sure we have the packages we depend upon
var apd = require('atom-package-dependencies');

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

import editorSetup = require("./atom/editorSetup");

// globals
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;
var autoCompleteWatch: AtomCore.Disposable;

export interface PackageState {
}

import parent = require('../worker/parent');

// Export config
export var config = atomConfig.schema;
import {debounce} from "./lang/utils";

var hideIfNotActiveOnStart = debounce(() => {
    // Only show if this editor is active:
    var editor = atom.workspace.getActiveTextEditor();
    if (!atomUtils.onDiskAndTs(editor)) {
        mainPanelView.hide();
    }
}, 100);


/** only called once we have our dependencies */
function readyToActivate() {

    // Add the documentation view
    documentationView.attach();

    // Add the rename view
    renameView.attach();

    // Start a ts worker
    parent.startWorker();

    // Load our custom code based grammar
    (<any>atom).grammars.addGrammar(new typescriptGrammar.TypeScriptSemanticGrammar((<any>atom).grammars));

    // Streaming tests
    /*for (var i = 0; i < 100; i++) {
        (() => {
            var index = i;
            var repeat = index.toString() + ' ';
            var message = '';
            for (var j = 0; j < 100; j++) {
                message = message + repeat;
            }
            parent.echo({ echo: 'awesome ' + message, num: i }).then((res) => {
                console.log('index: ' + index, res);
            });
        })();
    }*/

    // Observe changed active editor
    atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();

            // Refresh errors stuff on change active tab.
            // Because the fix might be in the other file
            // or the other file might have made this file have an error
            parent.errorsForFile({ filePath: filePath })
                .then((resp) => errorView.setErrors(filePath, resp.errors));

            mainPanelView.show();
        }
        else {
            mainPanelView.hide();
        }
    });

    // Observe editors loading
    editorWatch = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {

        // subscribe for tooltips
        // inspiration : https://github.com/chaika2013/ide-haskell
        var editorView = $(atom.views.getView(editor));
        tooltipManager.attach(editorView, editor);

        var filePath = editor.getPath();
        var ext = path.extname(filePath);
        if (ext == '.ts') {
            try {
                // We only do analysis once the file is persisted to disk
                var onDisk = false;
                if (fs.existsSync(filePath)) {
                    onDisk = true;
                }

                // Setup the TS reporter:
                mainPanelView.attach();
                hideIfNotActiveOnStart();

                debugAtomTs.runDebugCode({ filePath, editor });

                // Set errors in project per file
                if (onDisk) {
                    parent.updateText({ filePath: filePath, text: editor.getText() })
                        .then(() => parent.errorsForFile({ filePath: filePath }))
                        .then((resp) => errorView.setErrors(filePath, resp.errors));
                }

                // Setup additional observers on the editor
                editorSetup.setupEditor(editor);

                // Observe editors changing
                var changeObserver = editor.onDidStopChanging(() => {

                    // If the file isn't saved and we just show an error to guide the user
                    if (!onDisk) {
                        var root = { line: 0, col: 0 };
                        errorView.setErrors(filePath,
                            [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]
                            );
                        return;
                    }

                    // Set errors in project per file
                    parent.errorsForFile({ filePath: filePath })
                        .then((resp) => errorView.setErrors(filePath, resp.errors));

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
                var fasterChangeObserver: AtomCore.Disposable = (<any>editor.buffer).onDidChange((diff: { oldRange; newRange; oldText: string; newText: string }) => {

                    //// For debugging
                    // console.log(buffer.characterIndexForPosition(diff.oldRange.start), buffer.characterIndexForPosition(diff.oldRange.end), diff.oldText,
                    //     buffer.characterIndexForPosition(diff.newRange.start), buffer.characterIndexForPosition(diff.newRange.end), diff.newText);
                    //// Examples
                    //// 20 20 "aaaa" 20 20 ""
                    //// 23 23 "" 23 24 "a"
                    //// 20 20 "" 20 24 "aaaa"

                    // Atom only gives you an `\n` as diff but it sometimes inserts \r\n. Facepalm.
                    var newText = diff.newText;
                    // console.log(JSON.stringify({txt:newText}));
                    // This works reliably
                    newText = editor.buffer.getTextInRange(diff.newRange);

                    // use this for faster language service host
                    var minChar = buffer.characterIndexForPosition(diff.oldRange.start);
                    var limChar = minChar + diff.oldText.length;

                    var promise = parent.editText({ filePath, minChar, limChar, newText });

                    // For debugging the language service going out of sync
                    // promise.then(()=>{
                    //     parent.debugLanguageServiceHostVersion({filePath:atom.workspace.getActiveEditor().getPath()})
                    //         .then((res)=>{
                    //             console.log(JSON.stringify({real:editor.getText()}));
                    //             console.log(JSON.stringify({lang:res.text}));
                    //             console.log(editor.getText() == res.text);
                    //         });
                    // });
                });

                // Observe editors saving
                var saveObserver = editor.onDidSave((event) => {
                    onDisk = true;
                    // If this is a saveAs event.path will be different so we should change it
                    filePath = event.path;
                    onSaveHandler.handle({ filePath: filePath, editor: editor });
                });

                // Observe editors closing
                var destroyObserver = editor.onDidDestroy(() => {
                    // Clear errors in view
                    errorView.setErrors(filePath, []);

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
}

export function activate(state: PackageState) {

    // Don't activate if we have a dependency that isn't available
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');

    if (!linter || !acp) {
        var notification = atom.notifications.addInfo('AtomTS: Some dependencies not found. Running "apm install" on these for you. Please wait for a success confirmation!', { dismissable: true });
        apd.install(function() {
            atom.notifications.addSuccess("AtomTS: Dependencies installed correctly. Enjoy TypeScript \u2665", { dismissable: true });
            notification.dismiss();

            // Packages don't get loaded automatically as a result of an install
            if (!apd.require('linter')) atom.packages.loadPackage('linter');
            if (!apd.require('autocomplete-plus')) atom.packages.loadPackage('autocomplete-plus');

            // Hazah activate them and then activate us!
            atom.packages.activatePackage('linter').then(() => atom.packages.activatePackage('autocomplete-plus')).then(() => readyToActivate());
        });

        return;
    }

    readyToActivate();
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

// Registering an autocomplete provider
export function provide() {
    return [autoCompleteProvider.provider];
}

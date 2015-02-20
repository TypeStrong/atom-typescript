///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import path = require('path');
import fs = require('fs');

// Make sure we have the packages we depend upon
var apd = require('../../apd'); // Moved here because I customized it

///ts:import=errorView
import errorView = require('./atom/errorView'); ///ts:import:generated
///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./atom/autoCompleteProvider'); ///ts:import:generated
///ts:import=tooltipManager
import tooltipManager = require('./atom/tooltipManager'); ///ts:import:generated
///ts:import=signatureProvider
import signatureProvider = require('./atom/signatureProvider'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atom/atomUtils'); ///ts:import:generated
///ts:import=commands
import commands = require('./atom/commands'); ///ts:import:generated
///ts:import=onSaveHandler
import onSaveHandler = require('./atom/onSaveHandler'); ///ts:import:generated
///ts:import=debugAtomTs
import debugAtomTs = require('./atom/debugAtomTs'); ///ts:import:generated
///ts:import=typescriptGrammar
import typescriptGrammar = require('./atom/typescriptGrammar'); ///ts:import:generated
import _atom = require('atom');


import documentationView = require('./atom/views/documentationView');
import renameView = require('./atom/views/renameView');


// globals
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;
var autoCompleteWatch: AtomCore.Disposable;

export interface PackageState {
}

import parent = require('../worker/parent');

// Export config
import atomConfig = require('./atom/atomConfig');
export var config = atomConfig.schema;

export function activate(state: PackageState) {

    // Don't activate if we have a dependency that isn't available
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    var projectManager = apd.require('project-manager');
    if (!projectManager) {
        atom.notifications.addInfo('AtomTS: project-manager not found. Running "apm install project-manager" for you.')
    }

    if (!linter || !acp || !projectManager) {
        apd.install(function() {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });

        return;
    }

    // Add the documentation view
    documentationView.attach();

    // Add the rename view
    renameView.attach();

    // Start a ts worker
    parent.startWorker();

    // Load our custom code based grammar
    (<any>atom).grammars.addGrammar(new typescriptGrammar.TypeScriptSemanticGrammar((<any>atom).grammars));

    // Streaming tests
    /*for (var i = 0; i < 10000; i++) {
        (() => {
            var index = i;
            var repeat = index.toString() + ' ';
            var message = '';
            for (var j = 0; j < 1000; j++) {
                message = message + repeat;
            }
            parent.echo({ echo: 'awesome ' + message }).then((res) => {
                console.log('index: ' + index, res);
            });
        })();
    }*/

    // Observe changed active editor
    atom.workspace.onDidChangeActivePaneItem((editor: AtomCore.IEditor) => {
        if (atomUtils.onDiskAndTs(editor)) {
            var filePath = editor.getPath();
            parent.errorsForFile({ filePath: filePath })
                .then((resp) => errorView.setErrors(filePath, resp.errors));
        }
    });

    // Observe editors loading
    editorWatch = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {

        // subscribe for tooltips
        // inspiration : https://github.com/chaika2013/ide-haskell
        var editorView = _atom.$(atom.views.getView(editor));
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

                // Setup the error reporter:
                errorView.start();
                debugAtomTs.runDebugCode({ filePath, editor });

                // Observe editors changing
                var changeObserver = editor.onDidStopChanging(() => {

                    // If the file isn't saved and we just show an error to guide the user
                    if (!onDisk) {
                        var root = { line: 0, ch: 0 };
                        errorView.setErrors(filePath,
                            [{ startPos: root, endPos: root, filePath: filePath, message: "Please save file for it be processed by TypeScript", preview: "" }]
                            );
                        return;
                    }

                    var text = editor.getText();

                    // Update the file in the worker
                    parent.updateText({ filePath: filePath, text: text })
                    // Set errors in project per file
                        .then(() => parent.errorsForFile({ filePath: filePath }))
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
    return { providers: [autoCompleteProvider.provider] };
}

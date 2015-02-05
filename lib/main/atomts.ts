///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import path = require('path');
import fs = require('fs');

// Make sure we have the packages we depend upon
var apd = require('../../apd'); // Moved here because I customized it

///ts:import=programManager
import programManager = require('./lang/programManager'); ///ts:import:generated
///ts:import=errorView
import errorView = require('./atom/errorView'); ///ts:import:generated
///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./atom/autoCompleteProvider'); ///ts:import:generated
///ts:import=buildView
import buildView = require('./atom/buildView'); ///ts:import:generated
///ts:import=tooltipManager
import tooltipManager = require('./atom/tooltipManager'); ///ts:import:generated
///ts:import=signatureProvider
import signatureProvider = require('./atom/signatureProvider'); ///ts:import:generated
///ts:import=atomUtils
import atomUtils = require('./atom/atomUtils'); ///ts:import:generated

// globals
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;
var autoCompleteWatch: AtomCore.Disposable;

export interface PackageState {
}

import parent = require('../worker/parent');

export function activate(state: PackageState) {

    // Don't activate if we have a dependency that isn't available
    var linter = apd.require('linter');
    var acp = apd.require('autocomplete-plus');
    if (!linter || !acp) {
        apd.install(function() {
            atom.notifications.addSuccess("Some dependent packages were required for atom-typescript. These are now installed. Best you restart atom just this once.", { dismissable: true });
        });

        return;
    }

    // Start a ts worker
    parent.startWorker();

    // Streaming tests
    /*for (var i = 0; i < 10000; i++) {
        (() => {
            var index = i;
            var repeat = index.toString() + ' ';
            var message = '';
            for (var j = 0; j < 1000; j++) {
                message = message + repeat;
            }
            parent.echo({ echo: 'awesome ' + message },(res) => {
                console.log('index: ' + index, res);
            });
        })();
    }*/


    /*child.send({
        message: 'echo',
        data: { name: 'bas' }
    });*/

    // This is dodgy non-documented stuff
    // subscribe for tooltips
    atom.workspaceView.eachEditorView((editorView) => {
        tooltipManager.attach(editorView);
    });

    // Observe editors loading
    editorWatch = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {

        var filePath = editor.getPath();
        var filename = path.basename(filePath);
        var ext = path.extname(filename);

        if (ext == '.ts') {
            try {
                // We only create a "program" once the file is persisted to disk
                var program: programManager.Program;
                if (fs.existsSync(filePath)) {
                    program = programManager.getOrCreateProgram(filePath);
                }

                // Setup the error reporter:
                errorView.start();

                // Observe editors changing
                var changeObserver = editor.onDidStopChanging(() => {

                    // If we don't have the program yet. The file isn't saved and we just show an error to guide the user
                    if (!program) {
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
                        .then(() => parent.getErrorsForFile({ filePath: filePath }))
                        .then((resp) => errorView.setErrors(filePath, resp.errors));

                    // Update the file
                    program.languageServiceHost.updateScript(filePath, text);


                    // TODO: provide function completions
                    var position = atomUtils.getEditorPosition(editor);
                    signatureProvider.requestHandler({
                        program: program,
                        editor: editor,
                        filePath: filePath,
                        position: position
                    });

                });

                // Observe editors saving
                var saveObserver = editor.onDidSave((event) => {
                    if (!program) {
                        program = programManager.getOrCreateProgram(filePath);
                    };

                    // TODO: store by file path
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    var output = program.emitFile(filePath);
                    errorView.showEmittedMessage(output);
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

    // Registering an autocomplete provider
    autoCompleteWatch = atom.services.provide('autocomplete.provider', '1.0.0', { provider: autoCompleteProvider });

    // Utility functions for commands
    function commandForTypeScript(e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor) return e.abortKeyBinding() && false;
        if (path.extname(editor.getPath()) !== '.ts') return e.abortKeyBinding() && false;

        return true;
    }
    function commandGetProgram() {
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        return programManager.getOrCreateProgram(filePath);
    }

    // Setup custom commands NOTE: these need to be added to the keymaps
    atom.commands.add('atom-text-editor', 'typescript:format-code',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            var cursorPosition = editor.getCursorBufferPosition();
            var result = program.formatDocument(filePath, { line: cursorPosition.row, ch: cursorPosition.column });
            var top = editor.getScrollTop();
            editor.setText(result.formatted);
            editor.setCursorBufferPosition([result.cursor.line, result.cursor.ch]);
            editor.setScrollTop(top);
        } else {
            var formatted = program.formatDocumentRange(filePath, { line: selection.start.row, ch: selection.start.column }, { line: selection.end.row, ch: selection.end.column });
            editor.setTextInBufferRange(selection, formatted);
        }
    });
    atom.commands.add('atom-text-editor', 'typescript:build',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();

        atom.notifications.addInfo('Building');

        parent.build({filePath:filePath}).then((resp)=>{
            buildView.setBuildOutput(resp.outputs);
        });
    });
    atom.commands.add('atom-text-editor', 'typescript:go-to-declaration',(e) => {
        if (!commandForTypeScript(e)) return;

        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var program = programManager.getOrCreateProgram(filePath);
        var range = editor.getSelectedBufferRange();
        var position = program.languageServiceHost.getIndexFromPosition(filePath, { line: range.start.row, ch: range.start.column });
        var definitions = program.languageService.getDefinitionAtPosition(filePath, position);
        if (!definitions || !definitions.length) return;

        // Potential future ugly hack for something (atom or TS langauge service) path handling
        // definitions.forEach((def)=> def.fileName.replace('/',path.sep));

        // TODO: support multiple implementations. For now we just go to first
        var definition = definitions[0];
        var newFilePath = definition.fileName;
        var newFileProgram = program; // If we can get the filename *we are in the same program :P*
        var newFilePosition = newFileProgram.languageServiceHost.getPositionFromIndex(newFilePath, definition.textSpan.start());

        atom.open({
            // The file open command line is 1 indexed
            pathsToOpen: [definition.fileName + ":" + (newFilePosition.line + 1).toString()],
            newWindow: false
        });
    });
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

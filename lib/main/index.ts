///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import path = require('path');

// Make sure we have the packages we depend upon
var apd = require('atom-package-dependencies');
///ts:import=programManager
import programManager = require('./lang/programManager'); ///ts:import:generated
///ts:import=errorView
import errorView = require('./atom/errorView'); ///ts:import:generated
///ts:import=autoCompleteProvider
import autoCompleteProvider = require('./atom/autoCompleteProvider'); ///ts:import:generated
///ts:import=buildView
import buildView = require('./atom/buildView'); ///ts:import:generated

// globals
var statusBar;
var statusBarMessage;
var editorWatch: AtomCore.Disposable;
var autoCompleteWatch: AtomCore.Disposable;

export interface PackageState {
}

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

    // Observe editors happening
    editorWatch = atom.workspace.observeTextEditors((editor: AtomCore.IEditor) => {

        var filePath = editor.getPath();
        var filename = path.basename(filePath);
        var ext = path.extname(filename);

        if (ext == '.ts') {
            try {
                var program = programManager.getOrCreateProgram(filePath);

                // Setup the error reporter:
                errorView.start();

                // Observe editors changing
                editor.onDidStopChanging(() => {

                    // Update the file
                    program.languageServiceHost.updateScript(filePath, editor.getText());

                    // Set errors in project per file
                    errorView.setErrors(filePath, programManager.getErrorsForFile(filePath));

                    // TODO: provide function completions
                    var cursor = editor.getCursorBufferPosition();
                    var cursorPos = program.languageServiceHost.getIndexFromPosition(filePath, { line: cursor.row, ch: cursor.column });
                    // console.log(program.languageService.getSignatureHelpItems(filePath,cursorPos));

                });

                // Observe editors saving
                editor.onDidSave((event) => {
                    // TODO: store by file path
                    program.languageServiceHost.updateScript(filePath, editor.getText());
                    var output = program.emitFile(filePath);
                    errorView.showEmittedMessage(output);
                });

                // Observe editors closing
                editor.onDidDestroy(() => {
                    // Clear errors in view
                    errorView.setErrors(filePath, []);
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

        atom.notifications.addInfo('Building');
        var outputs = commandGetProgram().build();
        buildView.setBuildOutput(outputs);
    });
}

export function deactivate() {
    if (statusBarMessage) statusBarMessage.destroy();
    if (editorWatch) editorWatch.dispose();
    if (autoCompleteWatch) autoCompleteWatch.dispose();
}

export function serialize(): PackageState {
    return {};
}

export function deserialize() {
    /* do any tear down here */
}
